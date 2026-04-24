import type { Command } from "commander";
import { runCommitFlow } from "../core/run-commit-flow.js";
import { addRuntimeOptions, collectRuntimeOverrides } from "./shared.js";

export const registerPreviewCommand = (program: Command): void => {
  const command = addRuntimeOptions(
    program.command("preview").description("Preview the generated commit message without committing")
  );

  command.action(async () => {
    const overrides = collectRuntimeOverrides(command);
    await runCommitFlow({
      ...overrides,
      previewOnly: true,
    });
  });
};
