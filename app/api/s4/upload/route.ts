import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export const runtime = 'nodejs';

const endpoint = (process.env.S4_ENDPOINT || '').trim();
const region = (process.env.S4_REGION || 'us-east-1').trim();
const accessKeyId = (process.env.S4_ACCESS_KEY_ID || '').trim();
const secretAccessKey = (process.env.S4_SECRET_ACCESS_KEY || '').trim();
const sessionToken = (process.env.S4_SESSION_TOKEN || '').trim() || undefined;
const bucket = (process.env.S4_BUCKET || '').trim();
const envPrefixRaw = (process.env.S4_PREFIX
  ?? process.env.S4_UPLOAD_PREFIX
  ?? process.env.UPLOAD_PREFIX
  ?? '01 Upload/');
const envPrefix = (envPrefixRaw || '').trim();
const fixedPrefix = envPrefix.endsWith('/') ? envPrefix : envPrefix + '/';

function required(name: string, value: any) {
  if (!value) throw new Error(`Missing env: ${name}`);
}

function sanitizeFilename(name: string) {
  const just = name.split('\\').pop()?.split('/').pop() || '';
  let safe = just.replace(/\s+/g, '_').replace(/[^A-Za-z0-9._-]/g, '-').replace(/^\.+/, '');
  if (!safe) safe = 'file';
  if (safe.length > 128) {
    const parts = safe.split('.');
    const ext = parts.length > 1 ? '.' + parts.pop()! : '';
    const base = parts.join('.') || 'file';
    safe = base.substring(0, Math.max(1, 128 - ext.length)) + ext;
  }
  return safe;
}

export async function POST(req: Request) {
  try {
    required('S4_ENDPOINT', endpoint);
    required('S4_ACCESS_KEY_ID', accessKeyId);
    required('S4_SECRET_ACCESS_KEY', secretAccessKey);
    required('S4_BUCKET', bucket);

    const contentType = req.headers.get('content-type') || 'application/octet-stream';
    const originalName = req.headers.get('x-file-name') || 'file';
    const safeName = sanitizeFilename(originalName);

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
      region,
      endpoint,
      forcePathStyle: true,
      credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey!, sessionToken },
    });

    const body = await req.arrayBuffer();
    const cmd = new PutObjectCommand({ Bucket: bucket, Key: key, Body: Buffer.from(body), ContentType: contentType });
    await s3.send(cmd);

    return NextResponse.json({ ok: true, key, contentType, filename: safeName });
  } catch (err: any) {
    const msg = typeof err?.message === 'string' ? err.message : 'server_error';
    const name = err?.name;
    const code = err?.Code || err?.code;
    const status = err?.$metadata?.httpStatusCode;
    return NextResponse.json({ ok: false, error: msg, name, code, status }, { status: 500 });
  }
}
