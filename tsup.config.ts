import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/cli.ts"],
  target: "node22",
  format: ["esm"],
  clean: true,
  sourcemap: true,
  splitting: false,
  shims: false,
  banner: {
    js: "#!/usr/bin/env node",
  },
});
