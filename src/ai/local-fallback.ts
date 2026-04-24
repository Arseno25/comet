import type { CommitAnalysis, CommitType, GitDiffContext, GeneratedCommit } from "../domain/models.js";

const humanizeArea = (value: string): string =>
  value
    .replace(/^src\//, "")
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[._/-]+/g, " ")
    .trim();

const chooseVariant = (templates: string[], attempt: number): string =>
  templates[Math.abs(attempt) % templates.length] ?? templates[0] ?? "update project";

const subjectTemplates: Record<CommitType, string[]> = {
  feat: ["add %area% support", "introduce %area% flow", "implement %area% capability"],
  fix: ["fix %area% behavior", "resolve %area% regression", "correct %area% handling"],
  docs: ["document %area% behavior", "add %area% documentation", "clarify %area% usage"],
  style: ["format %area% sources", "normalize %area% formatting", "clean up %area% styling"],
  refactor: ["refactor %area% internals", "restructure %area% logic", "simplify %area% implementation"],
  perf: ["optimize %area% performance", "reduce %area% overhead", "speed up %area% execution"],
  test: ["add coverage for %area%", "strengthen %area% tests", "verify %area% behavior"],
  build: ["configure %area% build pipeline", "stabilize %area% build setup", "update %area% build config"],
  ci: ["update %area% ci workflow", "stabilize %area% pipeline", "configure %area% automation"],
  chore: ["maintain %area% tooling", "align %area% project setup", "update %area% maintenance tasks"],
  revert: ["revert %area% changes", "roll back %area% update", "restore previous %area% behavior"],
};

const createSubject = (analysis: CommitAnalysis, attempt: number): string => {
  const area = humanizeArea(analysis.candidateScope ?? analysis.changedAreas[0] ?? "project");
  return chooseVariant(subjectTemplates[analysis.candidateType], attempt).replace("%area%", area);
};

const summarizeChange = (context: GitDiffContext): string[] =>
  context.semanticChanges.slice(0, 3).map((change) => {
    const file = change.file.replace(/^src\//, "");

    switch (change.changeType) {
      case "rename-only":
        return `rename ${change.previousFile ?? file} to ${file}`;
      case "format-only":
        return `reformat ${file}`;
      case "addition-only":
        return `add new logic in ${file}`;
      case "deletion-only":
        return `remove outdated logic from ${file}`;
      default:
        return `update ${file}`;
    }
  });

export const createLocalFallbackCommit = (
  analysis: CommitAnalysis,
  context: GitDiffContext,
  attempt = 0
): GeneratedCommit => ({
  type: analysis.candidateType,
  scope: analysis.candidateScope,
  subject: createSubject(analysis, attempt),
  body: summarizeChange(context),
  breaking: false,
  breakingDescription: null,
  why: analysis.rationale[0] ?? null,
  issueKey: analysis.issueKey,
});
