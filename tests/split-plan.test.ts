import { describe, expect, it } from "vitest";
import { createCommitAnalysis } from "../src/analyzer/diff-summary.js";
import { createSplitPlan } from "../src/analyzer/split-plan.js";
import { defaultConfig } from "../src/config/default.js";
import type { GitDiffContext } from "../src/domain/models.js";

describe("split plan", () => {
  it("recommends separate commits for multiple distinct areas", () => {
    const context: GitDiffContext = {
      branch: "feat/mixed-work",
      issueKey: null,
      files: ["src/auth/session.ts", "docs/api.md"],
      includedFiles: ["src/auth/session.ts", "docs/api.md"],
      stats: {
        filesChanged: 2,
        insertions: 20,
        deletions: 4,
      },
      rawDiff: "",
      safeDiff: "",
      semanticDiff: "",
      skippedFiles: [],
      redactionReport: {
        changed: false,
        totalMatches: 0,
        matches: [],
      },
      semanticChanges: [
        {
          file: "src/auth/session.ts",
          previousFile: null,
          changeType: "behavioral",
          additions: 12,
          deletions: 4,
          summaryLines: ["validate session tokens"],
        },
        {
          file: "docs/api.md",
          previousFile: null,
          changeType: "addition-only",
          additions: 8,
          deletions: 0,
          summaryLines: ["document auth session endpoint"],
        },
      ],
    };

    const analysis = createCommitAnalysis(context, defaultConfig);
    const plan = createSplitPlan(context, analysis, defaultConfig);

    expect(plan.recommended).toBe(true);
    expect(plan.steps).toHaveLength(2);
    expect(plan.steps.map((step) => step.suggestedScope)).toContain("auth");
    expect(plan.steps.map((step) => step.suggestedScope)).toContain("docs");
  });

  it("isolates format-only changes from behavioral edits in the same area", () => {
    const context: GitDiffContext = {
      branch: "feat/ui-cleanup",
      issueKey: null,
      files: ["src/components/Button.tsx", "src/components/Card.tsx"],
      includedFiles: ["src/components/Button.tsx", "src/components/Card.tsx"],
      stats: {
        filesChanged: 2,
        insertions: 14,
        deletions: 10,
      },
      rawDiff: "",
      safeDiff: "",
      semanticDiff: "",
      skippedFiles: [],
      redactionReport: {
        changed: false,
        totalMatches: 0,
        matches: [],
      },
      semanticChanges: [
        {
          file: "src/components/Button.tsx",
          previousFile: null,
          changeType: "behavioral",
          additions: 10,
          deletions: 4,
          summaryLines: ["add disabled state handling"],
        },
        {
          file: "src/components/Card.tsx",
          previousFile: null,
          changeType: "format-only",
          additions: 4,
          deletions: 6,
          summaryLines: ["reflow component props"],
        },
      ],
    };

    const analysis = createCommitAnalysis(context, defaultConfig);
    const plan = createSplitPlan(context, analysis, defaultConfig);

    expect(plan.recommended).toBe(true);
    expect(plan.steps).toHaveLength(2);
    expect(plan.steps.some((step) => step.id.includes("format"))).toBe(true);
    expect(plan.steps.some((step) => step.suggestedType === "style")).toBe(true);
  });

  it("keeps uncovered staged files in the split plan", () => {
    const context: GitDiffContext = {
      branch: "feat/mixed-work",
      issueKey: null,
      files: ["src/auth/session.ts", "package-lock.json"],
      includedFiles: ["src/auth/session.ts"],
      stats: {
        filesChanged: 2,
        insertions: 10,
        deletions: 2,
      },
      rawDiff: "",
      safeDiff: "",
      semanticDiff: "",
      skippedFiles: ["package-lock.json"],
      redactionReport: {
        changed: false,
        totalMatches: 0,
        matches: [],
      },
      semanticChanges: [
        {
          file: "src/auth/session.ts",
          previousFile: null,
          changeType: "behavioral",
          additions: 10,
          deletions: 2,
          summaryLines: ["tighten auth validation"],
        },
      ],
    };

    const analysis = createCommitAnalysis(context, defaultConfig);
    const plan = createSplitPlan(context, analysis, defaultConfig);

    expect(plan.steps.some((step) => step.files.includes("package-lock.json"))).toBe(true);
  });
});
