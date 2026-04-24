import { describe, expect, it } from "vitest";
import { detectScope } from "../src/analyzer/scope-detector.js";
import { classifyCommitType } from "../src/analyzer/type-classifier.js";

describe("commit analyzer rules", () => {
  it("classifies docs changes", () => {
    expect(classifyCommitType(["README.md"], "update docs")).toBe("docs");
  });

  it("detects a dominant auth scope", () => {
    const result = detectScope(["src/auth/login.ts", "src/auth/session.ts"]);
    expect(result.scope).toBe("auth");
  });
});
