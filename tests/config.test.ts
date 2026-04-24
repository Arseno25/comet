import { describe, expect, it } from "vitest";
import { parseScalarValue, resolveConfigKeyName } from "../src/config/parser.js";

describe("config parser", () => {
  it("resolves config keys from friendly names", () => {
    expect(resolveConfigKeyName("base-url")).toBe("baseUrl");
    expect(resolveConfigKeyName("COMET_MODEL")).toBe("model");
  });

  it("parses booleans and json values", () => {
    expect(parseScalarValue("emoji", "true")).toBe(true);
    expect(parseScalarValue("customHeaders", "{\"x-test\":\"1\"}")).toEqual({
      "x-test": "1",
    });
  });
});
