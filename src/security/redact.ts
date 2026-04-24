import type { RedactionReport } from "../domain/models.js";
import { secretPatterns } from "./patterns.js";

const clonePattern = (pattern: RegExp): RegExp => new RegExp(pattern.source, pattern.flags);

export const createEmptyRedactionReport = (): RedactionReport => ({
  changed: false,
  totalMatches: 0,
  matches: [],
});

export const redactSecrets = (value: string): string => redactSecretsWithReport(value).value;

export const redactSecretsWithReport = (
  value: string
): { value: string; report: RedactionReport } => {
  let redacted = value;
  const matches: RedactionReport["matches"] = [];

  for (const entry of secretPatterns) {
    const pattern = clonePattern(entry.pattern);
    const found = [...redacted.matchAll(pattern)].length;
    if (found === 0) {
      continue;
    }

    redacted = redacted.replace(clonePattern(entry.pattern), entry.replacement);
    matches.push({
      label: entry.label,
      count: found,
    });
  }

  const totalMatches = matches.reduce((total, match) => total + match.count, 0);

  return {
    value: redacted,
    report: {
      changed: totalMatches > 0,
      totalMatches,
      matches,
    },
  };
};
