"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { styles, theme } from "@/components/ui/theme";

export default function SiteHeader() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  // No router or search params needed in simplified header

  useEffect(() => {
    let unsub = () => {};
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setEmail(session?.user?.email ?? null);
      setLoading(false);
      const { data: sub } = supabase.auth.onAuthStateChange((_e: any, s: any) => {
        setEmail(s?.user?.email ?? null);
      });
      unsub = () => sub.subscription.unsubscribe();
    })();
    return () => unsub();
  }, []);

  // No explicit sign-in/out buttons in header per requirements

  // No search synchronization in header anymore

  const username = email ? (email.split('@')[0] || email) : null;

  return (
    <header className="header-glass" style={{ zIndex: 10 }}>
      <div style={{
        ...styles.container,
        display: 'grid',
        // Three columns: left and right flex, center auto -> center stays mathematically centered
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        gap: 8,
      }}>
        {/* Left: Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <Link href="/" style={styles.brandLink}>TBSL</Link>
        </div>
        {/* Center: Username (true center in header) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minWidth: 0 }}>
          {/* Username (from email local-part) */}
          {!loading && username && (
            <span title={email || undefined} style={{
              fontSize: 14,
              color: theme.color.text,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '40ch',
            }}>{username}</span>
          )}
        </div>

        {/* Right: Actions (compact on mobile) - no sign in/out */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'nowrap' as const, justifySelf: 'end' }}>
          {loading ? (
            <span style={{ color: theme.color.muted }}>…</span>
          ) : (
            <>
              {/* Upload visible; AuthGate on /upload protects access */}
              {username && (
                pathname === '/upload' ? (
                  <>
                    <Link href="/" style={{ ...styles.buttonBase, ...styles.buttonGhost, padding: '6px 10px' }}>Library</Link>
                    <Link href="/search" style={{ ...styles.buttonBase, ...styles.buttonGhost, padding: '6px 10px', background: '#ffeb3b', color: '#000' }}>Search</Link>
                  </>
                ) : pathname === '/search' ? (
                  <Link href="/" style={{ ...styles.buttonBase, ...styles.buttonGhost, padding: '6px 10px' }}>Library</Link>
                ) : (
                  <Link href="/search" style={{ ...styles.buttonBase, ...styles.buttonGhost, padding: '6px 10px', background: '#ffeb3b', color: '#000' }}>Search</Link>
                )
              )}
              <Link href="/upload" style={{ ...styles.buttonBase, ...styles.buttonGhost, padding: '6px 10px' }}>Upload</Link>
              <a href="https://ko-fi.com/scorelibrary" target="_blank" rel="noopener noreferrer" style={{ ...styles.buttonBase, ...styles.buttonGhost, padding: '6px 10px' }}>Support</a>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
