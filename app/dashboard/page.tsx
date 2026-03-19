"use client";

import AuthGate from "@/components/AuthGate";
import { Suspense, useEffect, useMemo, useState } from "react";
import { styles, theme } from "@/components/ui/theme";
import { formatBytes } from "@/lib/format";
import { supabase } from "@/lib/supabaseClient";

const _rootEnv = (process.env.NEXT_PUBLIC_S4_ROOT ?? '');
const ROOT = _rootEnv ? (_rootEnv.endsWith('/') ? _rootEnv : _rootEnv + '/') : '';

function DashboardContent() {
  // Simple S3 browser: list folders/files and navigate prefixes.
  const [prefix, setPrefix] = useState<string>(ROOT);
  const [folders, setFolders] = useState<string[]>([]);
  const [files, setFiles] = useState<Array<{key:string;name:string;size:number;lastModified:string|null}>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const crumbs = useMemo(() => {
    const relative = prefix.startsWith(ROOT) ? prefix.slice(ROOT.length) : prefix;
    const parts = relative.split('/').filter(Boolean);
    const acc: Array<{name:string; pfx:string}> = [{ name: 'home', pfx: ROOT }];
    let cur = ROOT;
    for (const p of parts) {
      cur = `${cur}${p}/`;
      acc.push({ name: p, pfx: cur });
    }
    return acc;
  }, [prefix]);

  const parentPrefix = useMemo(() => {
    const trimmed = prefix.replace(/\/$/, '');
    const rootTrimmed = ROOT.replace(/\/$/, '');
    if (!trimmed || trimmed === rootTrimmed) return ROOT;
    const i = trimmed.lastIndexOf('/');
    if (i === -1) return ROOT;
    const parent = trimmed.slice(0, i + 1);
    return (ROOT && !parent.startsWith(ROOT)) ? ROOT : parent;
  }, [prefix]);

  const syntheticCount = (prefix !== ROOT ? 1 : 0); // Only Up row when not at root

  const load = async (p: string) => {
    setLoading(true);
    setError(null as any);
    try {
      let allFolders: string[] = [];
      let allFiles: Array<{key:string;name:string;size:number;lastModified:string|null}> = [];
      let token: string | null = null;

      // Fetch all pages
      do {
        const params = new URLSearchParams();
        if (p) params.append('prefix', p);
        if (token) params.append('token', token);
        
        const qs = params.toString() ? `?${params.toString()}` : '';
        const headers: Record<string, string> = {};
        if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
        const res = await fetch(`/api/s4/list${qs}`, {
          headers,
        });
        if (!res.ok) {
          let serverMessage = '';
          try {
            const body = await res.json();
            serverMessage = typeof body?.error === 'string' ? body.error : '';
          } catch {
            serverMessage = '';
          }
          throw new Error(serverMessage ? `List failed (${res.status}): ${serverMessage}` : `List failed: ${res.status}`);
        }
        const data = await res.json();
        if (!data.ok) throw new Error(data.error || 'list_error');
        
        allFolders.push(...(data.folders || []));
        allFiles.push(...(data.files || []));
        token = data.nextToken || null;
      } while (token);

      // Sort folders: underscore-first, then alphabetical
      allFolders.sort((a: string, b: string) => {
        const an = a.toLowerCase();
        const bn = b.toLowerCase();
        const au = an.startsWith('_');
        const bu = bn.startsWith('_');
        if (au && !bu) return -1;
        if (!au && bu) return 1;
        return an.localeCompare(bn);
      });

      setFolders(allFolders);
      setFiles(allFiles);
    } catch (e:any) {
      setError(e?.message || 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(prefix);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefix, accessToken]);

  useEffect(() => {
    let unsub = () => {};

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setAccessToken(session?.access_token ?? null);

      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        setAccessToken(session?.access_token ?? null);
      });
      unsub = () => sub.subscription.unsubscribe();
    };

    init();
    return () => unsub();
  }, []);

  const go = (p: string) => {
    // Immediately reflect navigation intent
    setPrefix(p);
    // Clear previous content to avoid showing stale rows
    setFolders([]);
    setFiles([]);
    setError(null);
    setLoading(true);
  };
  const getPresignedGetUrl = async (key: string, download: boolean) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

    const res = await fetch('/api/s4/presign-get', {
      method: 'POST',
      headers,
      body: JSON.stringify({ key, download }),
    });
    if (!res.ok) throw new Error(`Presign failed: ${res.status}`);
    const data = await res.json();
    if (!data.ok || !data.url) throw new Error(data.error || 'presign_error');
    return data.url as string;
  };

  const openFile = async (key: string) => {
    try {
      const url = await getPresignedGetUrl(key, false);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (e:any) {
      alert(e?.message || 'open_error');
    }
  };

  const download = async (key: string) => {
    try {
      const url = await getPresignedGetUrl(key, true);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (e:any) {
      alert(e?.message || 'download_error');
    }
  };

  return (
      <main style={{ padding: "2rem 0" }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' as const }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "2rem", letterSpacing: 0.2 }}>The Brass Score Library</h1>
            {(() => {
              const base = 'Upload, browse, and download brass scores.';
              let text: string = base;
              let color: string = theme.color.muted as string;
              if (error) { text = error; color = '#b00020'; }
              else if (loading) { text = 'Loading…'; }
              return <p style={{ marginTop: 6, color }}>{text}</p>;
            })()}
          </div>
      </header>

        <section style={{ marginTop: 16 }}>
          <div style={{ ...styles.tableWrap, position: 'relative' }}>
            <div className="tbsl-header" style={{ ...styles.tableHeader, gridTemplateColumns: 'minmax(120px,1fr) 80px 80px' }}>
              <div className="tbsl-h-name">Name</div>
              <div className="tbsl-h-size" style={{ textAlign: 'right' }}>Size</div>
              <div className="tbsl-h-action" style={{ textAlign: 'right' }}>Action</div>
            </div>
            {/* Up row (only if not at root) */}
            {prefix !== ROOT && (
              <div
                style={{
                  ...styles.tableRow,
                  gridTemplateColumns: 'minmax(120px,1fr) 80px 80px',
                  background: theme.color.surface,
                }}
              >
                <a
                  href="#"
                  onClick={(e)=>{e.preventDefault(); go(parentPrefix);}}
                  style={{ ...styles.tableIconAndName, textDecoration: 'none', color: theme.color.text }}
                >
                  <span aria-hidden="true" style={{ fontSize: 20 }}>⬆️</span>
                  <span style={styles.srOnly}>Up one level</span>
                </a>
                <div style={{ textAlign: 'right', color: theme.color.muted }}>—</div>
                <div style={{ textAlign: 'right' }}>
                  <a href="#" onClick={(e)=>{e.preventDefault(); go(parentPrefix);}} style={{ ...styles.buttonBase, ...styles.buttonGhost }}>Open</a>
                </div>
              </div>
            )}

            {folders.map((f, idx) => (
              <div
                key={f}
                style={{
                  ...styles.tableRow,
                  gridTemplateColumns: 'minmax(120px,1fr) 80px 80px',
                  background: ((syntheticCount + idx) % 2 === 0) ? theme.color.bg : theme.color.surface,
                }}
              >
                <a
                  href="#"
                  onClick={(e)=>{e.preventDefault(); go(prefix + f);}}
                  style={{ ...styles.tableIconAndName, textDecoration: 'none', color: theme.color.text }}
                >
                  <span style={{ fontSize: 20 }}>📁</span>
                  <span className="tbsl-filename" style={{ fontWeight: 600 }}>
                    {f.replace(/\/$/, '')}
                  </span>
                </a>
                <div style={{ textAlign: 'right', color: theme.color.muted }}>—</div>
                <div style={{ textAlign: 'right' }}>
                  <a href="#" onClick={(e)=>{e.preventDefault(); go(prefix + f);}} style={{ ...styles.buttonBase, ...styles.buttonGhost }}>Open</a>
                </div>
              </div>
            ))}

            {files.map((f, idx) => (
              <div
                key={f.key}
                style={{
                  ...styles.tableRow,
                  gridTemplateColumns: 'minmax(120px,1fr) 80px 80px',
                  background: ((syntheticCount + folders.length + idx) % 2 === 0) ? theme.color.bg : theme.color.surface,
                }}
              >
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    openFile(f.key);
                  }}
                  style={{ ...styles.tableIconAndName, textDecoration: 'none', color: theme.color.text }}
                >
                  <span style={{ fontSize: 20 }}>{f.name.toLowerCase().endsWith('.zip') ? '📦' : '📄'}</span>
                  <span className="tbsl-filename">{f.name}</span>
                </a>
                <div style={{ textAlign: 'right' }}>{formatBytes(f.size)}</div>
                <div style={{ textAlign: 'right' }}>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      download(f.key);
                    }}
                    style={{ ...styles.buttonBase, ...styles.buttonGhost }}
                  >
                    Download
                  </a>
                </div>
              </div>
            ))}
          </div>
          {!loading && folders.length === 0 && files.length === 0 && (
            <p style={{ color: theme.color.muted, marginTop: 12 }}>Empty here.</p>
          )}
          {/* No search UI */}
        </section>
      </main>
  );
}

export default function DashboardPage() {
  return (
    <AuthGate>
      <Suspense fallback={<main style={{ padding: "2rem 0" }}><p style={{ color: theme.color.muted, padding: 16 }}>Loading…</p></main>}>
        <DashboardContent />
      </Suspense>
    </AuthGate>
  );
}
