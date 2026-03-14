"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { styles, theme } from "@/components/ui/theme";
import { motion, AnimatePresence } from "framer-motion";


export default function SiteHeader() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [introPlaying, setIntroPlaying] = useState(false);
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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const shown = sessionStorage.getItem('tbsl-support-intro');
    if (!shown) {
      setIntroPlaying(true);
      const t = setTimeout(() => {
        setIntroPlaying(false);
        sessionStorage.setItem('tbsl-support-intro', '1');
      }, 4500);
      return () => clearTimeout(t);
    }
  }, []);

  // No explicit sign-in/out buttons in header per requirements

  // No search synchronization in header anymore

  const username = email ? (email.split('@')[0] || email) : null;

  return (
    <>
      <AnimatePresence>
        {introPlaying && (
          <motion.div
            key="support-intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(255,246,236,0.15)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}
          >
            <motion.a
              href="https://ko-fi.com/scorelibrary"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.35, delay: 0.15 }}
              style={{
                ...styles.buttonBase,
                ...styles.buttonGhost,
                padding: '16px 40px',
                fontSize: 'clamp(15px, 4vw, 22px)',
                fontWeight: 700,
                borderRadius: 16,
                boxShadow: '0 12px 40px rgba(47,36,25,0.18)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 12,
                cursor: 'pointer',
                letterSpacing: 0.3,
                maxWidth: 'min(520px, calc(100vw - 32px))',
                whiteSpace: 'normal',
                textAlign: 'center' as const,
              }}
            >
              ☕ Support TBSL — it&#39;s free to use!
            </motion.a>
          </motion.div>
        )}
      </AnimatePresence>
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
                    <Link href="/search" style={{ ...styles.buttonBase, ...styles.buttonGhost, padding: '6px 10px' }}>Search</Link>
                  </>
                ) : pathname === '/search' ? (
                  <Link href="/" style={{ ...styles.buttonBase, ...styles.buttonGhost, padding: '6px 10px' }}>Library</Link>
                ) : (
                  <Link href="/search" style={{ ...styles.buttonBase, ...styles.buttonGhost, padding: '6px 10px' }}>Search</Link>
                )
              )}
              <Link href="/upload" style={{ ...styles.buttonBase, ...styles.buttonGhost, padding: '6px 10px' }}>Upload</Link>
              <motion.a
                layoutId="support-ko-fi"
                href="https://ko-fi.com/scorelibrary"
                target="_blank"
                rel="noopener noreferrer"
                style={{ ...styles.buttonBase, ...styles.buttonGhost, padding: '6px 10px' }}
                className="tbsl-support-btn"
              >
                ☕ <span className="tbsl-support-label">Support</span>
              </motion.a>
            </>
          )}
        </div>
      </div>
      </header>
    </>
  );
}
