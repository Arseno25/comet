const scopeRules: Array<[RegExp, string]> = [
  [/^src\/auth\//, "auth"],
  [/^src\/api\/payment\//, "payment"],
  [/^src\/components\//, "ui"],
  [/^src\/database\//, "db"],
  [/^src\/config\//, "config"],
  [/^\.github\/workflows\//, "ci"],
  [/^docs\//, "docs"],
  [/^README\.md$/i, "docs"],
  [/^docker-compose\.ya?ml$/i, "docker"],
];

const normalizeArea = (file: string): string => {
  const [first, second] = file.split("/");
  if (!second) {
    return first ?? "repo";
  }

  return second;
};

const resolveScopeFromMap = (
  file: string,
  policyScopeMap: Record<string, string> | null
): string | null => {
  if (!policyScopeMap) {
    return null;
  }

  const matched = Object.entries(policyScopeMap).find(([prefix]) => file.startsWith(prefix));
  return matched?.[1] ?? null;
};

export const detectAreaForFile = (
  file: string,
  policyScopeMap: Record<string, string> | null = null
): string => {
  const mappedScope = resolveScopeFromMap(file, policyScopeMap);
  const matchedRule = scopeRules.find(([pattern]) => pattern.test(file));
  return mappedScope ?? matchedRule?.[1] ?? normalizeArea(file);
};

export const detectScope = (
  files: string[],
  policyScopeMap: Record<string, string> | null = null
): { scope: string | null; changedAreas: string[] } => {
  const counts = new Map<string, number>();
  const changedAreas = new Set<string>();

  for (const file of files) {
    const scope = detectAreaForFile(file, policyScopeMap);
    changedAreas.add(scope);
    counts.set(scope, (counts.get(scope) ?? 0) + 1);
  }

  const dominant = [...counts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? null;
  if (counts.size > 1) {
    const [first, second] = [...counts.values()].sort((left, right) => right - left);
    if ((second ?? 0) >= (first ?? 0)) {
      return {
        scope: null,
        changedAreas: [...changedAreas],
      };
    }
  }

  return {
    scope: dominant,
    changedAreas: [...changedAreas],
  };
};
