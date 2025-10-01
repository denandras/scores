"use client";

import AuthGate from "@/components/AuthGate";
import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { styles, theme } from "@/components/ui/theme";
import { formatBytes } from "@/lib/format";
import { useRouter, useSearchParams } from "next/navigation";

function DashboardContent() {
  // Simple S3 browser: list folders/files and navigate prefixes.
  const [prefix, setPrefix] = useState<string>("");
  const [folders, setFolders] = useState<string[]>([]);
  const [files, setFiles] = useState<Array<{key:string;name:string;size:number;lastModified:string|null}>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Array<{key:string;name:string;size:number;lastModified:string|null}>>([]);
  const [nextToken, setNextToken] = useState<string | null>(null);
  const sp = useSearchParams();
  const router = useRouter();
  const [q, setQ] = useState<string>((sp?.get('q') || '').trim());

  const crumbs = useMemo(() => {
    const parts = prefix.split('/').filter(Boolean);
    const acc: Array<{name:string; pfx:string}> = [{ name: 'home', pfx: '' }];
    let cur = '';
    for (const p of parts) {
      cur = cur ? `${cur}/${p}` : p;
      acc.push({ name: p, pfx: cur + '/' });
    }
    return acc;
  }, [prefix]);

  const parentPrefix = useMemo(() => {
    const trimmed = prefix.replace(/\/$/, '');
    if (!trimmed) return '';
    const i = trimmed.lastIndexOf('/');
    if (i === -1) return '';
    return trimmed.slice(0, i + 1);
  }, [prefix]);

  const syntheticCount = (prefix ? 1 : 0); // Only Up row when not at root

  const load = async (p: string) => {
    setLoading(true);
    setError(null as any);
    try {
      const qs = p ? `?prefix=${encodeURIComponent(p)}` : '';
      const res = await fetch(`/api/s4/list${qs}`);
      if (!res.ok) throw new Error(`List failed: ${res.status}`);
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'list_error');
      const list: string[] = data.folders || [];
      // underscore-first sort (e.g., _uploads first), then alphabetical
      list.sort((a: string, b: string) => {
        const an = a.toLowerCase();
        const bn = b.toLowerCase();
        const au = an.startsWith('_');
        const bu = bn.startsWith('_');
        if (au && !bu) return -1;
        if (!au && bu) return 1;
        return an.localeCompare(bn);
      });
      setFolders(list);
      setFiles(data.files || []);
    } catch (e:any) {
      setError(e?.message || 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // If searching, skip folder browser
    if (q) return;
    load(prefix);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefix, q]);

  // Search loader when q present
  useEffect(() => {
    if (!q) {
      setResults([]);
      setNextToken(null);
      return;
    }
    let cancelled = false;
    const controller = new AbortController();
    const id = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);
  const res = await fetch(`/api/s4/search?q=${encodeURIComponent(q)}&scope=path&exts=pdf`, { signal: controller.signal });
        if (!res.ok) throw new Error(`Search failed: ${res.status}`);
        const data = await res.json();
  if (cancelled) return;
  const pageResults = data.results || [];
  setResults(pageResults);
  // Keep nextToken even if this page has no matches so user can load more
  setNextToken(data.nextToken || null);
      } catch (e:any) {
        if (!cancelled && e?.name !== 'AbortError') setError(e?.message || 'error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 200); // small debounce for live search
    return () => { cancelled = true; controller.abort(); clearTimeout(id); };
  }, [q]);

  const loadMore = async () => {
    if (!q || !nextToken) return;
    setLoading(true);
    setError(null);
    try {
  const res = await fetch(`/api/s4/search?q=${encodeURIComponent(q)}&scope=path&exts=pdf&token=${encodeURIComponent(nextToken)}`);
      if (!res.ok) throw new Error(`Search failed: ${res.status}`);
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || 'search_error');
  const pageResults = data.results || [];
  setResults((prev) => [...prev, ...pageResults]);
  // Keep nextToken even when this page has zero matches; allow user to continue
  setNextToken(data.nextToken || null);
    } catch (e:any) {
      setError(e?.message || 'error');
    } finally {
      setLoading(false);
    }
  };

  const go = (p: string) => {
    // Immediately reflect navigation intent
    setPrefix(p);
    // Clear previous content to avoid showing stale rows
    setFolders([]);
    setFiles([]);
    setResults([]);
    setNextToken(null);
    setError(null);
    setLoading(true);
  };
  const clearSearch = () => setQ('');
  const isFolderKey = (key: string) => /\/$/.test(key);
  const lastSegment = (key: string) => key.replace(/\/$/, '').split('/').pop() || key;

  const download = async (key: string) => {
    try {
      const res = await fetch('/api/s4/presign-get', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key }) });
      if (!res.ok) throw new Error(`Presign failed: ${res.status}`);
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'presign_error');
      window.open(data.url, '_blank');
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
              else if (q && results.length === 0) { text = 'No results'; }
              return <p style={{ marginTop: 6, color }}>{text}</p>;
            })()}
          </div>
        </header>

        {!q && (
        <nav aria-label="Breadcrumb" style={{ marginTop: 16, fontSize: 14 }}>
          {crumbs.map((c, i) => (
            <span key={c.pfx}>
              {i > 0 && ' / '}
              <a href="#" onClick={(e)=>{e.preventDefault(); go(c.pfx);}}>
                {i === 0 ? '🏠' : c.name}
              </a>
            </span>
          ))}
        </nav>
        )}

        {/* Top synthetic folder-like rows: Home (🏠) and Up (⬆️) */}

        <section style={{ marginTop: 16 }}>
          <div style={{ ...styles.tableWrap, position: 'relative' as const }}>
            <div className="tbsl-header" style={{ ...styles.tableHeader }}>
              <div className="tbsl-h-name">Name</div>
              <div className="tbsl-h-search">
                <div style={{ position: 'relative' }}>
                  <input
                    className="tbsl-search-input"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search…"
                    aria-label="Search in bucket"
                    style={{
                      width: '100%',
                      padding: '6px 28px 6px 10px',
                      borderRadius: theme.radius.sm,
                      border: `1px solid ${theme.color.border}`,
                      background: theme.color.bg,
                      color: theme.color.text,
                    }}
                  />
                  {q && (
                    <button
                      onClick={clearSearch}
                      aria-label="Clear search"
                      style={{
                        position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
                        ...styles.buttonBase, ...styles.buttonGhost,
                        padding: '2px 6px', fontSize: 12,
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
              <div className="tbsl-h-size" style={{ textAlign: 'right' }}>Size</div>
              <div className="tbsl-h-action" style={{ textAlign: 'right' }}>{q ? (
                <button onClick={clearSearch} style={{ ...styles.buttonBase, ...styles.buttonGhost }}>Clear</button>
              ) : 'Action'}</div>
            </div>

            {/* Removed overlay: avoid covering header between Name and Search */}
            {/* Home row removed; we now show 🏠 in the breadcrumb and only keep Up in the list */}

            {/* Up row (only if not at root) */}
            {!q && prefix && (
              <div
                style={{
                  ...styles.tableRow,
                  gridTemplateColumns: 'minmax(200px,1fr) 120px 120px',
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

            {!q && folders.map((f, idx) => (
              <div
                key={f}
                style={{
                  ...styles.tableRow,
                  gridTemplateColumns: 'minmax(200px,1fr) 120px 120px',
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

            {!q && files.map((f, idx) => (
              <div
                key={f.key}
                style={{
                  ...styles.tableRow,
                  gridTemplateColumns: 'minmax(200px,1fr) 120px 120px',
                  background: ((syntheticCount + folders.length + idx) % 2 === 0) ? theme.color.bg : theme.color.surface,
                }}
              >
                <a
                  href={`/api/s4/view?key=${encodeURIComponent(f.key)}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ ...styles.tableIconAndName, textDecoration: 'none', color: theme.color.text }}
                >
                  <span style={{ fontSize: 20 }}>📄</span>
                  <span className="tbsl-filename">{f.name}</span>
                </a>
                <div style={{ textAlign: 'right' }}>{formatBytes(f.size)}</div>
                <div style={{ textAlign: 'right' }}>
                  <a href={`/api/s4/download?key=${encodeURIComponent(f.key)}`} style={{ ...styles.buttonBase, ...styles.buttonGhost }}>Download</a>
                </div>
              </div>
            ))}

            {/* Search results list */}
            {q && results.map((f, idx) => {
              const folder = isFolderKey(f.key);
              const display = folder ? lastSegment(f.key) : (f.name || lastSegment(f.key));
              return (
                <div
                  key={`${f.key}-${idx}`}
                  style={{
                    ...styles.tableRow,
                    gridTemplateColumns: 'minmax(200px,1fr) 120px 120px',
                    background: (idx % 2 === 0) ? theme.color.bg : theme.color.surface,
                  }}
                >
                  {folder ? (
                    <a
                      href="#"
                      onClick={(e)=>{e.preventDefault(); go(f.key); clearSearch();}}
                      style={{ ...styles.tableIconAndName, textDecoration: 'none', color: theme.color.text }}
                    >
                      <span style={{ fontSize: 20 }}>📁</span>
                      <span className="tbsl-filename" style={{ fontWeight: 600 }}>{display}</span>
                    </a>
                  ) : (
                    <a
                      href={`/api/s4/view?key=${encodeURIComponent(f.key)}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ ...styles.tableIconAndName, textDecoration: 'none', color: theme.color.text }}
                    >
                      <span style={{ fontSize: 20 }}>📄</span>
                      <span className="tbsl-filename">{display}</span>
                    </a>
                  )}
                  <div style={{ textAlign: 'right' }}>{folder ? <span style={{ color: theme.color.muted }}>—</span> : formatBytes(f.size)}</div>
                  <div style={{ textAlign: 'right' }}>
                    {folder ? (
                      <a href="#" onClick={(e)=>{e.preventDefault(); go(f.key); clearSearch();}} style={{ ...styles.buttonBase, ...styles.buttonGhost }}>Open</a>
                    ) : (
                      <a href={`/api/s4/download?key=${encodeURIComponent(f.key)}`} style={{ ...styles.buttonBase, ...styles.buttonGhost }}>Download</a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {!loading && !q && folders.length === 0 && files.length === 0 && (
            <p style={{ color: theme.color.muted, marginTop: 12 }}>Empty here.</p>
          )}
          {/* No separate no-results here; shown in the loading area above */}
          {q && nextToken && (
            <div style={{ marginTop: 12 }}>
              <button onClick={loadMore} style={{ ...styles.buttonBase, ...styles.buttonGhost }}>Load more</button>
            </div>
          )}
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
