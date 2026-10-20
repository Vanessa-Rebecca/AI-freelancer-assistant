import { useEffect, useState } from 'react';

type ApiStatus = 'checking' | 'ok' | 'down';

// Placeholder until routing arrives in Step 1.15: proves the proxy reaches the API
export function App() {
  const [status, setStatus] = useState<ApiStatus>('checking');

  useEffect(() => {
    fetch('/api/v1/health')
      .then((res) => setStatus(res.ok ? 'ok' : 'down'))
      .catch(() => setStatus('down'));
  }, []);

  const label = { checking: 'Checking…', ok: 'Connected', down: 'Unreachable' }[status];
  const colour = { checking: 'text-muted', ok: 'text-success', down: 'text-danger' }[status];

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 shadow-sm">
        <h1 className="text-2xl font-semibold">AI Freelancer Assistant</h1>
        <p className="mt-2 text-muted">Frontend is running.</p>
        <p className="mt-6 text-sm">
          API: <span className={`font-medium ${colour}`}>{label}</span>
        </p>
      </div>
    </main>
  );
}
