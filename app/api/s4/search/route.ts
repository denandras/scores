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

// Naive search over object keys using pagination; for larger buckets consider using inventory or external index.
export async function GET(req: Request) {
  try {
    required('S4_ENDPOINT', endpoint);
    required('S4_ACCESS_KEY_ID', accessKeyId);
    required('S4_SECRET_ACCESS_KEY', secretAccessKey);
    required('S4_BUCKET', bucket);

    const url = new URL(req.url);
    const q = (url.searchParams.get('q') || '').trim();
    const token = url.searchParams.get('token') || undefined;
    // optional prefix to constrain the scan (still searches all when empty)
    const prefix = (url.searchParams.get('prefix') || '').replace(/^\/+/, '');

    if (!q) return NextResponse.json({ ok: false, error: 'query_required' }, { status: 400 });

    const s3 = new S3Client({
      region,
      endpoint,
      forcePathStyle: true,
      credentials: { accessKeyId, secretAccessKey, sessionToken },
    });

    const cmd = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      ContinuationToken: token,
      MaxKeys: 1000,
    });
    const out = await s3.send(cmd);

    const lc = q.toLowerCase();
    const contents = (out.Contents || []);
    const matchesFiles = contents
      .filter((o) => o.Key && (!prefix || o.Key !== prefix))
      .filter((o) => (o.Key || '').toLowerCase().includes(lc))
      .map((o) => ({
        key: o.Key!,
        name: o.Key!.split('/').pop() || o.Key!,
        size: o.Size || 0,
        lastModified: o.LastModified ? new Date(o.LastModified).toISOString() : null,
      }));
    // Derive matching folders from keys whose path segments include the query
    const folderSet = new Set<string>();
    for (const o of contents) {
      const key = o.Key || '';
      if (!key) continue;
      if (!key.toLowerCase().includes(lc)) continue;
      const parts = key.split('/');
      if (parts.length <= 1) continue; // no folder path
      for (let i = 0; i < parts.length - 1; i++) {
        const seg = parts[i];
        if ((seg || '').toLowerCase().includes(lc)) {
          const pfx = parts.slice(0, i + 1).join('/') + '/';
          folderSet.add(pfx);
        }
      }
    }
    const matchesFolders = Array.from(folderSet).map((p) => ({
      key: p,
      name: p.split('/').filter(Boolean).pop() || p,
      size: 0,
      lastModified: null,
    }));

    return NextResponse.json({
      ok: true,
      q,
      prefix,
      results: [...matchesFolders, ...matchesFiles],
      nextToken: out.IsTruncated ? out.NextContinuationToken || null : null,
    });
  } catch (err: any) {
    const msg = typeof err?.message === 'string' ? err.message : 'server_error';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
