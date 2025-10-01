"use client";

import AuthGate from "@/components/AuthGate";
import { useState } from "react";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>("");

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null);
    setStatus("");
  };

  const upload = async () => {
    try {
      if (!file) return;
      setStatus("Requesting upload URL…");
      const res = await fetch('/api/s4/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType: file.type || 'application/octet-stream', filename: file.name }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(`Presign failed: ${res.status} ${err?.error ?? ''}`.trim());
      }
  const { url, key, filename } = await res.json();

      setStatus("Uploading…");
      let putRes = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
      });
      if (!putRes.ok && putRes.status === 403) {
        // Fallback: upload via server to bypass CORS
        setStatus("Retrying via server…");
        const srv = await fetch('/api/s4/upload', {
          method: 'POST',
          headers: {
            'Content-Type': file.type || 'application/octet-stream',
            'x-file-name': file.name,
          },
          body: file,
        });
        if (!srv.ok) {
          const err = await srv.json().catch(() => ({}));
          throw new Error(`Server upload failed: ${srv.status} ${err?.error ?? ''}`.trim());
        }
        const data = await srv.json();
        setStatus(`Uploaded via server as ${data.key}\nSaved filename: ${data.filename}`);
        return;
      }
      if (!putRes.ok) throw new Error(`Upload failed: ${putRes.status}`);
      setStatus(`Uploaded as ${key}\nSaved filename: ${filename}`);
    } catch (e: any) {
      setStatus(`Error: ${e?.message ?? 'unknown'}`);
    }
  };

  return (
    <AuthGate>
      <main style={{ padding: "2rem", maxWidth: 640 }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Upload</h1>
        <p style={{ marginTop: 8 }}>Choose a file and upload directly to MEGA S4 via a presigned URL.</p>

        <input type="file" onChange={onPick} style={{ marginTop: 12 }} />

        <div style={{ marginTop: 12 }}>
          <button onClick={upload} disabled={!file} style={{
            padding: '0.5rem 1rem',
            border: '1px solid #ccc',
            background: '#fff',
            cursor: file ? 'pointer' : 'not-allowed',
            borderRadius: 6
          }}>Upload</button>
        </div>

        {status && <p style={{ marginTop: 12, whiteSpace: 'pre-wrap' }}>{status}</p>}
      </main>
    </AuthGate>
  );
}
