import { describe, expect, it } from "vitest";
import { defaultConfig } from "../src/config/default.js";
import type { CommitAnalysis, GitDiffContext, RepoMemoryInsights } from "../src/domain/models.js";
import { createPrompt } from "../src/prompt/builder.js";

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

const analysis: CommitAnalysis = {
  candidateType: "fix",
  allowedTypes: ["feat", "fix", "refactor"],
  candidateScope: "auth",
  changedAreas: ["auth"],
  summary: "Changes mostly affect auth.session with behavioral edits.",
  rationale: ['Type candidate "fix" was inferred from staged files and semantic change patterns.'],
  confidence: "high",
  issueKey: "COMET-42",
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

describe("createPrompt", () => {
  it("adds explicit regeneration instructions for a new alternative", () => {
    const prompt = createPrompt(defaultConfig, context, analysis, {
      regenerationAttempt: 1,
      previousMessage: "fix(auth): tighten session validation",
    });

    expect(prompt.prompt).toContain("production-grade Conventional Commit metadata");
    expect(prompt.payload).toContain("Regeneration request:");
    expect(prompt.payload).toContain("Previous message: fix(auth): tighten session validation");
    expect(prompt.payload).toContain("Generation attempt: 2");
  });

  it("includes explicit intent and repo memory hints", () => {
    const prompt = createPrompt(defaultConfig, context, analysis, {
      intent: {
        value: "stabilize auth session flow",
        source: "explicit",
      },
      repoMemory,
    });

    expect(prompt.payload).toContain("Working intent: stabilize auth session flow");
    expect(prompt.payload).toContain("Intent source: explicit");
    expect(prompt.payload).toContain("Repo memory:");
    expect(prompt.payload).toContain("Preferred scopes: auth(3)");
  });
});
