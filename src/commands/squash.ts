import type { Command } from "commander";
import { analyzeCommitRange } from "../core/generate-commit.js";
import { renderCommitPreview } from "../ui/panels.js";
import { printJson } from "../utils/output.js";
import { addRuntimeOptions, collectRuntimeOverrides } from "./shared.js";

export const registerSquashCommand = (program: Command): void => {
  const command = addRuntimeOptions(
    program
      .command("squash")
      .description("Generate a squash commit message from a commit range")
      .argument("<base-ref>", "Base ref to diff from")
      .argument("[head-ref]", "Head ref to diff to", "HEAD")
  );

  command.action(async (baseRef: string, headRef: string) => {
    const overrides = collectRuntimeOverrides(command);
    const bundle = await analyzeCommitRange(baseRef, headRef, overrides);

    if (overrides.json) {
      printJson(bundle);
      return;
    }

    console.log(renderCommitPreview(bundle));
  });
};
