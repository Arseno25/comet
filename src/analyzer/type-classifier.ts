import type { CommitType } from "../domain/models.js";

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

export const classifyCommitType = (files: string[], diff: string): CommitType => {
  for (const file of files) {
    const rule = typeByFileRule.find(([pattern]) => pattern.test(file));
    if (rule) {
      return rule[1];
    }
  }

  for (const [pattern, type] of keywordRuleMap) {
    if (pattern.test(diff)) {
      return type;
    }
  }

  if (files.some((file) => /(^src\/|\.tsx?$|\.jsx?$|\.vue$|\.svelte$)/.test(file))) {
    return "feat";
  }

  return "chore";
};
