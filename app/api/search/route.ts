import { getServerSupabase } from "@/lib/server/supabaseServer";
import { NextRequest, NextResponse } from "next/server";

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

  return NextResponse.json({ results: data || [] });
}