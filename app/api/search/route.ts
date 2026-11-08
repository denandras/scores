import { getServerSupabase } from "@/lib/server/supabaseServer";
import { getRequesterEmail } from "@/lib/server/restrictedFolderGuard";
import { NextRequest, NextResponse } from "next/server";
import { canAccessRestrictedPathAsync } from "@/lib/folderAccess";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// scores_files has RLS (authenticated-only). The index is just a public
// filename listing — restricted folders are filtered per-requester below —
// so read it with the service role key server-side. This keeps search working
// for anonymous visitors too (public folders only). If the service key is not
// configured, fall back to the cookie-session client (works only when the
// caller has supabase cookies).
function getIndexClient(): SupabaseClient | null {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get('keyword');

  if (!keyword || keyword.trim() === '') {
    return NextResponse.json({ results: [] });
  }

  // Requester identity: Bearer token first (the client sends it from its
  // localStorage session, same as the dashboard does for /api/s4/*), then
  // supabase cookies. Anonymous → null → restricted folders hidden.
  const requesterEmail = await getRequesterEmail(request);

  const indexClient = getIndexClient();
  const queryClient = indexClient ?? (await getServerSupabase());
  const { data, error } = await queryClient
    .from('scores_files')
    .select('path, filename, size_bytes')
    .or(`filename.ilike.%${keyword}%,path.ilike.%${keyword}%`)
    .order('path')
    .limit(100);

  if (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }

  const rawResults = (data || []) as Array<{ path: string; filename: string; size_bytes: number }>;
  const visibilityChecks = await Promise.all(
    rawResults.map(async (row) => {
      const normalizedPath = (row.path || '').replace(/^\/+/, '');
      const canAccess = await canAccessRestrictedPathAsync(normalizedPath, requesterEmail);
      return canAccess ? row : null;
    })
  );
  const results = visibilityChecks.filter((row): row is { path: string; filename: string; size_bytes: number } => row !== null);

  return NextResponse.json({ results });
}
