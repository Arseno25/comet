import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { Command } from "commander";
import { registerAnalyzeCommand } from "./commands/analyze.js";
import { registerChangelogCommand } from "./commands/changelog.js";
import { registerCommitCommand } from "./commands/commit.js";
import { registerConfigCommand } from "./commands/config.js";
import { registerDoctorCommand } from "./commands/doctor.js";
import { registerHookCommand } from "./commands/hook.js";
import { registerInitCommand } from "./commands/init.js";
import { registerPreviewCommand } from "./commands/preview.js";
import { registerReleaseNotesCommand } from "./commands/release-notes.js";
import { registerReviewCommand } from "./commands/review.js";
import { registerSquashCommand } from "./commands/squash.js";
import { addRuntimeOptions, collectRuntimeOverrides } from "./commands/shared.js";
import { runCommitFlow } from "./core/run-commit-flow.js";
import { logger } from "./ui/logger.js";
import { cometIntro } from "./ui/animations.js";

const subcommandNames = new Set([
  "commit",
  "preview",
  "analyze",
  "review",
  "squash",
  "config",
  "doctor",
  "init",
  "hook",
  "changelog",
  "release-notes",
]);
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

const readPackageVersion = (): string => {
  try {
    const packageJsonPath = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      "..",
      "package.json"
    );
    const parsed = JSON.parse(readFileSync(packageJsonPath, "utf8")) as { version?: string };
    return parsed.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
};

const createProgram = (): Command => {
  const program = new Command();

  program
    .name("comet")
    .description("Comet — Clean commit messages at the speed of light.")
    .version(readPackageVersion());

  addRuntimeOptions(program);

  registerCommitCommand(program);
  registerPreviewCommand(program);
  registerAnalyzeCommand(program);
  registerReviewCommand(program);
  registerSquashCommand(program);
  registerConfigCommand(program);
  registerDoctorCommand(program);
  registerInitCommand(program);
  registerHookCommand(program);
  registerChangelogCommand(program);
  registerReleaseNotesCommand(program);

  return program;
};

const main = async (): Promise<void> => {
  try {
    const argv = process.argv.slice(2);
    const useDefaultCommitFlow = !hasExplicitSubcommand(argv) && !hasBuiltInMetaFlag(argv);

    if (useDefaultCommitFlow) {
      const runtimeProgram = createRuntimeOptionProgram();
      runtimeProgram.parseOptions(argv);
      cometIntro();
      const overrides = collectRuntimeOverrides(runtimeProgram);
      await runCommitFlow({
        ...overrides,
        previewOnly: overrides.previewOnly ?? false,
      });
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
