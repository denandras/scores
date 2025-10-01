"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        router.replace("/");
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/");
    });

    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <main style={{ padding: "2rem" }}>
      <h1 style={{ margin: 0, fontSize: "1.25rem" }}>Signing you in…</h1>
      <p style={{ marginTop: "0.5rem" }}>Please wait while we complete authentication.</p>
    </main>
  );
}
