import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { commitTypes, type CommitAnalysis, type CommitType, type GeneratedCommit, type RepoMemory, type RepoMemoryInsights } from "../domain/models.js";
import { getGitDirectory } from "../git/status.js";
import { safeJsonParse } from "../utils/json.js";

const REPO_MEMORY_VERSION = 1;
const MAX_RECENT_INTENTS = 6;
const MAX_SCOPE_ENTRIES = 24;

const emptyRepoMemory = (): RepoMemory => ({
  version: REPO_MEMORY_VERSION,
  typeCounts: {},
  scopeCounts: {},
  recentIntents: [],
  lastUpdatedAt: null,
});

const normalizeIntent = (value: string | null | undefined): string | null => {
  if (!value) {
    return null;
  }

  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized ? normalized : null;
};

const resolveRepoMemoryPath = async (cwd: string): Promise<string> => {
  const gitDirectory = await getGitDirectory(cwd);
  return path.resolve(cwd, gitDirectory, "comet-memory.json");
};

const sortTypeCounts = (
  typeCounts: RepoMemory["typeCounts"]
): RepoMemoryInsights["preferredTypes"] =>
  commitTypes
    .map((type) => ({
      type,
      count: typeCounts[type] ?? 0,
    }))
    .filter((entry) => entry.count > 0)
    .sort((left, right) => right.count - left.count)
    .slice(0, 3);

const sortScopeCounts = (
  scopeCounts: RepoMemory["scopeCounts"]
): RepoMemoryInsights["preferredScopes"] =>
  Object.entries(scopeCounts)
    .map(([scope, count]) => ({
      scope,
      count,
    }))
    .filter((entry) => entry.count > 0)
    .sort((left, right) => right.count - left.count)
    .slice(0, 4);

const trimScopeCounts = (scopeCounts: RepoMemory["scopeCounts"]): RepoMemory["scopeCounts"] =>
  Object.fromEntries(
    Object.entries(scopeCounts)
      .sort((left, right) => right[1] - left[1])
      .slice(0, MAX_SCOPE_ENTRIES)
  );

const toCommitType = (value: string): CommitType | null =>
  commitTypes.includes(value as CommitType) ? (value as CommitType) : null;

export const parseCommittedMessage = (
  message: string,
  fallback: GeneratedCommit
): GeneratedCommit => {
  const [firstLine = ""] = message.split(/\r?\n/, 1);
  const normalizedHeader = firstLine.trim().replace(/^[^a-z]+/i, "");
  const match = normalizedHeader.match(/^([a-z]+)(?:\(([^)]+)\))?!?:\s+(.+)$/i);

  if (!match) {
    return fallback;
  }

  const parsedType = toCommitType(match[1]?.toLowerCase() ?? "");
  if (!parsedType) {
    return fallback;
  }

  const scope = match[2]?.trim() || null;
  const subject = match[3]?.trim();

  if (!subject) {
    return fallback;
  }

  return {
    ...fallback,
    type: parsedType,
    scope,
    subject,
  };
};

export const loadRepoMemory = async (cwd = process.cwd()): Promise<RepoMemory> => {
  try {
    const repoMemoryPath = await resolveRepoMemoryPath(cwd);
    const content = await readFile(repoMemoryPath, "utf8");
    const parsed = safeJsonParse<RepoMemory>(content);

    return {
      ...emptyRepoMemory(),
      ...parsed,
      version: REPO_MEMORY_VERSION,
      recentIntents: parsed?.recentIntents ?? [],
      typeCounts: parsed?.typeCounts ?? {},
      scopeCounts: parsed?.scopeCounts ?? {},
      lastUpdatedAt: parsed?.lastUpdatedAt ?? null,
    };
  } catch {
    return emptyRepoMemory();
  }
};

export const summarizeRepoMemory = (repoMemory: RepoMemory): RepoMemoryInsights => ({
  preferredTypes: sortTypeCounts(repoMemory.typeCounts),
  preferredScopes: sortScopeCounts(repoMemory.scopeCounts),
  recentIntents: repoMemory.recentIntents.slice(0, MAX_RECENT_INTENTS),
  lastUpdatedAt: repoMemory.lastUpdatedAt,
});

export const recordRepoMemory = async ({
  cwd,
  commit,
  analysis,
  explicitIntent,
}: {
  cwd?: string;
  commit: GeneratedCommit;
  analysis: CommitAnalysis;
  explicitIntent?: string;
}): Promise<void> => {
  const workingDirectory = cwd ?? process.cwd();
  const repoMemory = await loadRepoMemory(workingDirectory);
  const repoMemoryPath = await resolveRepoMemoryPath(workingDirectory);

  repoMemory.typeCounts[commit.type] = (repoMemory.typeCounts[commit.type] ?? 0) + 1;

  const resolvedScope = commit.scope?.trim() || analysis.candidateScope || null;
  if (resolvedScope) {
    repoMemory.scopeCounts[resolvedScope] = (repoMemory.scopeCounts[resolvedScope] ?? 0) + 1;
    repoMemory.scopeCounts = trimScopeCounts(repoMemory.scopeCounts);
  }

  const normalizedIntent = normalizeIntent(explicitIntent ?? analysis.summary);
  if (normalizedIntent) {
    repoMemory.recentIntents = [
      normalizedIntent,
      ...repoMemory.recentIntents.filter((item) => item !== normalizedIntent),
    ].slice(0, MAX_RECENT_INTENTS);
  }

  repoMemory.lastUpdatedAt = new Date().toISOString();

  await mkdir(path.dirname(repoMemoryPath), { recursive: true });
  await writeFile(repoMemoryPath, `${JSON.stringify(repoMemory, null, 2)}\n`, "utf8");
};
