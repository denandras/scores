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
  // search scope: 'basename' (default) or 'path'
  const scope = (url.searchParams.get('scope') || 'basename').toLowerCase();
  // filter by extensions, comma-separated (default: pdf only)
  const exts = (url.searchParams.get('exts') || 'pdf').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);

    if (!q) return NextResponse.json({ ok: false, error: 'query_required' }, { status: 400 });

    const s3 = new S3Client({
      region,
      endpoint,
      forcePathStyle: true,
      credentials: { accessKeyId, secretAccessKey, sessionToken },
    });

    const lc = q.toLowerCase();
    const MAX_PAGES_SCAN = 5; // safety cap
    const MAX_MATCHES = 200;  // return at most this many per response

    let pages = 0;
    let currentToken: string | undefined = token;
  const folderSet = new Set<string>();
  const files: Array<{ key: string; name: string; size: number; lastModified: string | null }> = [];

    while (pages < MAX_PAGES_SCAN && files.length < MAX_MATCHES) {
      const out = await s3.send(new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: currentToken,
        MaxKeys: 1000,
      }));

      const contents = out.Contents || [];
      for (const o of contents) {
        const key = o.Key || '';
        if (!key) continue;
        if (prefix && key === prefix) continue;

        const keyLc = key.toLowerCase();
        const base = key.split('/').pop() || key;
        const baseLc = base.toLowerCase();
        const matchesText = (scope === 'path' ? keyLc : baseLc).includes(lc);
        const matchesExt = exts.length ? exts.some(ext => baseLc.endsWith('.' + ext)) : true;
        if (matchesText && matchesExt) {
          // file match
          files.push({
            key,
            name: base,
            size: o.Size || 0,
            lastModified: o.LastModified ? new Date(o.LastModified).toISOString() : null,
          });
          // folder matches for any segment
          const parts = key.split('/');
          if (parts.length > 1) {
            for (let i = 0; i < parts.length - 1; i++) {
              const seg = parts[i];
              if ((seg || '').toLowerCase().includes(lc)) {
                const pfx = parts.slice(0, i + 1).join('/') + '/';
                folderSet.add(pfx);
              }
            }
          }
        }
      }

      pages++;
      if (out.IsTruncated && out.NextContinuationToken) {
        currentToken = out.NextContinuationToken;
      } else {
        currentToken = undefined;
        break;
      }

      // If we already found some matches, stop early to keep responses snappy
      if (files.length >= 1 && files.length >= MAX_MATCHES) break;
      if (files.length >= 1 && pages >= 1) break;
    }

    const matchesFolders = Array.from(folderSet).map((p) => ({
      key: p,
      name: p.split('/').filter(Boolean).pop() || p,
      size: 0,
      lastModified: null,
    }));

    // underscore-first sort for folders
    matchesFolders.sort((a, b) => {
      const an = a.name.toLowerCase();
      const bn = b.name.toLowerCase();
      const au = an.startsWith('_');
      const bu = bn.startsWith('_');
      if (au && !bu) return -1;
      if (!au && bu) return 1;
      return an.localeCompare(bn);
    });

    // underscore-first sort for files as well
    files.sort((a, b) => {
      const an = a.name.toLowerCase();
      const bn = b.name.toLowerCase();
      const au = an.startsWith('_');
      const bu = bn.startsWith('_');
      if (au && !bu) return -1;
      if (!au && bu) return 1;
      return an.localeCompare(bn);
    });

    return NextResponse.json({
      ok: true,
      q,
      prefix,
      results: [...matchesFolders, ...files].slice(0, MAX_MATCHES),
      nextToken: currentToken || null,
    });
  } catch (err: any) {
    const msg = typeof err?.message === 'string' ? err.message : 'server_error';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
