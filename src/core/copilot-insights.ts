import type {
  CommitAnalysis,
  CommitIntent,
  DiffReviewReport,
  GitDiffContext,
  PrivacyMode,
  PrivacySummary,
  RepoMemoryInsights,
  RiskLevel,
} from "../domain/models.js";
import { estimateTokens } from "../ai/token-estimate.js";

const normalizeIntent = (value: string): string => value.replace(/\s+/g, " ").trim();

export const createCommitIntent = (
  analysis: CommitAnalysis,
  repoMemory: RepoMemoryInsights,
  explicitIntent?: string
): CommitIntent => {
  const normalizedExplicitIntent = explicitIntent ? normalizeIntent(explicitIntent) : "";
  if (normalizedExplicitIntent) {
    return {
      value: normalizedExplicitIntent,
      source: "explicit",
    };
  }

  if (analysis.confidence === "low" && repoMemory.recentIntents.length > 0) {
    return {
      value: repoMemory.recentIntents[0] ?? normalizeIntent(analysis.summary),
      source: "repo-memory",
    };
  }

  return {
    value: normalizeIntent(analysis.summary),
    source: "analysis",
  };
};

export const createPrivacySummary = ({
  promptPayload,
  privacyMode,
  maxOutputTokens,
  context,
}: {
  promptPayload: string;
  privacyMode: PrivacyMode;
  maxOutputTokens: number;
  context: GitDiffContext;
}): PrivacySummary => ({
  mode: privacyMode,
  estimatedInputTokens: privacyMode === "local-only" ? 0 : estimateTokens(promptPayload),
  estimatedOutputTokens: maxOutputTokens,
  includedFiles: context.includedFiles.length,
  skippedFiles: context.skippedFiles.length,
  redactions: context.redactionReport.totalMatches,
});

export const createRiskLevel = (
  context: GitDiffContext,
  analysis: CommitAnalysis,
  diffReview: DiffReviewReport
): RiskLevel => {
  let score = 0;

  score += diffReview.risks.length * 2;

  if (context.stats.filesChanged >= 10) {
    score += 2;
  }

  if (context.stats.deletions >= 150 || context.stats.insertions >= 250) {
    score += 1;
  }

  if (context.redactionReport.totalMatches > 0) {
    score += 2;
  }

  if (analysis.confidence === "low") {
    score += 1;
  }

  if (score >= 5) {
    return "high";
  }

  if (score >= 2) {
    return "medium";
  }

  return "low";
};
