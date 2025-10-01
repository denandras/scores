"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [errMsg, setErrMsg] = useState<string | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        router.replace("/");
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/");
    });

    // Parse possible error in query/hash (e.g., expired magic link)
    try {
      const search = new URL(window.location.href).searchParams;
      const hash = window.location.hash?.startsWith('#') ? new URLSearchParams(window.location.hash.slice(1)) : undefined;
      const err = search.get('error') || hash?.get('error');
      const desc = search.get('error_description') || hash?.get('error_description');
      const full = [err, desc].filter(Boolean).join(': ');
      if (full) {
        setErrMsg(full);
        // If expired, redirect back to login with a hint
        if (/expired/i.test(full)) {
          setTimeout(() => router.replace('/login?expired=1'), 2500);
        }
      }
    } catch {
      // ignore
    }

    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <main style={{ padding: "2rem" }}>
      {errMsg ? (
        <>
          <h1 style={{ margin: 0, fontSize: "1.25rem" }}>Sign-in link issue</h1>
          <p style={{ marginTop: "0.5rem", color: '#b00020' }}>{errMsg}</p>
          {/expired/i.test(errMsg) ? (
            <p style={{ marginTop: "0.5rem" }}>
              Your magic link has expired. Redirecting to login to request a new link…
            </p>
          ) : (
            <p style={{ marginTop: "0.5rem" }}>
              There was an issue with your sign-in link. Please return to the <a href="/login">login page</a> and try again.
            </p>
          )}
        </>
      ) : (
        <>
          <h1 style={{ margin: 0, fontSize: "1.25rem" }}>Signing you in…</h1>
          <p style={{ marginTop: "0.5rem" }}>Please wait while we complete authentication.</p>
        </>
      )}
    </main>
  );
}
