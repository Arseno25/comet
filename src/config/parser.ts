import dotenv from "dotenv";

const keyMap = {
  provider: "COMET_PROVIDER",
  model: "COMET_MODEL",
  baseUrl: "COMET_BASE_URL",
  apiKey: "COMET_API_KEY",
  customHeaders: "COMET_CUSTOM_HEADERS",
  promptModule: "COMET_PROMPT_MODULE",
  language: "COMET_LANGUAGE",
  description: "COMET_DESCRIPTION",
  emoji: "COMET_EMOJI",
  oneLine: "COMET_ONE_LINE",
  omitScope: "COMET_OMIT_SCOPE",
  why: "COMET_WHY",
  messageTemplate: "COMET_MESSAGE_TEMPLATE",
  maxInputTokens: "COMET_MAX_INPUT_TOKENS",
  maxOutputTokens: "COMET_MAX_OUTPUT_TOKENS",
  autoCommit: "COMET_AUTO_COMMIT",
  gitPush: "COMET_GIT_PUSH",
  stageAll: "COMET_STAGE_ALL",
  redactSecrets: "COMET_REDACT_SECRETS",
  excludeFiles: "COMET_EXCLUDE_FILES",
  privacyMode: "COMET_PRIVACY_MODE",
  policyAllowedTypes: "COMET_POLICY_ALLOWED_TYPES",
  policyRequireIssueKey: "COMET_POLICY_REQUIRE_ISSUE_KEY",
  issueKeyPattern: "COMET_ISSUE_KEY_PATTERN",
  policyScopeMap: "COMET_POLICY_SCOPE_MAP",
} as const;

export type ConfigKey = keyof typeof keyMap;

export const configKeys = Object.keys(keyMap) as ConfigKey[];

export const configKeyToEnvKey = (key: ConfigKey): string => keyMap[key];

export const envKeyToConfigKey = (envKey: string): ConfigKey | null => {
  const entry = Object.entries(keyMap).find(([, value]) => value === envKey);
  return (entry?.[0] as ConfigKey | undefined) ?? null;
};

export const resolveConfigKeyName = (value: string): ConfigKey | null => {
  const normalized = value.replace(/[-_\s]/g, "").toLowerCase();

  return (
    configKeys.find((key) => key.toLowerCase() === normalized) ??
    configKeys.find((key) => configKeyToEnvKey(key).replace(/_/g, "").toLowerCase() === normalized) ??
    null
  );
};

export const parseEnvFile = (content: string): Record<string, string> => dotenv.parse(content);

const booleanKeys = new Set<ConfigKey>([
  "description",
  "emoji",
  "oneLine",
  "omitScope",
  "why",
  "autoCommit",
  "gitPush",
  "stageAll",
  "redactSecrets",
  "policyRequireIssueKey",
]);

const numberKeys = new Set<ConfigKey>(["maxInputTokens", "maxOutputTokens"]);

export const parseScalarValue = (key: ConfigKey, rawValue: string): unknown => {
  if (booleanKeys.has(key)) {
    return rawValue.trim().toLowerCase() === "true";
  }

  if (numberKeys.has(key)) {
    return Number(rawValue);
  }

  if (key === "customHeaders") {
    if (!rawValue.trim()) {
      return null;
    }

    return JSON.parse(rawValue) as Record<string, string>;
  }

  if (key === "excludeFiles") {
    if (!rawValue.trim()) {
      return undefined;
    }

    if (rawValue.trim().startsWith("[")) {
      return JSON.parse(rawValue) as string[];
    }

    return rawValue
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
  }

  if (key === "policyAllowedTypes") {
    if (!rawValue.trim()) {
      return undefined;
    }

    if (rawValue.trim().startsWith("[")) {
      return JSON.parse(rawValue) as string[];
    }

    return rawValue
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
  }

  if (key === "policyScopeMap") {
    if (!rawValue.trim()) {
      return null;
    }

    return JSON.parse(rawValue) as Record<string, string>;
  }

  if (!rawValue.trim()) {
    return null;
  }

  return rawValue;
};

export const stringifyScalarValue = (key: ConfigKey, value: unknown): string => {
  if (value === undefined || value === null) {
    return "";
  }

  if (Array.isArray(value) || typeof value === "object") {
    return JSON.stringify(value);
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  return key === "messageTemplate" ? String(value) : String(value).trim();
};
