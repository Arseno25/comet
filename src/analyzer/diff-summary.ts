import type { CommitAnalysis, CometConfig, GitDiffContext } from "../domain/models.js";
import { detectScope } from "./scope-detector.js";
import { classifyCommitType } from "./type-classifier.js";

const humanizePath = (value: string): string =>
  value.replace(/^src\//, "").replace(/\.[a-z0-9]+$/i, "").replace(/\//g, ".");

const summarizeSemanticGroups = (context: GitDiffContext): string[] => {
  const groups = new Set<string>();

  for (const change of context.semanticChanges) {
    groups.add(change.changeType);
  }

  return [...groups];
};

const buildSummary = (context: GitDiffContext): string => {
  const topFiles = context.includedFiles.slice(0, 4).map(humanizePath);
  const groups = summarizeSemanticGroups(context);

  if (topFiles.length === 0) {
    return "Changes were detected in staged files.";
  }

  if (groups.length === 1) {
    return `Changes mostly affect ${topFiles.join(", ")} with ${groups[0]} edits.`;
  }

  return `Changes touch ${topFiles.join(", ")} across ${groups.join(", ")} updates.`;
};

const buildRationale = (
  context: GitDiffContext,
  candidateType: CommitAnalysis["candidateType"],
  scope: string | null
): string[] => {
  const reasons = [
    `Type candidate "${candidateType}" was inferred from staged files and semantic change patterns.`,
  ];

  if (scope) {
    reasons.push(`Scope "${scope}" was selected from the dominant file paths.`);
  }

  if (context.issueKey) {
    reasons.push(`Issue key "${context.issueKey}" was extracted from the branch name.`);
  }

  if (context.redactionReport.totalMatches > 0) {
    reasons.push(
      `Sensitive values were redacted ${context.redactionReport.totalMatches} time(s) before analysis.`
    );
  }

  return reasons;
};

const detectConfidence = (context: GitDiffContext, changedAreas: string[]): CommitAnalysis["confidence"] => {
  if (changedAreas.length <= 1 && context.semanticChanges.length <= 4) {
    return "high";
  }

  if (changedAreas.length <= 3 && context.stats.filesChanged <= 8) {
    return "medium";
  }

  return "low";
};

export const createCommitAnalysis = (
  context: GitDiffContext,
  config: CometConfig
): CommitAnalysis => {
  const allowedTypes = config.policyAllowedTypes;
  const candidateType = classifyCommitType(
    context.includedFiles,
    context.semanticDiff || context.safeDiff || context.rawDiff,
    context.semanticChanges,
    allowedTypes
  );
  const scopeInfo = detectScope(context.includedFiles, config.policyScopeMap);
  const summary = buildSummary(context);
  const confidence = detectConfidence(context, scopeInfo.changedAreas);

  return {
    candidateType,
    allowedTypes,
    candidateScope: scopeInfo.scope,
    changedAreas: scopeInfo.changedAreas,
    summary,
    rationale: buildRationale(context, candidateType, scopeInfo.scope),
    confidence,
    issueKey: context.issueKey,
  };
};
