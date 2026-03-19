import { randomUUID } from 'node:crypto';

function two(n: number): string {
  return String(n).padStart(2, '0');
}

export function buildUploadObjectKey(prefix: string, safeFilename: string): string {
  const now = new Date();
  const yyyy = String(now.getUTCFullYear());
  const mm = two(now.getUTCMonth() + 1);
  const dd = two(now.getUTCDate());
  const hh = two(now.getUTCHours());
  const min = two(now.getUTCMinutes());
  const ss = two(now.getUTCSeconds());
  const unique = randomUUID().slice(0, 8);

  // Date partitioning keeps uploads organized and UUID avoids name collisions.
  const datePrefix = `${yyyy}/${mm}/${dd}/`;
  const stamp = `${yyyy}-${mm}-${dd}_${hh}-${min}-${ss}`;
  return `${prefix}${datePrefix}${stamp}-${unique}-${safeFilename}`;
}