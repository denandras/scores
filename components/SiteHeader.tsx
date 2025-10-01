"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { styles, theme } from "@/components/ui/theme";

export default function SiteHeader() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

  const signOut = async () => {
    await supabase.auth.signOut();
    // ensure we land on login after sign out
    window.location.replace('/login');
  };

  return (
    <header className="header-glass" style={{ zIndex: 10 }}>
      <div style={styles.container}>
        {/* Left: Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link href="/" style={styles.brandLink}>TBSL</Link>
        </div>
        {/* Center: User email */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          {!loading && email && (
            <span style={{ fontSize: 14, color: theme.color.text }}>{email}</span>
          )}
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {loading ? (
            <span style={{ color: theme.color.muted }}>…</span>
          ) : email ? (
            <>
              <Link href="/upload" style={{ ...styles.buttonBase, ...styles.buttonGhost }}>Upload</Link>
              <a href="https://ko-fi.com/scorelibrary" target="_blank" rel="noopener noreferrer" style={{ ...styles.buttonBase, ...styles.buttonGhost }}>Support</a>
              <button onClick={signOut} style={{ ...styles.buttonBase, ...styles.buttonGhost }}>Sign out</button>
            </>
          ) : (
            <>
              <a href="https://ko-fi.com/scorelibrary" target="_blank" rel="noopener noreferrer" style={{ ...styles.buttonBase, ...styles.buttonGhost }}>Support</a>
              <Link href="/login" style={{ ...styles.buttonBase, ...styles.buttonGhost }}>Sign in</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
