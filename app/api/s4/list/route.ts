import { NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

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
    const prefix = (url.searchParams.get('prefix') || '').replace(/^\/+/, '');
    const token = url.searchParams.get('token') || undefined;

    const s3 = new S3Client({
      region,
      endpoint,
      forcePathStyle: true,
      credentials: { accessKeyId, secretAccessKey, sessionToken },
    });

    const cmd = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      Delimiter: '/',
      ContinuationToken: token,
      MaxKeys: 100,
    });
    const out = await s3.send(cmd);

    const folders = (out.CommonPrefixes || [])
      .map((p) => p.Prefix!)
      .filter(Boolean)
      .map((p) => p.slice(prefix.length));

    const files = (out.Contents || [])
      .filter((o) => o.Key && o.Key !== prefix)
      .map((o) => ({
        key: o.Key!,
        name: o.Key!.slice(prefix.length),
        size: o.Size || 0,
        lastModified: o.LastModified ? new Date(o.LastModified).toISOString() : null,
      }));

    return NextResponse.json({
      ok: true,
      prefix,
      folders,
      files,
      nextToken: out.IsTruncated ? out.NextContinuationToken || null : null,
    });
  } catch (err: any) {
    const msg = typeof err?.message === 'string' ? err.message : 'server_error';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
