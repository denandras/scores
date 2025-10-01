import { NextResponse } from 'next/server';

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
  const prefix = (process.env.S4_PREFIX || '').trim();

  return NextResponse.json({
    endpoint,
    region,
    bucket,
    prefix,
    hasEndpoint: !!endpoint,
    hasRegion: !!region,
    hasBucket: !!bucket,
    hasPrefix: !!prefix,
    hasAccessKeyId: !!accessKeyId,
    hasSecretAccessKey: !!secretAccessKey,
    hasSessionToken: !!sessionToken,
    accessKeyIdMasked: mask(accessKeyId),
    secretLen: secretAccessKey ? secretAccessKey.length : 0,
  });
}
