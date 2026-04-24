import { describe, expect, it } from "vitest";
import { parseSemanticDiff } from "../src/git/semantic-diff.js";

describe("semantic diff parsing", () => {
  it("marks whitespace-only replacements as format-only", () => {
    const diff = [
      "diff --git a/src/app.ts b/src/app.ts",
      "--- a/src/app.ts",
      "+++ b/src/app.ts",
      "@@ -1,2 +1,2 @@",
      "-const value = { foo: true };",
      "+const value={foo:true};",
    ].join("\n");

    const [change] = parseSemanticDiff(diff);
    expect(change?.changeType).toBe("format-only");
  });

  it("marks rename-only changes", () => {
    const diff = [
      "diff --git a/src/old.ts b/src/new.ts",
      "similarity index 100%",
      "rename from src/old.ts",
      "rename to src/new.ts",
    ].join("\n");

    const [change] = parseSemanticDiff(diff);
    expect(change?.changeType).toBe("rename-only");
    expect(change?.file).toBe("src/new.ts");
  });
});
