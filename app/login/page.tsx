"use client";

import { supabase } from "@/lib/supabaseClient";
import { useMemo, useState } from "react";
import { styles, theme } from "@/components/ui/theme";
import { useSearchParams } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const sp = useSearchParams();
  const expired = useMemo(() => (sp?.get('expired') === '1'), [sp]);

  const sendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSent(false);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      setSent(true);
    } catch (e: any) {
      setError(e?.message ?? "Failed to send sign-in link");
    } finally {
      setLoading(false);
    }
  };

  return (
  <main style={{ padding: theme.space(8) }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <section style={{
          ...styles.card,
          borderRadius: theme.radius.lg,
          boxShadow: theme.shadow.md,
          padding: '1.25rem',
        }}>
          <h1 style={{ margin: 0, fontSize: '1.875rem', letterSpacing: 0.2 }}>Sign in</h1>
          {expired && (
            <div style={{
              marginTop: 10,
              padding: '10px 12px',
              borderRadius: 8,
              border: `1px solid ${theme.color.border}`,
              background: '#fff8f8'
            }}>
              <div style={{ fontWeight: 600, color: '#b00020' }}>Your magic link expired</div>
              <div style={{ marginTop: 4, color: theme.color.text }}>Please request a new sign-in link below.</div>
            </div>
          )}
          <p style={{ marginTop: 8, color: theme.color.muted }}>
            Enter your email address. If it’s allowlisted, you’ll receive a sign-in link.
          </p>

          <form onSubmit={sendMagicLink} style={{ marginTop: 16 }}>
            <label htmlFor="email" style={{ fontSize: 14, color: theme.color.text }}>Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{
                display: 'block',
                marginTop: 6,
                padding: '0.6rem 0.8rem',
                width: '100%',
                border: `1px solid ${theme.color.border}`,
                borderRadius: theme.radius.sm,
                background: theme.color.bg,
              }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.buttonBase,
                marginTop: 12,
                width: '100%',
                justifyContent: 'center',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Sending…' : 'Send magic link'}
            </button>
          </form>

          {sent && (
            <p style={{ color: '#0a7c2f', marginTop: 12 }}>
              Check your inbox for the sign-in link.
            </p>
          )}

          {error && (
            <p style={{ color: '#b00020', marginTop: 12 }}>{error}</p>
          )}
          <div style={{ marginTop: 16, fontSize: 13, color: theme.color.muted }}>
            One of the largest brass sheet music collections. For academic use only. By using this site, you agree to the
            {' '}<a href="/terms" style={{ color: '#111', textDecoration: 'underline' }}>terms of use</a>.
          </div>
        </section>
      </div>
    </main>
  );
}
