import { execa } from "execa";
import type { CometConfig, GitDiffContext, GitDiffStats } from "../domain/models.js";
import { extractIssueKey } from "../analyzer/issue-key.js";
import { filterFiles } from "../security/file-filter.js";
import { createEmptyRedactionReport, redactSecretsWithReport } from "../security/redact.js";
import { getCurrentBranch, getStagedFiles } from "./status.js";
import { parseSemanticDiff, renderSemanticDiff } from "./semantic-diff.js";

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

const createSafeDiffFallback = (
  files: string[],
  skippedFiles: string[],
  semanticDiff: string
): string => {
  const sections = ["Changed files:"];
  sections.push(...files.map((file) => `- ${file}`));

  if (semanticDiff.trim()) {
    sections.push("", "Semantic diff:", semanticDiff);
  }

  if (skippedFiles.length > 0) {
    sections.push("", "Skipped files:");
    sections.push(...skippedFiles.map((file) => `- ${file}`));
  }

  return sections.join("\n");
};

const buildDiffArgs = (files: string[]): string[] => (files.length > 0 ? ["--", ...files] : []);

const buildContext = ({
  config,
  branch,
  files,
  includedFiles,
  skippedFiles,
  rawDiff,
  numstat,
}: {
  config: CometConfig;
  branch: string;
  files: string[];
  includedFiles: string[];
  skippedFiles: string[];
  rawDiff: string;
  numstat: string;
}): GitDiffContext => {
  const redactionResult = config.redactSecrets
    ? redactSecretsWithReport(rawDiff)
    : {
        value: rawDiff,
        report: createEmptyRedactionReport(),
      };

  const semanticChanges = parseSemanticDiff(redactionResult.value);
  const semanticDiff = renderSemanticDiff(semanticChanges);
  const safeDiff = redactionResult.value || createSafeDiffFallback(includedFiles, skippedFiles, semanticDiff);

  return {
    branch,
    issueKey: extractIssueKey(branch, config.issueKeyPattern),
    files,
    includedFiles,
    stats: parseNumstat(numstat),
    rawDiff,
    safeDiff,
    semanticDiff,
    skippedFiles,
    redactionReport: redactionResult.report,
    semanticChanges,
  };
};

export const collectDiffContext = async (
  config: CometConfig,
  cwd = process.cwd()
): Promise<GitDiffContext> => {
  const files = await getStagedFiles(cwd);
  const { includedFiles, skippedFiles } = filterFiles(files, config.excludeFiles);
  const diffArgs = buildDiffArgs(includedFiles);

  const [branch, rawDiffResult, numstatResult] = await Promise.all([
    getCurrentBranch(cwd),
    execa("git", ["diff", "--cached", "--no-ext-diff", "--unified=3", ...diffArgs], { cwd }),
    execa("git", ["diff", "--cached", "--numstat", ...diffArgs], { cwd }),
  ]);

  return buildContext({
    config,
    branch,
    files,
    includedFiles,
    skippedFiles,
    rawDiff: rawDiffResult.stdout.trim(),
    numstat: numstatResult.stdout,
  });
};

export const collectRangeDiffContext = async (
  config: CometConfig,
  baseRef: string,
  headRef = "HEAD",
  cwd = process.cwd()
): Promise<GitDiffContext> => {
  const [branchResult, filesResult] = await Promise.all([
    getCurrentBranch(cwd),
    execa("git", ["diff", "--name-only", `${baseRef}..${headRef}`], { cwd }),
  ]);

  const files = filesResult.stdout
    .split("\n")
    .map((value) => value.trim())
    .filter(Boolean);

  const { includedFiles, skippedFiles } = filterFiles(files, config.excludeFiles);
  const diffArgs = buildDiffArgs(includedFiles);

  const [rawDiffResult, numstatResult] = await Promise.all([
    execa("git", ["diff", `${baseRef}..${headRef}`, "--no-ext-diff", "--unified=3", ...diffArgs], {
      cwd,
    }),
    execa("git", ["diff", `${baseRef}..${headRef}`, "--numstat", ...diffArgs], { cwd }),
  ]);

  return buildContext({
    config,
    branch: branchResult,
    files,
    includedFiles,
    skippedFiles,
    rawDiff: rawDiffResult.stdout.trim(),
    numstat: numstatResult.stdout,
  });
};
