"use client";

import AuthGate from "@/components/AuthGate";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { styles, theme } from "@/components/ui/theme";
import { formatBytes } from "@/lib/format";

export default function DashboardPage() {
  // Simple S3 browser: list folders/files and navigate prefixes.
  const [prefix, setPrefix] = useState<string>("");
  const [folders, setFolders] = useState<string[]>([]);
  const [files, setFiles] = useState<Array<{key:string;name:string;size:number;lastModified:string|null}>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => { load(prefix); }, [prefix]);

  const go = (p: string) => setPrefix(p);

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
    <AuthGate>
      <main style={{ padding: "2rem 0" }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' as const }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "2rem", letterSpacing: 0.2 }}>TBSL — The Brass Score Library</h1>
            <p style={{ marginTop: 6, color: theme.color.muted }}>Upload, browse, and download brass scores.</p>
          </div>
        </header>

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

        {/* Top synthetic folder-like rows: Home (🏠) and Up (⬆️) */}

  {loading && <p style={{ marginTop: 20, color: theme.color.muted }}>Loading…</p>}
  {error && <p style={{ marginTop: 20, color: '#b00020' }}>{error}</p>}

        <section style={{ marginTop: 16 }}>
          <div style={styles.tableWrap}>
            <div style={{ ...styles.tableHeader, gridTemplateColumns: 'minmax(200px,1fr) 120px 120px' }}>
              <div>Name</div>
              <div style={{ textAlign: 'right' }}>Size</div>
              <div style={{ textAlign: 'right' }}>Action</div>
            </div>

            {/* Home row removed; we now show 🏠 in the breadcrumb and only keep Up in the list */}

            {/* Up row (only if not at root) */}
            {prefix && (
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

            {folders.map((f, idx) => (
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
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>
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
                  gridTemplateColumns: 'minmax(200px,1fr) 120px 120px',
                  background: ((syntheticCount + folders.length + idx) % 2 === 0) ? theme.color.bg : theme.color.surface,
                }}
              >
                <a
                  href="#"
                  onClick={(e)=>{e.preventDefault(); download(f.key);}}
                  style={{ ...styles.tableIconAndName, textDecoration: 'none', color: theme.color.text }}
                >
                  <span style={{ fontSize: 20 }}>📄</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                </a>
                <div style={{ textAlign: 'right' }}>{formatBytes(f.size)}</div>
                <div style={{ textAlign: 'right' }}>
                  <button onClick={() => download(f.key)} style={{ ...styles.buttonBase, ...styles.buttonGhost }}>Download</button>
                </div>
              </div>
            ))}
          </div>
          {!loading && folders.length === 0 && files.length === 0 && (
            <p style={{ color: theme.color.muted, marginTop: 12 }}>Empty here.</p>
          )}
        </section>
      </main>
    </AuthGate>
  );
}
