import type { CommitAnalysis, CometConfig, GitDiffContext } from "../domain/models.js";
import { buildConventionalCommitInstructions } from "./modules/conventional-commit.js";

const estimateCharBudget = (maxTokens: number): number => Math.max(maxTokens * 4, 2000);

export const truncateDiffToBudget = (diff: string, maxTokens: number): { diff: string; truncated: boolean } => {
  const maxChars = estimateCharBudget(maxTokens);
  if (diff.length <= maxChars) {
    return {
      diff,
      truncated: false,
    };
  }

  return {
    diff: `${diff.slice(0, maxChars)}\n\n[TRUNCATED_FOR_TOKEN_LIMIT]`,
    truncated: true,
  };
};

export const createPrompt = (
  config: CometConfig,
  context: GitDiffContext,
  analysis: CommitAnalysis
): { prompt: string; payload: string; truncated: boolean } => {
  const instructions = buildConventionalCommitInstructions(config.policyAllowedTypes);
  const privacyPayload =
    config.privacyMode === "strict"
      ? [
          "Files:",
          ...context.includedFiles.map((file) => `- ${file}`),
          "",
          "Summary:",
          analysis.summary,
          "",
          "Semantic diff:",
          context.semanticDiff,
        ].join("\n")
      : context.semanticDiff || context.safeDiff;
  const diffBudget = truncateDiffToBudget(privacyPayload, config.maxInputTokens);

  const payload = [
    `Language: ${config.language}`,
    `Allowed types: ${analysis.allowedTypes.join(", ")}`,
    `Candidate type: ${analysis.candidateType}`,
    `Candidate scope: ${analysis.candidateScope ?? "none"}`,
    `Changed areas: ${analysis.changedAreas.join(", ") || "unknown"}`,
    `Diff summary: ${analysis.summary}`,
    `Issue key: ${analysis.issueKey ?? "none"}`,
    `Confidence: ${analysis.confidence}`,
    `Rationale: ${analysis.rationale.join(" | ") || "none"}`,
    `Redactions: ${context.redactionReport.totalMatches}`,
    `Skipped files: ${context.skippedFiles.length || 0}`,
    "",
    "Semantic diff:",
    diffBudget.diff,
  ].join("\n");

  return {
    prompt: instructions,
    payload,
    truncated: diffBudget.truncated,
  };
};
