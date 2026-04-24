import { describe, expect, it } from "vitest";
import { defaultConfig } from "../src/config/default.js";
import type { GeneratedCommitBundle } from "../src/core/generate-commit.js";
import { renderCommitPreview } from "../src/ui/panels.js";

const createBundle = (overrides: Partial<GeneratedCommitBundle> = {}): GeneratedCommitBundle => ({
  config: {
    ...defaultConfig,
    uiMode: "minimal",
  },
  context: {
    branch: "feat/auth-session",
    issueKey: "COMET-42",
    files: ["src/auth/session.ts", "docs/api.md"],
    includedFiles: ["src/auth/session.ts"],
    stats: {
      filesChanged: 2,
      insertions: 12,
      deletions: 4,
    },
    rawDiff: "",
    safeDiff: "",
    semanticDiff: "",
    skippedFiles: ["docs/api.md"],
    redactionReport: {
      changed: false,
      totalMatches: 1,
      matches: [{ label: "secret", count: 1 }],
    },
    semanticChanges: [],
  },
  analysis: {
    candidateType: "fix",
    allowedTypes: ["feat", "fix", "refactor"],
    candidateScope: "auth",
    changedAreas: ["auth", "docs"],
    summary: "Changes affect auth and docs.",
    rationale: ["Mixed areas detected."],
    confidence: "medium",
    issueKey: "COMET-42",
  },
  review: {
    score: 88,
    confidence: "medium",
    warnings: [],
    suggestions: [],
  },
  diffReview: {
    summary: "Mixed concerns were detected.",
    risks: ["Large mixed diff may reduce commit precision."],
    highlights: ["Issue key detected from branch."],
  },
  generatedCommit: {
    type: "fix",
    scope: "auth",
    subject: "tighten session validation",
    body: [],
    breaking: false,
    breakingDescription: null,
    why: null,
    issueKey: "COMET-42",
  },
  formattedMessage: "fix(auth): tighten session validation",
  promptPayload: "payload",
  truncated: false,
  source: "provider",
  warnings: [],
  intent: {
    value: "stabilize auth session flow",
    source: "analysis",
  },
  privacy: {
    mode: "standard",
    estimatedInputTokens: 320,
    estimatedOutputTokens: 512,
    includedFiles: 1,
    skippedFiles: 1,
    redactions: 1,
  },
  repoMemory: {
    preferredTypes: [{ type: "fix", count: 4 }],
    preferredScopes: [{ scope: "auth", count: 3 }],
    recentIntents: ["stabilize auth session flow"],
    lastUpdatedAt: "2026-04-24T00:00:00.000Z",
  },
  riskLevel: "medium",
  splitPlan: {
    recommended: true,
    reason: "Detected 2 distinct areas in one staged diff.",
    confidence: "medium",
    steps: [
      {
        id: "auth",
        title: "fix(auth): commit auth changes separately",
        summary: "Isolate auth work.",
        rationale: [],
        files: ["src/auth/session.ts"],
        suggestedType: "fix",
        suggestedScope: "auth",
      },
    ],
  },
  ...overrides,
});

describe("renderCommitPreview", () => {
  it("keeps minimal mode compact while still surfacing compact signals", () => {
    const preview = renderCommitPreview(createBundle());

    expect(preview).toContain("Commit Preview");
    expect(preview).toContain("confidence medium");
    expect(preview).toContain("split suggested");
    expect(preview).not.toContain("Copilot");
    expect(preview).not.toContain("Split Plan");
  });

  it("shows copilot and split panels in standard mode", () => {
    const preview = renderCommitPreview(
      createBundle({
        config: {
          ...defaultConfig,
          uiMode: "standard",
        },
      })
    );

    expect(preview).toContain("Copilot");
    expect(preview).toContain("Split Plan");
  });
});
