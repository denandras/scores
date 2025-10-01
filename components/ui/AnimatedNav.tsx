"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AnimatedNav() {
  const [email, setEmail] = useState<string | null>(null);
  useEffect(() => {
    let unsub = () => {};
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setEmail(session?.user?.email ?? null);
      const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setEmail(s?.user?.email ?? null));
      unsub = () => sub.subscription.unsubscribe();
    })();
    return () => unsub();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.replace('/login');
  };

  return (
    <motion.nav
      className="header-glass"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 160, damping: 20 }}
    >
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-2 px-4 py-3">
        <Link href="/" className="font-semibold tracking-tight">TBSL</Link>
        <div className="flex-1 text-center text-sm text-gray-700">{email ?? ''}</div>
        <div className="flex items-center gap-2">
          {email ? (
            <>
              <Link href="/upload" className="btn btn-primary">Upload</Link>
              <button onClick={signOut} className="btn btn-primary">Sign out</button>
            </>
          ) : (
            <Link href="/login" className="btn btn-ghost">Sign in</Link>
          )}
        </div>
      </div>
    </motion.nav>
  );
}
