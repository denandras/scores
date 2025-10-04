// Centralized logic for resolving the upload prefix used for storing files.
// Precedence: S4_PREFIX > S4_UPLOAD_PREFIX > UPLOAD_PREFIX > default constant.
// Ensures a single trailing slash.

export const DEFAULT_UPLOAD_PREFIX = '01 Uploads/';

export function resolveUploadPrefix(): string {
  const raw = (process.env.S4_PREFIX
    ?? process.env.S4_UPLOAD_PREFIX
    ?? process.env.UPLOAD_PREFIX
    ?? DEFAULT_UPLOAD_PREFIX);
  const trimmed = (raw || '').trim();
  if (!trimmed) return DEFAULT_UPLOAD_PREFIX; // fallback safety
  return trimmed.endsWith('/') ? trimmed : trimmed + '/';
}
