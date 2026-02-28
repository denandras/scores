// Centralized logic for resolving the upload prefix used for storing files.
// Precedence: S4_PREFIX > S4_UPLOAD_PREFIX > UPLOAD_PREFIX > default constant.
// Ensures a single trailing slash.

export const DEFAULT_UPLOAD_PREFIX = '01 Upload/';

export function resolveUploadPrefix(): string {
  const raw = (process.env.S4_PREFIX
    ?? process.env.S4_UPLOAD_PREFIX
    ?? process.env.UPLOAD_PREFIX
    ?? DEFAULT_UPLOAD_PREFIX);
  const trimmed = (raw || '').trim();
  if (!trimmed) return DEFAULT_UPLOAD_PREFIX; // fallback safety
  const normalized = trimmed.endsWith('/') ? trimmed : trimmed + '/';
  if (/^01 Uploads\/?$/i.test(normalized)) return DEFAULT_UPLOAD_PREFIX;
  if (/^_?uploads?\/?$/i.test(normalized)) return DEFAULT_UPLOAD_PREFIX;
  return normalized;
}
