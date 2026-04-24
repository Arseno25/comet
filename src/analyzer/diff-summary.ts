import type { CommitAnalysis, GitDiffContext } from "../domain/models.js";
import { classifyCommitType } from "./type-classifier.js";
import { detectScope } from "./scope-detector.js";

const humanizePath = (value: string): string => value.replace(/^src\//, "").replace(/\.[a-z0-9]+$/i, "");

export const createCommitAnalysis = (context: GitDiffContext): CommitAnalysis => {
  const candidateType = classifyCommitType(context.files, context.safeDiff || context.rawDiff);
  const scopeInfo = detectScope(context.files);

  const summaryParts = context.files.slice(0, 4).map(humanizePath);
  const summary = summaryParts.length
    ? `Changes touch ${summaryParts.join(", ")}.`
    : "Changes were detected in staged files.";

  return {
    candidateType,
    candidateScope: scopeInfo.scope,
    changedAreas: scopeInfo.changedAreas,
    summary,
  };
};
