import { NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const runtime = 'nodejs';

const endpoint = (process.env.S4_ENDPOINT || '').trim();
const region = (process.env.S4_REGION || 'us-east-1').trim();
const accessKeyId = (process.env.S4_ACCESS_KEY_ID || '').trim();
const secretAccessKey = (process.env.S4_SECRET_ACCESS_KEY || '').trim();
const sessionToken = (process.env.S4_SESSION_TOKEN || '').trim() || undefined;
const bucket = (process.env.S4_BUCKET || '').trim();

function required(name: string, value: any) {
  if (!value) throw new Error(`Missing env: ${name}`);
}

export async function GET(req: Request) {
  try {
    required('S4_ENDPOINT', endpoint);
    required('S4_ACCESS_KEY_ID', accessKeyId);
    required('S4_SECRET_ACCESS_KEY', secretAccessKey);
    required('S4_BUCKET', bucket);

    const url = new URL(req.url);
    const key = (url.searchParams.get('key') || '').trim();
    if (!key) return NextResponse.json({ ok: false, error: 'key_required' }, { status: 400 });

    const s3 = new S3Client({
      region,
      endpoint,
      forcePathStyle: true,
      credentials: { accessKeyId, secretAccessKey, sessionToken },
    });
    // Do not set ResponseContentDisposition to force inline view
    const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
    const signed = await getSignedUrl(s3, cmd, { expiresIn: 60 * 5 });
    return NextResponse.redirect(signed, 302);
  } catch (err: any) {
    const msg = typeof err?.message === 'string' ? err.message : 'server_error';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
