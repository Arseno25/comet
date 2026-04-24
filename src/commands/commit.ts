import type { Command } from "commander";
import { runCommitFlow } from "../core/run-commit-flow.js";
import { addRuntimeOptions, collectRuntimeOverrides } from "./shared.js";

export const registerCommitCommand = (program: Command): void => {
  const command = addRuntimeOptions(
    program.command("commit").description("Generate and commit a message from staged changes")
  );

  command.action(async () => {
    const overrides = collectRuntimeOverrides(command);
    await runCommitFlow(overrides);
  });
};
