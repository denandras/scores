import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function POST(request: Request) {
  const url = new URL(request.url);
  const body = await request.json().catch(() => ({}));
  const hash = (body?.hash as string) || url.hash || '';

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options, maxAge: 0 });
        },
      },
    }
  );

  // Supabase JS automatically reads URL fragments when running in the browser.
  // On the server we need to pass the fragment through an exchange call.
  // However, createServerClient manages cookie set during getSession() after a redirect.
  // Here we simply touch getSession() to ensure cookies are set based on incoming headers.
  await supabase.auth.getSession();

  return NextResponse.json({ ok: true });
}
