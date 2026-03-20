const fs = require('fs');
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const root = 'c:/Drive/Documents/002 Szakma/05 Programozás/scores';
const text = fs.readFileSync(root + '/.env.local', 'utf8');
for (const line of text.split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
  if (!m) continue;
  process.env[m[1]] = m[2].replace(/^"|"$/g, '').replace(/^'|'$/g, '');
}
(async () => {
  const s3 = new S3Client({
    region: process.env.S4_REGION || 'us-east-1',
    endpoint: process.env.S4_ENDPOINT,
    forcePathStyle: true,
    credentials: { accessKeyId: process.env.S4_ACCESS_KEY_ID, secretAccessKey: process.env.S4_SECRET_ACCESS_KEY, sessionToken: process.env.S4_SESSION_TOKEN || undefined },
  });
  const out = await s3.send(new ListObjectsV2Command({ Bucket: process.env.S4_BUCKET, Prefix: 'scores/01 Upload/', MaxKeys: 1000 }));
  const items = (out.Contents || [])
    .map(x => ({ key: x.Key, lastModified: x.LastModified ? new Date(x.LastModified).toISOString() : null, size: x.Size || 0 }))
    .sort((a, b) => (a.lastModified || '').localeCompare(b.lastModified || ''));
  console.log(JSON.stringify({ count: items.length, last20: items.slice(-20) }, null, 2));
})();
