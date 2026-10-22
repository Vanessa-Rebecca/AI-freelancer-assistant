import type { AuthResponse } from '@afa/shared';

// Mirrors the API's { error: { code, message, details } } shape
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// Access token lives in memory only (never localStorage), so injected scripts
// can't read it. A reload loses it and AuthProvider restores it via refresh.
let accessToken: string | null = null;
let onSessionExpired: () => void = () => {};

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function setSessionExpiredHandler(handler: () => void) {
  onSessionExpired = handler;
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
};

async function send(path: string, { method = 'GET', body, signal }: RequestOptions) {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  return fetch(`/api/v1${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  });
}

async function parse<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const err = json?.error;
    throw new ApiError(
      res.status,
      err?.code ?? 'NETWORK_ERROR',
      err?.message ?? 'Something went wrong. Please try again.',
      err?.details,
    );
  }
  return json.data as T;
}

// One refresh at a time: concurrent 401s share it instead of racing, which
// the server's rotation would treat as token reuse.
let refreshing: Promise<AuthResponse | null> | null = null;

export function refreshSession() {
  refreshing ??= doRefresh().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

async function doRefresh(): Promise<AuthResponse | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch('/api/v1/auth/refresh', { method: 'POST' });
    if (res.ok) {
      const data = await parse<AuthResponse>(res);
      setAccessToken(data.accessToken);
      return data;
    }
    // Another tab may have just rotated the token; its new cookie is in place
    // a moment later, so one retry covers that case.
    if (attempt === 0) await new Promise((r) => setTimeout(r, 500));
  }
  setAccessToken(null);
  return null;
}

// Endpoints where 401 means "wrong credentials", not "access token expired"
const NO_REFRESH_PATHS = new Set([
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/logout',
  '/auth/forgot-password',
  '/auth/reset-password',
]);

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let res = await send(path, options);

  // Expired access token: refresh once and retry the original request
  if (res.status === 401 && !NO_REFRESH_PATHS.has(path)) {
    const session = await refreshSession();
    if (!session) {
      onSessionExpired();
      return parse<T>(res);
    }
    res = await send(path, options);
  }
  return parse<T>(res);
}
