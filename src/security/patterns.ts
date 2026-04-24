export const secretPatterns: Array<[RegExp, string]> = [
  [/(-----BEGIN [A-Z ]+PRIVATE KEY-----)([\s\S]*?)(-----END [A-Z ]+PRIVATE KEY-----)/g, "$1\n[REDACTED_PRIVATE_KEY]\n$3"],
  [/\b(Bearer)\s+[A-Za-z0-9\-._~+/]+=*/gi, "$1 [REDACTED_BEARER_TOKEN]"],
  [/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9._-]+\.[A-Za-z0-9._-]+\b/g, "[REDACTED_JWT]"],
  [/\b(?:postgres|postgresql|mysql|mariadb|mongodb|redis|amqp|kafka):\/\/[^\s"'`]+/gi, "[REDACTED_DATABASE_URL]"],
  [/\b([A-Z0-9_]*(?:API_KEY|TOKEN|SECRET|PASSWORD|PASS|WEBHOOK_SECRET|CLIENT_SECRET)[A-Z0-9_]*)=([^\r\n]+)/gi, "$1=[REDACTED_SECRET]"],
  [/\b(sk|rk|pk)_[A-Za-z0-9]{12,}\b/g, "[REDACTED_SECRET]"],
  [/("?(?:apiKey|api_key|token|secret|password|client_secret)"?\s*[:=]\s*"?)([^"\r\n]+)("?)/gi, "$1[REDACTED_SECRET]$3"],
];
