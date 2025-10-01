import { NextResponse } from 'next/server';
import { S3Client, GetBucketLocationCommand } from '@aws-sdk/client-s3';

export const runtime = 'nodejs';

const endpoint = (process.env.S4_ENDPOINT || '').trim();
const accessKeyId = (process.env.S4_ACCESS_KEY_ID || '').trim();
const secretAccessKey = (process.env.S4_SECRET_ACCESS_KEY || '').trim();
const sessionToken = (process.env.S4_SESSION_TOKEN || '').trim() || undefined;
const bucket = (process.env.S4_BUCKET || '').trim();
const regionEnv = (process.env.S4_REGION || 'us-east-1').trim();

function required(name: string, value: any) {
  if (!value) throw new Error(`Missing env: ${name}`);
}

export async function GET() {
  try {
    required('S4_ENDPOINT', endpoint);
    required('S4_ACCESS_KEY_ID', accessKeyId);
    required('S4_SECRET_ACCESS_KEY', secretAccessKey);
    required('S4_BUCKET', bucket);

    const notes: string[] = [];
    if (!/\bs3\./.test(endpoint!)) {
      notes.push('S4_ENDPOINT does not contain "s3."; typical S3 API hosts look like https://s3.g.s4.mega.io or https://s3.<region>.s4.mega.io');
    }

    // If region is explicitly set, skip querying bucket location (may be disallowed by policy)
    if (regionEnv !== 'auto') {
      return NextResponse.json({
        ok: true,
        endpoint,
        bucket,
        regionEnv,
        detectedRegion: regionEnv,
        notes: [...notes, 'Skipped GetBucketLocation (region set explicitly)'],
      });
    }

    const s3 = new S3Client({
      region: 'us-east-1',
      endpoint,
      forcePathStyle: true,
      credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey!, sessionToken },
    });

    try {
      const out = await s3.send(new GetBucketLocationCommand({ Bucket: bucket! }));
      // AWS returns null/'' for us-east-1
      const detected = (out.LocationConstraint || 'us-east-1') as string;
      return NextResponse.json({ ok: true, endpoint, bucket, regionEnv, detectedRegion: detected, notes });
    } catch (err: any) {
      // Gracefully handle lack of permission
      const msg = typeof err?.message === 'string' ? err.message : 'get_bucket_location_failed';
      notes.push('GetBucketLocation not permitted by policy. Set S4_REGION explicitly to avoid this.');
      return NextResponse.json({ ok: false, endpoint, bucket, regionEnv, detectedRegion: null, notes, error: msg }, { status: 200 });
    }
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? 'diagnose_failed' }, { status: 500 });
  }
}
