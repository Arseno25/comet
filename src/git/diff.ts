import { execa } from "execa";
import type { CometConfig, GitDiffContext, GitDiffStats } from "../domain/models.js";
import { filterFiles } from "../security/file-filter.js";
import { redactSecrets } from "../security/redact.js";
import { getCurrentBranch, getStagedFiles } from "./status.js";

const parseNumstat = (output: string): GitDiffStats => {
  const lines = output.split("\n").map((line) => line.trim()).filter(Boolean);
  let insertions = 0;
  let deletions = 0;

  for (const line of lines) {
    const [rawInsertions, rawDeletions] = line.split("\t");
    insertions += Number(rawInsertions) || 0;
    deletions += Number(rawDeletions) || 0;
  }

  return {
    filesChanged: lines.length,
    insertions,
    deletions,
  };
};

const createSafeDiffFallback = (files: string[], skippedFiles: string[]): string => {
  const sections = ["Changed files:"];
  sections.push(...files.map((file) => `- ${file}`));

  if (skippedFiles.length > 0) {
    sections.push("", "Skipped files:");
    sections.push(...skippedFiles.map((file) => `- ${file}`));
  }

  return sections.join("\n");
};

export const collectDiffContext = async (
  config: CometConfig,
  cwd = process.cwd()
): Promise<GitDiffContext> => {
  const files = await getStagedFiles(cwd);
  const { includedFiles, skippedFiles } = filterFiles(files, config.excludeFiles);
  const diffArgs = includedFiles.length > 0 ? ["--", ...includedFiles] : [];

  const [branch, rawDiffResult, numstatResult] = await Promise.all([
    getCurrentBranch(cwd),
    execa("git", ["diff", "--cached", "--no-ext-diff", "--unified=3", ...diffArgs], { cwd }),
    execa("git", ["diff", "--cached", "--numstat", ...diffArgs], { cwd }),
  ]);

  const rawDiff = rawDiffResult.stdout.trim();
  const redactedDiff = config.redactSecrets ? redactSecrets(rawDiff) : rawDiff;
  const safeDiff = redactedDiff || createSafeDiffFallback(includedFiles, skippedFiles);

  return {
    branch,
    files,
    stats: parseNumstat(numstatResult.stdout),
    rawDiff,
    safeDiff,
    skippedFiles,
  };
};
