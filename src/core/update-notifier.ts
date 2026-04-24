import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getCometDirectoryPath } from "../config/paths.js";
import { logger } from "../ui/logger.js";

const UPDATE_CACHE_FILE = "update-check.json";
const UPDATE_CHECK_INTERVAL_MS = 1000 * 60 * 60 * 12;
const UPDATE_NOTIFY_INTERVAL_MS = 1000 * 60 * 60 * 24;
const UPDATE_REQUEST_TIMEOUT_MS = 1500;

export type UpdateNotifierCache = {
  lastCheckedAt?: number;
  latestVersion?: string;
  lastNotifiedAt?: number;
  lastNotifiedVersion?: string;
};

type CheckForPackageUpdateOptions = {
  packageName: string;
  currentVersion: string;
  now?: () => number;
  readCache?: () => Promise<UpdateNotifierCache | null>;
  writeCache?: (cache: UpdateNotifierCache) => Promise<void>;
  fetchLatestVersion?: (packageName: string) => Promise<string | null>;
};

type NotifyIfUpdateAvailableOptions = {
  packageName: string;
  currentVersion: string;
};

const getUpdateCachePath = (): string =>
  path.join(getCometDirectoryPath(), UPDATE_CACHE_FILE);

const parseVersion = (
  version: string
): { major: number; minor: number; patch: number; prerelease: string | null } | null => {
  const match = version.trim().match(
    /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/
  );

  if (!match) {
    return null;
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4] ?? null,
  };
};

export const compareVersions = (left: string, right: string): number => {
  const parsedLeft = parseVersion(left);
  const parsedRight = parseVersion(right);

  if (!parsedLeft || !parsedRight) {
    return left.localeCompare(right, undefined, { numeric: true });
  }

  const segments = [
    parsedLeft.major - parsedRight.major,
    parsedLeft.minor - parsedRight.minor,
    parsedLeft.patch - parsedRight.patch,
  ];

  for (const segment of segments) {
    if (segment !== 0) {
      return segment;
    }
  }

  if (parsedLeft.prerelease === parsedRight.prerelease) {
    return 0;
  }

  if (!parsedLeft.prerelease) {
    return 1;
  }

  if (!parsedRight.prerelease) {
    return -1;
  }

  return parsedLeft.prerelease.localeCompare(parsedRight.prerelease, undefined, {
    numeric: true,
  });
};

const isTruthyEnvFlag = (value: string | undefined): boolean =>
  ["1", "true", "yes", "on"].includes(value?.trim().toLowerCase() ?? "");

const shouldSkipUpdateNotification = (): boolean =>
  isTruthyEnvFlag(process.env.CI) || isTruthyEnvFlag(process.env.COMET_DISABLE_UPDATE_NOTIFIER);

const readUpdateCache = async (): Promise<UpdateNotifierCache | null> => {
  try {
    const raw = await readFile(getUpdateCachePath(), "utf8");
    return JSON.parse(raw) as UpdateNotifierCache;
  } catch {
    return null;
  }
};

const writeUpdateCache = async (cache: UpdateNotifierCache): Promise<void> => {
  const cachePath = getUpdateCachePath();
  await mkdir(path.dirname(cachePath), { recursive: true });
  await writeFile(cachePath, JSON.stringify(cache, null, 2), "utf8");
};

const fetchRegistryVersion = async (packageName: string): Promise<string | null> => {
  try {
    const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(packageName)}/latest`, {
      headers: {
        accept: "application/json",
      },
      signal: AbortSignal.timeout(UPDATE_REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as { version?: unknown };
    return typeof data.version === "string" ? data.version : null;
  } catch {
    return null;
  }
};

const wasRecentlyNotified = (
  cache: UpdateNotifierCache,
  latestVersion: string,
  nowMs: number
): boolean =>
  cache.lastNotifiedVersion === latestVersion &&
  typeof cache.lastNotifiedAt === "number" &&
  nowMs - cache.lastNotifiedAt < UPDATE_NOTIFY_INTERVAL_MS;

export const checkForPackageUpdate = async ({
  packageName,
  currentVersion,
  now = () => Date.now(),
  readCache = readUpdateCache,
  writeCache = writeUpdateCache,
  fetchLatestVersion = fetchRegistryVersion,
}: CheckForPackageUpdateOptions): Promise<string | null> => {
  const nowMs = now();
  let cache = (await readCache()) ?? {};
  let latestVersion = cache.latestVersion ?? null;
  const shouldRefreshLatest =
    !latestVersion ||
    typeof cache.lastCheckedAt !== "number" ||
    nowMs - cache.lastCheckedAt >= UPDATE_CHECK_INTERVAL_MS;

  if (shouldRefreshLatest) {
    const fetchedVersion = await fetchLatestVersion(packageName);
    latestVersion = fetchedVersion ?? latestVersion;
    cache = {
      ...cache,
      lastCheckedAt: nowMs,
      ...(latestVersion ? { latestVersion } : {}),
    };
    await writeCache(cache);
  }

  if (!latestVersion || compareVersions(latestVersion, currentVersion) <= 0) {
    return null;
  }

  if (wasRecentlyNotified(cache, latestVersion, nowMs)) {
    return null;
  }

  const nextCache: UpdateNotifierCache = {
    ...cache,
    lastNotifiedAt: nowMs,
    lastNotifiedVersion: latestVersion,
  };

  await writeCache(nextCache);
  return latestVersion;
};

export const notifyIfUpdateAvailable = async ({
  packageName,
  currentVersion,
}: NotifyIfUpdateAvailableOptions): Promise<void> => {
  if (!packageName || !currentVersion || currentVersion === "0.0.0" || shouldSkipUpdateNotification()) {
    return;
  }

  const latestVersion = await checkForPackageUpdate({
    packageName,
    currentVersion,
  });

  if (!latestVersion) {
    return;
  }

  logger.warn(`Update available ${currentVersion} -> ${latestVersion}`);
  console.log(`  ${logger.muted("Run")} ${logger.accent(`npm i -g ${packageName}@latest`)}`);
};
