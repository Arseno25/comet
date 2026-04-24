import { secretPatterns } from "./patterns.js";

export const redactSecrets = (value: string): string => {
  let redacted = value;

  for (const [pattern, replacement] of secretPatterns) {
    redacted = redacted.replace(pattern, replacement);
  }

  return redacted;
};
