import { NextResponse } from 'next/server';
import { resolveUploadPrefix } from '@/lib/uploadPrefix';

export const runtime = 'nodejs';

function mask(id?: string, show = 4) {
  if (!id) return null;
  const s = id.trim();
  if (s.length <= show * 2) return s[0] + '***' + s[s.length - 1];
  return s.slice(0, show) + '…' + s.slice(-show);
}

export async function GET() {
  const endpoint = (process.env.S4_ENDPOINT || '').trim();
  const region = (process.env.S4_REGION || '').trim();
  const accessKeyId = (process.env.S4_ACCESS_KEY_ID || '').trim();
  const secretAccessKey = (process.env.S4_SECRET_ACCESS_KEY || '').trim();
  const sessionToken = (process.env.S4_SESSION_TOKEN || '').trim();
  const bucket = (process.env.S4_BUCKET || '').trim();
  const prefixRaw = (process.env.S4_PREFIX || '').trim();
  const alt1 = (process.env.S4_UPLOAD_PREFIX || '').trim();
  const alt2 = (process.env.UPLOAD_PREFIX || '').trim();
  const resolvedPrefix = resolveUploadPrefix();
  let resolvedSource: string = 'default';
  if (prefixRaw) resolvedSource = 'S4_PREFIX';
  else if (alt1) resolvedSource = 'S4_UPLOAD_PREFIX';
  else if (alt2) resolvedSource = 'UPLOAD_PREFIX';

  return NextResponse.json({
    endpoint,
    region,
  bucket,
  prefix: prefixRaw,
  altUploadPrefix: alt1 || null,
  altUploadPrefix2: alt2 || null,
  resolvedPrefix,
  resolvedSource,
    hasEndpoint: !!endpoint,
    hasRegion: !!region,
  hasBucket: !!bucket,
  hasPrefix: !!prefixRaw || !!alt1 || !!alt2,
    hasAccessKeyId: !!accessKeyId,
    hasSecretAccessKey: !!secretAccessKey,
    hasSessionToken: !!sessionToken,
    accessKeyIdMasked: mask(accessKeyId),
    secretLen: secretAccessKey ? secretAccessKey.length : 0,
  });
}
