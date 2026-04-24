import { commitTypes, type CommitType, type SemanticFileChange } from "../domain/models.js";

const typeByFileRule: Array<[RegExp, CommitType]> = [
  [/^(docs\/|README\.md$)/i, "docs"],
  [/^\.github\/workflows\//, "ci"],
  [/(^tests\/|\.test\.[jt]sx?$|\.spec\.[jt]sx?$)/, "test"],
  [/(^package\.json$|^tsconfig\.json$|^Dockerfile$|^docker-compose\.ya?ml$)/i, "build"],
];

const keywordRuleMap: Array<[RegExp, CommitType]> = [
  [/\b(fix|bug|error|exception|regression|handle failure)\b/i, "fix"],
  [/\b(cache|latency|performance|optimi[sz]e|faster)\b/i, "perf"],
  [/\b(refactor|rename|restructure|cleanup)\b/i, "refactor"],
];

const resolveFallbackAllowedType = (allowedTypes: CommitType[]): CommitType =>
  allowedTypes.includes("chore") ? "chore" : allowedTypes[0] ?? "chore";

const enforceAllowedType = (type: CommitType, allowedTypes: CommitType[]): CommitType =>
  allowedTypes.includes(type) ? type : resolveFallbackAllowedType(allowedTypes);

const inferFromSemanticChanges = (semanticChanges: SemanticFileChange[]): CommitType | null => {
  if (semanticChanges.length === 0) {
    return null;
  }

  if (semanticChanges.every((change) => change.changeType === "format-only")) {
    return "style";
  }

  if (semanticChanges.every((change) => change.changeType === "rename-only")) {
    return "refactor";
  }

  if (semanticChanges.every((change) => change.changeType === "deletion-only")) {
    return "refactor";
  }

  return null;
};

export const classifyCommitType = (
  files: string[],
  diff: string,
  semanticChanges: SemanticFileChange[] = [],
  allowedTypes: CommitType[] = [...commitTypes]
): CommitType => {
  const semanticType = inferFromSemanticChanges(semanticChanges);
  if (semanticType) {
    return enforceAllowedType(semanticType, allowedTypes);
  }

  for (const file of files) {
    const rule = typeByFileRule.find(([pattern]) => pattern.test(file));
    if (rule) {
      return enforceAllowedType(rule[1], allowedTypes);
    }
  }

  for (const [pattern, type] of keywordRuleMap) {
    if (pattern.test(diff)) {
      return enforceAllowedType(type, allowedTypes);
    }
  }

  if (files.some((file) => /(^src\/|\.tsx?$|\.jsx?$|\.vue$|\.svelte$)/.test(file))) {
    return enforceAllowedType("feat", allowedTypes);
  }

  return resolveFallbackAllowedType(allowedTypes);
};
