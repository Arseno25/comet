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
const helpFlags = new Set(["-h", "--help"]);
const versionFlags = new Set(["-V", "--version"]);

const hasExplicitSubcommand = (argv: string[]): boolean =>
  argv.some((token) => !token.startsWith("-") && subcommandNames.has(token));

const hasBuiltInMetaFlag = (argv: string[]): boolean =>
  argv.some((token) => helpFlags.has(token) || versionFlags.has(token));

const createRuntimeOptionProgram = (): Command => {
  const program = new Command();
  program.name("comet");
  addRuntimeOptions(program);
  return program;
};

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
    const argv = process.argv.slice(2);
    const useDefaultCommitFlow = !hasExplicitSubcommand(argv) && !hasBuiltInMetaFlag(argv);

    if (useDefaultCommitFlow) {
      const runtimeProgram = createRuntimeOptionProgram();
      runtimeProgram.parseOptions(argv);
      p.intro("Comet");
      const overrides = collectRuntimeOverrides(runtimeProgram);
      await runCommitFlow({
        ...overrides,
        previewOnly: overrides.previewOnly ?? false,
      });
      p.outro("Done.");
      return;
    }

    const program = createProgram();
    await program.parseAsync(process.argv);
  } catch (error) {
    logger.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
};

await main();
