"use client";

import AuthGate from "@/components/AuthGate";
import { useEffect, useRef, useState } from "react";
import { styles, theme } from "@/components/ui/theme";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);
  const [done, setDone] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setStatus("");
    setProgress(0);
    setDone(false);
    setHasError(false);
    if (f && f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf')) {
      setFile(null);
      setStatus('Only PDF files are allowed.');
      setHasError(true);
      return;
    }
    setFile(f);
  };

  const upload = async () => {
    try {
      if (!file) return;
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        setStatus('Only PDF files are allowed.');
        return;
      }
  setStatus("Requesting upload URL…");
      setProgress(0);
      setDone(false);
  setHasError(false);
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
  const stampedName = key && key.includes('/') ? (key.split('/').pop() || filename) : filename;

      setStatus("Uploading…");
      // Use XMLHttpRequest to report progress
      const putRes = await new Promise<Response>(async (resolve, reject) => {
        try {
          const xhr = new XMLHttpRequest();
          xhr.open('PUT', url, true);
          xhr.setRequestHeader('Content-Type', file.type || 'application/pdf');
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const pct = Math.round((e.loaded / e.total) * 100);
              setProgress(pct);
            }
          };
          xhr.onerror = () => reject(new Error('Network error during upload'));
          xhr.onload = () => {
            const ok = xhr.status >= 200 && xhr.status < 300;
            // Create a Response-like object for uniform handling
            resolve(new Response(null, { status: xhr.status, statusText: xhr.statusText }));
          };
          xhr.send(file);
        } catch (err) {
          reject(err);
        }
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
  const stampedSrv = data.key && data.key.includes('/') ? (data.key.split('/').pop() || data.filename) : data.filename;
  setStatus(`Uploaded: ${stampedSrv}`);
        setProgress(100);
        setDone(true);
        setTimeout(() => setDone(false), 2000);
        return;
      }
      if (!putRes.ok) throw new Error(`Upload failed: ${putRes.status}`);
  setStatus(`Uploaded: ${stampedName}`);
      setProgress(100);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } catch (e: any) {
      setStatus(`Error: ${e?.message ?? 'unknown'}`);
      setHasError(true);
      setProgress(0);
      setDone(false);
    }
  };

  return (
    <AuthGate>
      <main style={{ padding: theme.space(8) }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <h1 style={{ margin: 0, fontSize: '1.75rem' }}>Upload</h1>
          <p style={{ marginTop: 8, color: theme.color.muted }}>
            Contribute to the community by uploading scores directly to the upload folder.
          </p>

          <section style={{
            ...styles.elevated,
            marginTop: 16,
            padding: '1rem',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <input
                ref={inputRef}
                type="file"
                accept="application/pdf,.pdf"
                onChange={onPick}
                style={{ display: 'none' }}
              />
              <div style={{ width: '100%', maxWidth: 520 }}>
                <button
                  onClick={() => inputRef.current?.click()}
                  style={{
                    ...styles.buttonBase,
                    ...styles.buttonGhost,
                    width: '100%',
                    justifyContent: 'center',
                    // When a PDF is selected, turn the button gray to indicate selection
                    ...(file ? { background: theme.color.panel } : {}),
                  }}
                >
                  {file ? `${file.name}` : 'Choose PDF file'}
                </button>
              </div>

              <div style={{ width: '100%', maxWidth: 520 }}>
                <button
                  onClick={upload}
                  disabled={!file}
                  style={{
                    ...styles.buttonBase,
                    // Match header button style (ghost)
                    ...styles.buttonGhost,
                    width: '100%',
                    justifyContent: 'center',
                    position: 'relative' as const,
                    overflow: 'hidden',
                    cursor: file ? 'pointer' : 'not-allowed',
                    ...(hasError ? { background: '#fee2e2', borderColor: '#fecaca', color: '#7f1d1d' } : {}),
                  }}
                >
                  {/* Progress bar background */}
                  <span aria-hidden="true" style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0,
                    width: `${progress}%`,
                    // Light green progress fill
                    background: hasError ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.28)',
                    transition: 'width 150ms ease-out',
                  }} />
                  <span style={{ position: 'relative' }}>
                    {hasError ? 'Error uploading file' : (done ? 'Done ✓' : (progress > 0 ? `Uploading… ${progress}%` : 'Upload PDF'))}
                  </span>
                </button>
              </div>

            </div>
          </section>
        </div>
      </main>
    </AuthGate>
  );
}
