import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { canAccessRestrictedPathAsync, isRestrictedS4PathAsync, normalizeS4Path } from '@/lib/folderAccess';
import { getServerSupabase } from '@/lib/server/supabaseServer';

async function getEmailFromBearerToken(req?: Request): Promise<string | null> {
  if (!req) return null;
  const auth = req.headers.get('authorization') || '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  const token = m?.[1]?.trim();
  if (!token) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;

  try {
    const supabase = createClient(url, anon);
    const { data, error } = await supabase.auth.getUser(token);
    if (error) return null;
    return data.user?.email ?? null;
  } catch {
    return null;
  }
}

export async function getRequesterEmail(req?: Request): Promise<string | null> {
  const bearerEmail = await getEmailFromBearerToken(req);
  if (bearerEmail) return bearerEmail;

  try {
    const supabase = await getServerSupabase();
    const { data, error } = await supabase.auth.getUser();
    if (error) return null;
    return data.user?.email ?? null;
  } catch {
    return null;
  }
}

export async function requireRestrictedFolderAccess(path: string, req?: Request): Promise<NextResponse | null> {
  const normalizedPath = normalizeS4Path(path);
  if (!(await isRestrictedS4PathAsync(normalizedPath))) return null;

  const email = await getRequesterEmail(req);
  if (await canAccessRestrictedPathAsync(normalizedPath, email)) return null;

  return NextResponse.json(
    { ok: false, error: 'forbidden_restricted_folder' },
    { status: 403 }
  );
}
