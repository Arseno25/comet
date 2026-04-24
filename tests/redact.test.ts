import { describe, expect, it } from "vitest";
import { redactSecrets } from "../src/security/redact.js";

describe("redactSecrets", () => {
  it("redacts database urls and api keys", () => {
    const input = [
      "OPENAI_API_KEY=sk_1234567890abcdef",
      "DATABASE_URL=mysql://root:password@localhost:3306/app",
    ].join("\n");

    const result = redactSecrets(input);

    expect(result).toContain("[REDACTED_SECRET]");
    expect(result).toContain("[REDACTED_DATABASE_URL]");
  });
});
