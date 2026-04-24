import type { CommitAnalysis, CommitIntent, CometConfig, GitDiffContext, RepoMemoryInsights } from "../domain/models.js";
import { buildConventionalCommitInstructions } from "./modules/conventional-commit.js";

export interface PromptBuildOptions {
  regenerationAttempt?: number;
  previousMessage?: string | null;
  intent?: CommitIntent;
  repoMemory?: RepoMemoryInsights;
}

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
  analysis: CommitAnalysis,
  options: PromptBuildOptions = {}
): { prompt: string; payload: string; truncated: boolean } => {
  const instructions = buildConventionalCommitInstructions(config.policyAllowedTypes);
  const regenerationAttempt = options.regenerationAttempt ?? 0;
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
  const repoMemory = options.repoMemory;
  const repoMemoryLines =
    repoMemory &&
    (repoMemory.preferredTypes.length > 0 ||
      repoMemory.preferredScopes.length > 0 ||
      repoMemory.recentIntents.length > 0)
      ? [
          "Repo memory:",
          `Preferred types: ${
            repoMemory.preferredTypes.length > 0
              ? repoMemory.preferredTypes.map((entry) => `${entry.type}(${entry.count})`).join(", ")
              : "none"
          }`,
          `Preferred scopes: ${
            repoMemory.preferredScopes.length > 0
              ? repoMemory.preferredScopes.map((entry) => `${entry.scope}(${entry.count})`).join(", ")
              : "none"
          }`,
          `Recent intents: ${repoMemory.recentIntents.join(" | ") || "none"}`,
          "",
        ]
      : [];

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
    `Working intent: ${options.intent?.value ?? analysis.summary}`,
    `Intent source: ${options.intent?.source ?? "analysis"}`,
    `Redactions: ${context.redactionReport.totalMatches}`,
    `Skipped files: ${context.skippedFiles.length || 0}`,
    `Generation attempt: ${regenerationAttempt + 1}`,
    "",
    ...repoMemoryLines,
    ...(regenerationAttempt > 0
      ? [
          "Regeneration request:",
          "Generate a materially different commit message from the previous attempt.",
          `Previous message: ${options.previousMessage ?? "none"}`,
          "",
        ]
      : []),
    "Commit consistency requirements:",
    ...(options.intent?.source === "explicit"
      ? ["- Respect the explicit user intent unless the staged diff clearly contradicts it."]
      : []),
    "- Prefer a specific subsystem or behavior over generic wording.",
    "- Keep the subject short and production-ready.",
    "- Use body lines only for meaningful supporting detail.",
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
