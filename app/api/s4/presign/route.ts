import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';

export const runtime = 'nodejs';

const endpoint = (process.env.S4_ENDPOINT || '').trim(); // e.g. https://s4.mega.io
let region = (process.env.S4_REGION || 'us-east-1').trim();
const accessKeyId = (process.env.S4_ACCESS_KEY_ID || '').trim();
const secretAccessKey = (process.env.S4_SECRET_ACCESS_KEY || '').trim();
const sessionToken = (process.env.S4_SESSION_TOKEN || '').trim() || undefined;
const bucket = (process.env.S4_BUCKET || '').trim();
// Use S4_PREFIX if provided, else fall back to legacy keys or default
const envPrefixRaw = (process.env.S4_PREFIX
  ?? process.env.S4_UPLOAD_PREFIX
  ?? process.env.UPLOAD_PREFIX
  ?? '01 Uploads/');
const envPrefix = (envPrefixRaw || '').trim();
const fixedPrefix = envPrefix.endsWith('/') ? envPrefix : envPrefix + '/';

function required(name: string, value: any) {
  if (!value) throw new Error(`Missing env: ${name}`);
}

export async function POST(req: Request) {
  try {
    required('S4_ENDPOINT', endpoint);
    required('S4_ACCESS_KEY_ID', accessKeyId);
    required('S4_SECRET_ACCESS_KEY', secretAccessKey);
    required('S4_BUCKET', bucket);

    // Parse incoming request
  const body = await req.json().catch(() => ({}));
  const contentType = (body.contentType as string) || 'application/octet-stream';
  const originalName = (body.filename as string) || '';

    // Sanitize and keep original filename
    function sanitizeFilename(name: string) {
      // Strip any path components
      const justName = name.split('\\').pop()?.split('/').pop() || '';
      // Replace spaces -> underscore, allow [A-Za-z0-9._-]
      let safe = justName.replace(/\s+/g, '_').replace(/[^A-Za-z0-9._-]/g, '-');
      // Prevent leading dot (hidden)
      safe = safe.replace(/^\.+/, '');
      if (!safe) safe = 'file';
      // Limit filename length
      if (safe.length > 128) {
        const parts = safe.split('.');
        const ext = parts.length > 1 ? '.' + parts.pop()! : '';
        const base = parts.join('.') || 'file';
        safe = base.substring(0, Math.max(1, 128 - ext.length)) + ext;
      }
      return safe;
    }

    function inferExtFromType(type: string) {
      const map: Record<string, string> = {
        'application/pdf': '.pdf',
        'image/png': '.png',
        'image/jpeg': '.jpg',
        'image/jpg': '.jpg',
        'image/gif': '.gif',
        'image/webp': '.webp',
      };
      return map[type] || '';
    }

    let safeName = sanitizeFilename(originalName);
    // Ensure has extension if known from contentType
    const hasExt = /\.[A-Za-z0-9]{1,8}$/.test(safeName);
    if (!hasExt) {
      const inferred = inferExtFromType(contentType);
      if (inferred) safeName += inferred;
    }

  // Upload target folder prefix: defaults to env (S4_PREFIX / S4_UPLOAD_PREFIX / UPLOAD_PREFIX) or '01 Upload/'.
  // We add a date-time-second prefix to keep names unique while still sortable.
  const now = new Date();
  const yyyy = String(now.getUTCFullYear());
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(now.getUTCDate()).padStart(2, '0');
  const hh = String(now.getUTCHours()).padStart(2, '0');
  const min = String(now.getUTCMinutes()).padStart(2, '0');
  const ss = String(now.getUTCSeconds()).padStart(2, '0');
  const timePrefix = `${yyyy}-${mm}-${dd}_${hh}-${min}-${ss}-`;

  const key = `${fixedPrefix}${timePrefix}${safeName}`;

    const s3 = new S3Client({
      region: region === 'auto' ? 'us-east-1' : region,
      endpoint,
      forcePathStyle: true,
  credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey!, sessionToken },
    });

    if (!/\bs3\./.test(endpoint!)) {
      console.warn('S4_ENDPOINT does not contain "s3."—verify correct API host, e.g., https://s3.g.s4.mega.io');
    }

    if (region === 'auto') {
      try {
        const { GetBucketLocationCommand } = await import('@aws-sdk/client-s3');
        const out: any = await s3.send(new GetBucketLocationCommand({ Bucket: bucket! }));
        region = (out.LocationConstraint || 'us-east-1') as string;
      } catch (e) {
        console.warn('Auto region detection failed, falling back to us-east-1');
        region = 'us-east-1';
      }
    }

    // Recreate client with detected region if changed
    const s3Reg = new S3Client({
      region,
      endpoint,
      forcePathStyle: true,
  credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey!, sessionToken },
    });

    const cmd = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    });

  const url = await getSignedUrl(s3Reg, cmd, { expiresIn: 60 * 5 }); // 5 minutes

    return NextResponse.json({ url, key, contentType, filename: safeName });
  } catch (err: any) {
    const msg = typeof err?.message === 'string' ? err.message : 'server_error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
