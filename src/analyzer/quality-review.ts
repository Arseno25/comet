import type {
  CommitAnalysis,
  CommitQualityReport,
  CometConfig,
  DiffReviewReport,
  GeneratedCommit,
  GitDiffContext,
} from "../domain/models.js";

const GENERIC_SUBJECT_PATTERN =
  /\b(update|fix|change|adjust|improve|cleanup|refactor)\b.*\b(changes|updates|stuff|things)\b/i;

export const reviewGeneratedCommit = (
  commit: GeneratedCommit,
  analysis: CommitAnalysis,
  config: CometConfig
): CommitQualityReport => {
  let score = 100;
  const warnings: string[] = [];
  const suggestions: string[] = [];

  if (commit.subject.length > 72) {
    score -= 20;
    warnings.push("Subject is longer than 72 characters.");
    suggestions.push("Shorten the subject and keep the most important verb and noun.");
  }

  if (GENERIC_SUBJECT_PATTERN.test(commit.subject)) {
    score -= 15;
    warnings.push("Subject looks generic and may not describe the real change.");
    suggestions.push("Use a more specific subject that names the feature, bug, or subsystem.");
  }

  if (commit.type !== analysis.candidateType) {
    score -= 10;
    warnings.push(`Chosen type "${commit.type}" differs from analyzed type "${analysis.candidateType}".`);
    suggestions.push("Double-check whether the commit type matches the dominant change.");
  }

  if (!config.omitScope && analysis.changedAreas.length === 1 && !commit.scope) {
    score -= 5;
    warnings.push("A single dominant area was detected, but the scope is missing.");
    suggestions.push(`Consider using scope "${analysis.changedAreas[0]}".`);
  }

  if (config.policyRequireIssueKey && !commit.issueKey && !analysis.issueKey) {
    score -= 20;
    warnings.push("Issue key is required by policy but no issue key was detected.");
    suggestions.push("Include the issue key in the branch name or generated commit metadata.");
  }

  if (!config.description && commit.body.length > 0) {
    score -= 5;
    warnings.push("Commit body was generated even though description mode is disabled.");
  }

  return {
    score: Math.max(0, score),
    confidence: analysis.confidence,
    warnings,
    suggestions,
  };
};

export const reviewDiffRisk = (
  context: GitDiffContext,
  analysis: CommitAnalysis
): DiffReviewReport => {
  const risks: string[] = [];
  const highlights: string[] = [];

  if (context.redactionReport.totalMatches > 0) {
    risks.push(
      `Sensitive values were redacted ${context.redactionReport.totalMatches} time(s) before sending the diff.`
    );
  }

  if (context.skippedFiles.length > 0) {
    highlights.push(`${context.skippedFiles.length} file(s) were excluded from the AI payload.`);
  }

  if (context.stats.filesChanged >= 12) {
    risks.push("Large staged change set may reduce commit message precision.");
  }

  if (context.semanticChanges.some((change) => change.changeType === "format-only")) {
    highlights.push("Formatting-only changes were detected and collapsed into semantic summaries.");
  }

  if (context.issueKey) {
    highlights.push(`Issue key detected from branch: ${context.issueKey}.`);
  }

  return {
    summary: analysis.summary,
    risks,
    highlights,
  };
};
