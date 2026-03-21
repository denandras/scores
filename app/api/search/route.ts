import { getServerSupabase } from "@/lib/server/supabaseServer";
import { NextRequest, NextResponse } from "next/server";
import { canAccessRestrictedPathAsync } from "@/lib/folderAccess";

export async function GET(request: NextRequest) {
  const supabase = await getServerSupabase();
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get('keyword');

  if (!keyword || keyword.trim() === '') {
    return NextResponse.json({ results: [] });
  }

  const { data, error } = await supabase
    .from('scores_files')
    .select('path, filename, size_bytes')
    .or(`filename.ilike.%${keyword}%,path.ilike.%${keyword}%`)
    .order('path')
    .limit(100);

  if (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }

  const { data: authData } = await supabase.auth.getUser();
  const requesterEmail = authData.user?.email ?? null;

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