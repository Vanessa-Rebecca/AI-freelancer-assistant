import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from 'node:crypto';

// OWASP-recommended scrypt parameters: ~16 MB of memory per hash, which keeps
// several concurrent logins safe on a 512 MB server.
const PARAMS = { N: 2 ** 14, r: 8, p: 5 };
const KEY_LENGTH = 64;
const SALT_BYTES = 16;

function deriveKey(password: string, salt: Buffer, options: ScryptOptions) {
  return new Promise<Buffer>((resolve, reject) => {
    // Runs on libuv's thread pool, so it doesn't block other requests
    scrypt(password, salt, KEY_LENGTH, { ...options, maxmem: 64 * 1024 * 1024 }, (err, key) =>
      err ? reject(err) : resolve(key),
    );
  });
}

// Stored as scrypt$N$r$p$salt$hash so parameters can be raised later
// without invalidating existing hashes.
export async function hashPassword(password: string) {
  const salt = randomBytes(SALT_BYTES);
  const key = await deriveKey(password, salt, PARAMS);
  const { N, r, p } = PARAMS;
  return `scrypt$${N}$${r}$${p}$${salt.toString('base64')}$${key.toString('base64')}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [algorithm, N, r, p, salt, hash] = stored.split('$');
  if (algorithm !== 'scrypt' || !N || !r || !p || !salt || !hash) return false;

  const expected = Buffer.from(hash, 'base64');
  const actual = await deriveKey(password, Buffer.from(salt, 'base64'), {
    N: Number(N),
    r: Number(r),
    p: Number(p),
  });
  // Constant-time comparison so response timing reveals nothing about the hash
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
