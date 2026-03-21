type RestrictedRule = {
  restrictedPrefix: string;
  allowedEmails: Set<string>;
};

type RestrictedAccessRow = {
  restricted_prefix: string;
  allowed_email: string;
};

const RESTRICTED_ACCESS_TABLE = 'restricted_folder_access';

let cacheUntil = 0;
let cachedRules: RestrictedRule[] | null = null;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizeRules(rules: RestrictedRule[]): RestrictedRule[] {
  return rules.map((rule) => ({
    restrictedPrefix: normalizeS4Path(rule.restrictedPrefix),
    allowedEmails: new Set(Array.from(rule.allowedEmails).map(normalizeEmail)),
  }));
}

function buildRulesFromRows(rows: RestrictedAccessRow[]): RestrictedRule[] {
  const map = new Map<string, Set<string>>();
  for (const row of rows) {
    const prefix = normalizeS4Path(row.restricted_prefix || '');
    const email = normalizeEmail(row.allowed_email || '');
    if (!prefix || !email) continue;
    if (!map.has(prefix)) map.set(prefix, new Set<string>());
    map.get(prefix)!.add(email);
  }
  return Array.from(map.entries()).map(([restrictedPrefix, allowedEmails]) => ({
    restrictedPrefix,
    allowedEmails,
  }));
}

async function fetchRestrictedRulesFromSupabase(): Promise<RestrictedRule[]> {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!supabaseUrl || !serviceRoleKey) {
    // If restricted access backend is not configured, treat as no restricted rules
    // instead of failing unrelated S3 listing operations.
    return [];
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await admin
      .from(RESTRICTED_ACCESS_TABLE)
      .select('restricted_prefix,allowed_email');

    if (error) {
      throw new Error(`Failed to load restricted folder access rules: ${error.message}`);
    }
    return buildRulesFromRows((data || []) as RestrictedAccessRow[]);
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error('Failed to load restricted folder access rules.');
  }
}

async function getEffectiveRestrictedRules(): Promise<RestrictedRule[]> {
  const now = Date.now();
  if (cachedRules && now < cacheUntil) return cachedRules;

  try {
    const remote = await fetchRestrictedRulesFromSupabase();
    const rules = normalizeRules(remote);
    cachedRules = rules;
    cacheUntil = now + 60_000;
    return rules;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      const message = error instanceof Error ? error.message : 'unknown_error';
      console.warn(`[folderAccess] Using cached/empty rules due to load failure: ${message}`);
    }
    if (cachedRules) return cachedRules;
    // Fail open with no rules so listing/search endpoints stay available.
    cachedRules = [];
    cacheUntil = now + 60_000;
    return cachedRules;
  }
}

export function normalizeS4Path(path: string): string {
  return (path || '').trim().replace(/^\/+/, '');
}

function normalizeComparablePath(path: string): string {
  return normalizeS4Path(path).toLowerCase().replace(/\/+$/, '');
}

function matchRuleForPath(path: string, rules: RestrictedRule[]): RestrictedRule | null {
  const normalized = normalizeComparablePath(path);
  let bestMatch: RestrictedRule | null = null;
  let bestMatchLength = -1;
  for (const rule of rules) {
    const restricted = normalizeComparablePath(rule.restrictedPrefix);
    if (normalized === restricted || normalized.startsWith(`${restricted}/`)) {
      if (restricted.length > bestMatchLength) {
        bestMatch = rule;
        bestMatchLength = restricted.length;
      }
    }
  }
  return bestMatch;
}

export async function canAccessRestrictedPathAsync(path: string, email: string | null | undefined): Promise<boolean> {
  const rules = await getEffectiveRestrictedRules();
  const rule = matchRuleForPath(path, rules);
  if (!rule) return true;
  if (!email) return false;
  return rule.allowedEmails.has(normalizeEmail(email));
}

export async function isRestrictedS4PathAsync(path: string): Promise<boolean> {
  const rules = await getEffectiveRestrictedRules();
  return matchRuleForPath(path, rules) !== null;
}

export async function isRestrictedFolderEntryAsync(parentPrefix: string, folderName: string): Promise<boolean> {
  const fullPath = `${normalizeS4Path(parentPrefix)}${folderName}`;
  return isRestrictedS4PathAsync(fullPath);
}
