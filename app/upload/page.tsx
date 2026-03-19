"use client";

import AuthGate from "@/components/AuthGate";
import { useEffect, useRef, useState } from "react";
import { styles, theme } from "@/components/ui/theme";

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);
  const [done, setDone] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const isAllowed = (f: File) => {
    const name = f.name.toLowerCase();
    const isPdf = f.type === "application/pdf" || name.endsWith(".pdf");
    const isZip =
      f.type === "application/zip" ||
      f.type === "application/x-zip-compressed" ||
      name.endsWith(".zip");
    return isPdf || isZip;
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    setStatus("");
    setProgress(0);
    setDone(false);
    setHasError(false);
    if (picked.length === 0) {
      setFiles([]);
      return;
    }
    const allowed = picked.filter(isAllowed);
    if (allowed.length !== picked.length) {
      setStatus('Only PDF or ZIP files are allowed.');
      setHasError(true);
    }
    setFiles(allowed);
  };

  const upload = async () => {
    try {
      if (files.length === 0) return;
      const invalid = files.find((f) => !isAllowed(f));
      if (invalid) {
        setStatus('Only PDF or ZIP files are allowed.');
        setHasError(true);
        return;
      }
      setProgress(0);
      setDone(false);
      setHasError(false);
      const totalFiles = files.length;
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < totalFiles; i += 1) {
        const file = files[i];
        setStatus(`Requesting upload URL... (${i + 1}/${totalFiles})`);

        try {
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

          setStatus(`Uploading... (${i + 1}/${totalFiles})`);
          const putRes = await new Promise<Response>(async (resolve, reject) => {
            try {
              const xhr = new XMLHttpRequest();
              xhr.open('PUT', url, true);
              xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
              xhr.onerror = () => reject(new Error('Network error during upload'));
              xhr.onload = () => {
                resolve(new Response(null, { status: xhr.status, statusText: xhr.statusText }));
              };
              xhr.send(file);
            } catch (err) {
              reject(err);
            }
          });

          if (!putRes.ok && putRes.status === 403) {
            setStatus(`Retrying via server... (${i + 1}/${totalFiles})`);
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
            successCount += 1;
            const successPct = Math.round((successCount / totalFiles) * 100);
            setProgress(successPct);
            setStatus(`Uploaded: ${stampedSrv} (${successCount}/${totalFiles})`);
            continue;
          }

          if (!putRes.ok) throw new Error(`Upload failed: ${putRes.status}`);
          successCount += 1;
          const successPct = Math.round((successCount / totalFiles) * 100);
          setProgress(successPct);
          setStatus(`Uploaded: ${stampedName} (${successCount}/${totalFiles})`);
        } catch (fileErr: any) {
          failCount += 1;
          setHasError(true);
          const fileMsg = typeof fileErr?.message === 'string' ? fileErr.message : 'unknown error';
          setStatus(`Failed: ${file.name} (${fileMsg})`);
        }
      }

      if (failCount > 0) {
        setStatus(`Completed with errors: ${successCount}/${totalFiles} uploaded, ${failCount} failed.`);
      } else {
        setDone(true);
        setStatus(`Upload complete: ${successCount}/${totalFiles} uploaded.`);
        setTimeout(() => setDone(false), 2000);
      }
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
                accept="application/pdf,.pdf,application/zip,application/x-zip-compressed,.zip"
                multiple
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
                    ...(files.length > 0 ? { background: theme.color.panel } : {}),
                  }}
                >
                  {files.length > 0 ? (
                    <span className="tbsl-filename" title={files.map((f) => f.name).join(', ')} style={{ display: 'inline-block', maxWidth: '100%' }}>
                      {files.length === 1 ? files[0].name : `${files.length} files selected`}
                    </span>
                  ) : 'Choose PDF or ZIP files'}
                </button>
              </div>

              <div style={{ width: '100%', maxWidth: 520 }}>
                <button
                  onClick={upload}
                  disabled={files.length === 0}
                  style={{
                    ...styles.buttonBase,
                    // Match header button style (ghost)
                    ...styles.buttonGhost,
                    width: '100%',
                    justifyContent: 'center',
                    position: 'relative' as const,
                    overflow: 'hidden',
                    cursor: files.length > 0 ? 'pointer' : 'not-allowed',
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
                    {hasError ? (progress > 0 ? `Uploaded ${progress}% (with errors)` : 'Error uploading files') : (done ? 'Done ✓' : (progress > 0 ? `Uploaded ${progress}%` : 'Upload files'))}
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
