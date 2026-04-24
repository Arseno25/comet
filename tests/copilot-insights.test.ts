import { describe, expect, it } from "vitest";
import { createCommitIntent, createPrivacySummary, createRiskLevel } from "../src/core/copilot-insights.js";
import type { CommitAnalysis, DiffReviewReport, GitDiffContext, RepoMemoryInsights } from "../src/domain/models.js";

const context: GitDiffContext = {
  branch: "feat/auth-session",
  issueKey: "COMET-42",
  files: ["src/auth/session.ts"],
  includedFiles: ["src/auth/session.ts"],
  stats: {
    filesChanged: 1,
    insertions: 12,
    deletions: 4,
  },
  rawDiff: "",
  safeDiff: "",
  semanticDiff: "- src/auth/session.ts type=behavioral +12 -4\n  • validate session tokens",
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
  ],
};

const highConfidenceAnalysis: CommitAnalysis = {
  candidateType: "fix",
  allowedTypes: ["feat", "fix", "refactor"],
  candidateScope: "auth",
  changedAreas: ["auth"],
  summary: "Changes mostly affect auth.session with behavioral edits.",
  rationale: ['Type candidate "fix" was inferred from staged files and semantic change patterns.'],
  confidence: "high",
  issueKey: "COMET-42",
};

const lowConfidenceAnalysis: CommitAnalysis = {
  ...highConfidenceAnalysis,
  confidence: "low",
};

const repoMemory: RepoMemoryInsights = {
  preferredTypes: [
    {
      type: "fix",
      count: 4,
    },
  ],
  preferredScopes: [
    {
      scope: "auth",
      count: 3,
    },
  ],
  recentIntents: ["tighten session validation before release"],
  lastUpdatedAt: "2026-04-24T00:00:00.000Z",
};

const diffReview: DiffReviewReport = {
  summary: "Auth session validation changed.",
  risks: [],
  highlights: [],
};

describe("copilot insights", () => {
  it("prefers explicit intent over inferred and memory-derived intent", () => {
    const intent = createCommitIntent(highConfidenceAnalysis, repoMemory, "stabilize auth session flow");

    expect(intent).toEqual({
      value: "stabilize auth session flow",
      source: "explicit",
    });
  });

  it("falls back to repo memory when confidence is low", () => {
    const intent = createCommitIntent(lowConfidenceAnalysis, repoMemory);

    expect(intent).toEqual({
      value: "tighten session validation before release",
      source: "repo-memory",
    });
  });

  it("reports zero input tokens in local-only mode", () => {
    const privacy = createPrivacySummary({
      promptPayload: "Semantic diff payload",
      privacyMode: "local-only",
      maxOutputTokens: 512,
      context,
    });

    expect(privacy.estimatedInputTokens).toBe(0);
    expect(privacy.estimatedOutputTokens).toBe(512);
  });

  it("keeps low risk for small focused diffs", () => {
    expect(createRiskLevel(context, highConfidenceAnalysis, diffReview)).toBe("low");
  });
});
