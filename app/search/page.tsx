"use client";

import AuthGate from "@/components/AuthGate";
import { Suspense, useState } from "react";
import { styles, theme } from "@/components/ui/theme";
import { formatBytes } from "@/lib/format";

type SearchResult = {
  path: string;
  filename: string;
  size_bytes: number;
};

function SearchContent() {
  const [keyword, setKeyword] = useState<string>("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const search = async (k: string) => {
    const trimmed = k.trim();
    if (!trimmed || trimmed.length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    setLoading(true);
    setError(null);
    setHasSearched(true);
    try {
      const res = await fetch(`/api/search?keyword=${encodeURIComponent(trimmed)}`);
      if (!res.ok) throw new Error(`Search failed: ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResults(data.results || []);
    } catch (e: any) {
      setError(e?.message || 'error');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    search(keyword);
  };

  return (
    <main style={{ padding: "2rem 0" }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' as const }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "2rem", letterSpacing: 0.2 }}>Search Scores</h1>
          {(() => {
            let text: string;
            let color: string = theme.color.muted as string;
            if (error) { text = 'Search is currently unavailable, possible cause: database is being updated'; color = '#b00020'; }
            else if (loading) { text = 'Searching…'; }
            else if (results.length > 0) { text = `Found ${results.length}${results.length === 100 ? '+' : ''} result${results.length === 1 ? '' : 's'}`; }
            else if (hasSearched && keyword.trim()) { text = 'No results found'; }
            else if (keyword.trim() && keyword.trim().length < 2) { text = 'Enter at least 2 characters to search'; }
            else { text = 'Search for files and folders by name or path.'; }
            return <p style={{ marginTop: 6, color }}>{text}</p>;
          })()}
        </div>
      </header>

      <form onSubmit={handleSubmit} style={{ marginTop: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Enter search keyword..."
          style={{
            flex: 1,
            padding: '0.5rem',
            border: `1px solid ${theme.color.border}`,
            borderRadius: theme.radius.sm,
            background: theme.color.bg,
            color: theme.color.text,
          }}
        />
        <button
          type="submit"
          style={{ ...styles.buttonBase, ...styles.buttonGhost, padding: '0.5rem 1rem' }}
          disabled={loading}
        >
          Search
        </button>
      </form>

      {hasSearched && (
        <section style={{ marginTop: 16 }}>
          <div style={{ ...styles.tableWrap }}>
            <div className="tbsl-header" style={{ ...styles.tableHeader, gridTemplateColumns: 'minmax(120px,1fr) minmax(120px,1fr) 80px' }}>
              <div className="tbsl-h-name">Name</div>
              <div className="tbsl-h-path">Path</div>
              <div className="tbsl-h-size" style={{ textAlign: 'right' }}>Size</div>
            </div>

            {results.map((r, idx) => (
              <div
                key={`${r.path}-${idx}`}
                style={{
                  ...styles.tableRow,
                  gridTemplateColumns: 'minmax(120px,1fr) minmax(120px,1fr) 80px',
                  background: (idx % 2 === 0) ? theme.color.bg : theme.color.surface,
                }}
              >
                <div style={{ ...styles.tableIconAndName }}>
                <span style={{ fontSize: 20 }}>{r.size_bytes > 0 ? (r.filename.toLowerCase().endsWith('.zip') ? '📦' : '📄') : '📁'}</span>
                  <span className="tbsl-filename">{r.filename}</span>
                </div>
                <div>{r.path}</div>
                <div style={{ textAlign: 'right' }}>{r.size_bytes > 0 ? formatBytes(r.size_bytes) : '—'}</div>
              </div>
            ))}
          </div>
          {!loading && results.length === 0 && keyword.trim() && !error && (
            <p style={{ color: theme.color.muted, marginTop: 12 }}>No results found</p>
          )}
        </section>
      )}
    </main>
  );
}

export default function SearchPage() {
  return (
    <AuthGate>
      <Suspense fallback={<main style={{ padding: "2rem 0" }}><p style={{ color: theme.color.muted, padding: 16 }}>Loading…</p></main>}>
        <SearchContent />
      </Suspense>
    </AuthGate>
  );
}