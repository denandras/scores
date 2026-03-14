type RestrictedRule = {
  restrictedPrefix: string;
  allowedEmails: Set<string>;
};

const RESTRICTED_RULES: RestrictedRule[] = [
  {
    restrictedPrefix: '03 Mixed Chamber/07 Septet/',
    allowedEmails: new Set([
      'denandras@gmail.com',
      'nagykristof1932@gmail.com',
      'vidamatyi03@gmail.com',
      'szilagyidusi@gmail.com',
      'nsandor033@gmail.com',
      'gulyasbuda18@gmail.com',
      'farago.isty5@gmail.com',
      'husztiboldizsar@gmail.com',
      'baczko.vince@gmail.com',
    ]),
  },
  {
    restrictedPrefix: '07 Trombone/_Trombone Ensemble/8/_SETREN/',
    allowedEmails: new Set([
      'denandras@gmail.com',
    ]),
  },
];

export function normalizeS4Path(path: string): string {
  return (path || '').trim().replace(/^\/+/, '');
}

function normalizeComparablePath(path: string): string {
  return normalizeS4Path(path).toLowerCase().replace(/\/+$/, '');
}

function matchRuleForPath(path: string): RestrictedRule | null {
  const normalized = normalizeComparablePath(path);
  for (const rule of RESTRICTED_RULES) {
    const restricted = normalizeComparablePath(rule.restrictedPrefix);
    if (normalized === restricted || normalized.startsWith(`${restricted}/`)) {
      return rule;
    }
  }
  return null;
}

export function canAccessRestrictedPath(path: string, email: string | null | undefined): boolean {
  const rule = matchRuleForPath(path);
  if (!rule) return true;
  if (!email) return false;
  return rule.allowedEmails.has(email.trim().toLowerCase());
}

export function isRestrictedS4Path(path: string): boolean {
  return matchRuleForPath(path) !== null;
}

export function isRestrictedFolderParentPath(path: string): boolean {
  const normalized = normalizeComparablePath(path);
  return RESTRICTED_RULES.some((rule) => {
    const parent = normalizeComparablePath(rule.restrictedPrefix).replace(/\/[^/]+$/, '');
    return normalized === parent;
  });
}

export function isRestrictedFolderEntry(parentPrefix: string, folderName: string): boolean {
  const fullPath = `${normalizeS4Path(parentPrefix)}${folderName}`;
  return isRestrictedS4Path(fullPath);
}
