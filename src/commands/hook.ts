import type { Command } from "commander";
import { getHookStatus, installHook, runPrepareCommitHook, uninstallHook } from "../git/hooks.js";

export const registerHookCommand = (program: Command): void => {
  const hookCommand = program.command("hook").description("Install or manage repository hooks");

  hookCommand
    .command("install")
    .description("Install the prepare-commit-msg hook in the current repository")
    .action(async () => {
      const hookPath = await installHook();
      console.log(`Installed hook at ${hookPath}`);
    });

  hookCommand
    .command("uninstall")
    .description("Remove the prepare-commit-msg hook from the current repository")
    .action(async () => {
      const hookPath = await uninstallHook();
      console.log(`Removed hook at ${hookPath}`);
    });

  hookCommand
    .command("status")
    .description("Show prepare-commit-msg hook status")
    .action(async () => {
      const status = await getHookStatus();
      console.log(`${status.installed ? "installed" : "missing"} ${status.hookPath}`);
    });

  hookCommand
    .command("run")
    .description("Internal command for prepare-commit-msg hook")
    .requiredOption("--hook-file <path>", "Path to commit message file")
    .option("--hook-source <source>", "Git hook source")
    .option("--commit-sha <sha>", "Commit sha")
    .action(async (options: { hookFile: string; hookSource?: string }) => {
      await runPrepareCommitHook(options.hookFile, options.hookSource);
    });
};
