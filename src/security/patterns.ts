export interface SecretPattern {
  label: string;
  pattern: RegExp;
  replacement: string;
}

export const secretPatterns: SecretPattern[] = [
  {
    label: "private-key",
    pattern: /(-----BEGIN [A-Z ]+PRIVATE KEY-----)([\s\S]*?)(-----END [A-Z ]+PRIVATE KEY-----)/g,
    replacement: "$1\n[REDACTED_PRIVATE_KEY]\n$3",
  },
  {
    label: "bearer-token",
    pattern: /\b(Bearer)\s+[A-Za-z0-9\-._~+/]+=*/gi,
    replacement: "$1 [REDACTED_BEARER_TOKEN]",
  },
  {
    label: "jwt",
    pattern: /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9._-]+\.[A-Za-z0-9._-]+\b/g,
    replacement: "[REDACTED_JWT]",
  },
  {
    label: "database-url",
    pattern: /\b(?:postgres|postgresql|mysql|mariadb|mongodb|redis|amqp|kafka):\/\/[^\s"'`]+/gi,
    replacement: "[REDACTED_DATABASE_URL]",
  },
  {
    label: "env-secret",
    pattern: /\b([A-Z0-9_]*(?:API_KEY|TOKEN|SECRET|PASSWORD|PASS|WEBHOOK_SECRET|CLIENT_SECRET)[A-Z0-9_]*)=([^\r\n]+)/gi,
    replacement: "$1=[REDACTED_SECRET]",
  },
  {
    label: "opaque-secret",
    pattern: /\b(sk|rk|pk)_[A-Za-z0-9]{12,}\b/g,
    replacement: "[REDACTED_SECRET]",
  },
  {
    label: "json-secret",
    pattern: /("?(?:apiKey|api_key|token|secret|password|client_secret)"?\s*[:=]\s*"?)([^"\r\n]+)("?)/gi,
    replacement: "$1[REDACTED_SECRET]$3",
  },
];
