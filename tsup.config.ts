import { defineConfig } from "tsup";

const shared = {
  target: "node22",
  format: ["esm"] as const,
  clean: true,
  sourcemap: true,
  splitting: false,
  shims: false,
  dts: true,
};

export default defineConfig([
  {
    ...shared,
    entry: {
      cli: "src/cli.ts",
    },
    banner: {
      js: "#!/usr/bin/env node",
    },
  },
  {
    ...shared,
    clean: false,
    entry: {
      index: "src/index.ts",
    },
  },
]);
