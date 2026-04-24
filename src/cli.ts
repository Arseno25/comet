import * as p from "@clack/prompts";
import { Command } from "commander";
import { registerCommitCommand } from "./commands/commit.js";
import { registerConfigCommand } from "./commands/config.js";
import { registerDoctorCommand } from "./commands/doctor.js";
import { registerHookCommand } from "./commands/hook.js";
import { registerInitCommand } from "./commands/init.js";
import { registerPreviewCommand } from "./commands/preview.js";
import { addRuntimeOptions, collectRuntimeOverrides } from "./commands/shared.js";
import { runCommitFlow } from "./core/run-commit-flow.js";
import { logger } from "./ui/logger.js";

const subcommandNames = new Set(["commit", "preview", "config", "doctor", "init", "hook"]);

const hasExplicitSubcommand = (argv: string[]): boolean =>
  argv.some((token) => !token.startsWith("-") && subcommandNames.has(token));

const createProgram = (): Command => {
  const program = new Command();

  program
    .name("comet")
    .description("Comet — Clean commit messages at the speed of thought.")
    .version("0.1.0");

  addRuntimeOptions(program);

  registerCommitCommand(program);
  registerPreviewCommand(program);
  registerConfigCommand(program);
  registerDoctorCommand(program);
  registerInitCommand(program);
  registerHookCommand(program);

  return program;
};

const main = async (): Promise<void> => {
  try {
    const program = createProgram();
    const argv = process.argv.slice(2);
    await program.parseAsync(process.argv);

    if (!hasExplicitSubcommand(argv)) {
      p.intro("Comet");
      const overrides = collectRuntimeOverrides(program);
      await runCommitFlow({
        ...overrides,
        previewOnly: overrides.previewOnly ?? false,
      });
      p.outro("Done.");
    }
  } catch (error) {
    logger.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
};

await main();
