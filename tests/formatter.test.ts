import { describe, expect, it } from "vitest";
import { defaultConfig } from "../src/config/default.js";
import { formatCommitMessage } from "../src/formatter/commit-formatter.js";

describe("formatCommitMessage", () => {
  it("formats a conventional commit with body and breaking change", () => {
    const message = formatCommitMessage(
      {
        type: "feat",
        scope: "auth",
        subject: "change session validation flow",
        body: ["validate user role metadata"],
        breaking: true,
        breakingDescription: "session tokens must include role metadata",
        why: null,
        issueKey: null,
      },
      defaultConfig
    );

    expect(message).toContain("feat(auth)!");
    expect(message).toContain("- validate user role metadata");
    expect(message).toContain("BREAKING CHANGE:");
  });

  it("appends issue keys when policy requires them", () => {
    const message = formatCommitMessage(
      {
        type: "feat",
        scope: "auth",
        subject: "add session validation",
        body: [],
        breaking: false,
        breakingDescription: null,
        why: null,
        issueKey: "COMET-42",
      },
      {
        ...defaultConfig,
        policyRequireIssueKey: true,
      }
    );

    expect(message).toContain("[COMET-42]");
  });
});
