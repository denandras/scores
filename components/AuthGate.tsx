"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let unsub = () => {};

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/login");
        return;
      }
      setEmail(session.user.email ?? null);
      setReady(true);

      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!session) router.replace("/login");
      });
      unsub = () => sub.subscription.unsubscribe();
    };

    init();
    return () => unsub();
  }, [router]);

  if (!ready) {
    return <p style={{ padding: "2rem" }}>Loading…</p>;
  }

  return (
    <section>
      {children}
    </section>
  );
}
