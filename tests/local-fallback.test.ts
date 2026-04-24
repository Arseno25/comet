import { describe, expect, it } from "vitest";
import { hasGenericSubject } from "../src/analyzer/quality-review.js";
import { createLocalFallbackCommit } from "../src/ai/local-fallback.js";
import type { CommitAnalysis, GitDiffContext } from "../src/domain/models.js";

const analysis: CommitAnalysis = {
  candidateType: "fix",
  allowedTypes: ["fix", "feat", "refactor"],
  candidateScope: "auth/session",
  changedAreas: ["auth/session"],
  summary: "Changes mostly affect auth.session with behavioral edits.",
  rationale: ['Type candidate "fix" was inferred from staged files and semantic change patterns.'],
  confidence: "high",
  issueKey: "COMET-42",
};

const context: GitDiffContext = {
  branch: "fix/auth-session",
  issueKey: "COMET-42",
  files: ["src/auth/session.ts"],
  includedFiles: ["src/auth/session.ts"],
  stats: {
    filesChanged: 1,
    insertions: 8,
    deletions: 2,
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
      additions: 8,
      deletions: 2,
      summaryLines: ["validate session state"],
    },
  ],
};

describe("createLocalFallbackCommit", () => {
  it("generates non-generic alternatives across regeneration attempts", () => {
    const first = createLocalFallbackCommit(analysis, context, 0);
    const second = createLocalFallbackCommit(analysis, context, 1);

    expect(first.subject).not.toBe(second.subject);
    expect(hasGenericSubject(first.subject)).toBe(false);
    expect(hasGenericSubject(second.subject)).toBe(false);
    expect(first.body).not.toContain("touch src/auth/session.ts");
  });
});
