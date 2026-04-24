import { describe, expect, it } from "vitest";
import { parseScalarValue, resolveConfigKeyName } from "../src/config/parser.js";

describe("config parser", () => {
  it("resolves config keys from friendly names", () => {
    expect(resolveConfigKeyName("base-url")).toBe("baseUrl");
    expect(resolveConfigKeyName("COMET_MODEL")).toBe("model");
    expect(resolveConfigKeyName("COMET_UI_MODE")).toBe("uiMode");
  });

  it("parses booleans and json values", () => {
    expect(parseScalarValue("emoji", "true")).toBe(true);
    expect(parseScalarValue("showCopilot", "true")).toBe(true);
    expect(parseScalarValue("customHeaders", "{\"x-test\":\"1\"}")).toEqual({
      "x-test": "1",
    });
    expect(parseScalarValue("policyAllowedTypes", "feat,fix")).toEqual(["feat", "fix"]);
    expect(parseScalarValue("policyScopeMap", "{\"src/payments\":\"billing\"}")).toEqual({
      "src/payments": "billing",
    });
  });
});
