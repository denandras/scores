"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export const dynamic = 'force-dynamic';

export default function Page() {
  const router = useRouter();
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const dest = session ? "/dashboard" : "/login";
        // Use window.location.replace to avoid any client router edge cases
        if (!cancelled) window.location.replace(dest);
      } catch {
        if (!cancelled) window.location.replace("/login");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);
  return <main style={{ padding: '2rem' }}>Redirecting…</main>;
}
