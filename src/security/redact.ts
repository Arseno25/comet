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
    let count = 0;
    redacted = redacted.replace(clonePattern(entry.pattern), (...args) => {
      count += 1;
      const groups = args.slice(1, -2) as string[];
      return entry.replacement.replace(/\$(\d+)/g, (_match, indexString) => {
        const index = Number(indexString) - 1;
        return groups[index] ?? "";
      });
    });

    if (count > 0) {
      matches.push({ label: entry.label, count });
    }
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
