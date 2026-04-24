import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { CometConfig } from "../domain/models.js";
import { safeJsonParse } from "../utils/json.js";
import { defaultConfig } from "./default.js";
import {
  configKeys,
  configKeyToEnvKey,
  envKeyToConfigKey,
  parseEnvFile,
  parseScalarValue,
  stringifyScalarValue,
  type ConfigKey,
} from "./parser.js";
import { getGlobalConfigPath, projectConfigCandidates } from "./paths.js";
import { configSchema } from "./schema.js";

const readConfigFile = async (filePath: string): Promise<Record<string, string>> => {
  try {
    const content = await readFile(filePath, "utf8");
    if (filePath.endsWith(".json")) {
      const parsed = safeJsonParse<Record<string, string | number | boolean | null>>(content) ?? {};
      return Object.fromEntries(
        Object.entries(parsed).map(([key, value]) => [key, value == null ? "" : String(value)])
      );
    }

    return parseEnvFile(content);
  } catch {
    return {};
  }
};

const walkUpForConfig = async (startDir: string): Promise<string | null> => {
  let currentDir = startDir;

  while (true) {
    for (const candidate of projectConfigCandidates) {
      const candidatePath = path.join(currentDir, candidate);
      try {
        await readFile(candidatePath, "utf8");
        return candidatePath;
      } catch {
        continue;
      }
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      return null;
    }

    currentDir = parentDir;
  }
};

const normalizeEnvObject = (envObject: Record<string, string | undefined>): Partial<CometConfig> => {
  const normalized: Partial<CometConfig> = {};

  for (const [envKey, rawValue] of Object.entries(envObject)) {
    if (rawValue === undefined) {
      continue;
    }

    const configKey = envKeyToConfigKey(envKey);
    if (!configKey) {
      continue;
    }

    normalized[configKey] = parseScalarValue(configKey, rawValue) as never;
  }

  return normalized;
};

const serializeConfig = (configEntries: Partial<CometConfig>): string =>
  configKeys
    .filter((key) => configEntries[key] !== undefined)
    .map((key) => `${configKeyToEnvKey(key)}=${stringifyScalarValue(key, configEntries[key])}`)
    .join("\n");

export const ensureGlobalConfigFile = async (): Promise<string> => {
  const globalConfigPath = getGlobalConfigPath();
  await mkdir(path.dirname(globalConfigPath), { recursive: true });

  try {
    await readFile(globalConfigPath, "utf8");
  } catch {
    await writeFile(globalConfigPath, serializeConfig(defaultConfig), "utf8");
  }

  return globalConfigPath;
};

export const loadConfig = async (
  overrides: Partial<CometConfig> = {},
  cwd = process.cwd()
): Promise<CometConfig> => {
  const globalConfigPath = await ensureGlobalConfigFile();
  const projectConfigPath = await walkUpForConfig(cwd);

  const [globalEntries, projectEntries] = await Promise.all([
    readConfigFile(globalConfigPath),
    projectConfigPath ? readConfigFile(projectConfigPath) : Promise.resolve({}),
  ]);

  const merged = {
    ...defaultConfig,
    ...normalizeEnvObject(globalEntries),
    ...normalizeEnvObject(projectEntries),
    ...normalizeEnvObject(process.env),
    ...overrides,
  };

  return configSchema.parse(merged);
};

export const readGlobalConfig = async (): Promise<Partial<CometConfig>> => {
  const filePath = await ensureGlobalConfigFile();
  const entries = await readConfigFile(filePath);
  return normalizeEnvObject(entries);
};

export const setGlobalConfigValue = async (key: ConfigKey, rawValue: string): Promise<string> => {
  const filePath = await ensureGlobalConfigFile();
  const current = await readGlobalConfig();
  current[key] = parseScalarValue(key, rawValue) as never;
  await writeFile(filePath, serializeConfig(current), "utf8");
  return filePath;
};

export const setManyGlobalConfigValues = async (
  entries: Array<{ key: ConfigKey; value: string }>
): Promise<string> => {
  const filePath = await ensureGlobalConfigFile();
  const current = await readGlobalConfig();

  for (const entry of entries) {
    current[entry.key] = parseScalarValue(entry.key, entry.value) as never;
  }

  await writeFile(filePath, serializeConfig(current), "utf8");
  return filePath;
};

export const unsetGlobalConfigValue = async (key: ConfigKey): Promise<string> => {
  const filePath = await ensureGlobalConfigFile();
  const current = await readGlobalConfig();
  delete current[key];
  await writeFile(filePath, serializeConfig(current), "utf8");
  return filePath;
};

export const maskConfigValue = (key: ConfigKey, value: unknown): string => {
  if (key === "apiKey") {
    return value ? "[configured]" : "[empty]";
  }

  if (value === null || value === undefined) {
    return "";
  }

  if (Array.isArray(value) || typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
};
