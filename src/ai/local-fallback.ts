import type { CommitAnalysis, GitDiffContext, GeneratedCommit } from "../domain/models.js";

const createSubject = (analysis: CommitAnalysis): string => {
  const area = analysis.candidateScope ?? analysis.changedAreas[0] ?? "project";

  switch (analysis.candidateType) {
    case "feat":
      return `add ${area} updates`;
    case "fix":
      return `fix ${area} issues`;
    case "docs":
      return `update ${area} documentation`;
    case "test":
      return `cover ${area} changes`;
    case "build":
      return `update ${area} build setup`;
    case "ci":
      return `adjust ${area} workflow`;
    case "refactor":
      return `refactor ${area} structure`;
    case "perf":
      return `improve ${area} performance`;
    default:
      return `update ${area} changes`;
  }
};

export const createLocalFallbackCommit = (
  analysis: CommitAnalysis,
  context: GitDiffContext
): GeneratedCommit => ({
  type: analysis.candidateType,
  scope: analysis.candidateScope,
  subject: createSubject(analysis),
  body: context.files.slice(0, 3).map((file) => `touch ${file}`),
  breaking: false,
  breakingDescription: null,
  why: analysis.rationale[0] ?? null,
  issueKey: analysis.issueKey,
});
