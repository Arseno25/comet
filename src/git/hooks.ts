import { chmod, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadConfig } from "../config/loader.js";
import { generateCommitBundle } from "../core/generate-commit.js";
import { getGitDirectory, isGitRepository } from "./status.js";

const hookName = "prepare-commit-msg";

const hookScript = `#!/bin/sh
if command -v comet >/dev/null 2>&1; then
  comet hook run --hook-file "$1" --hook-source "$2" --commit-sha "$3"
fi
`;

const shouldSkipHookSource = (source?: string): boolean =>
  ["merge", "squash", "commit"].includes(source ?? "");

export const installHook = async (cwd = process.cwd()): Promise<string> => {
  if (!(await isGitRepository(cwd))) {
    throw new Error("Not a Git repository. Hook installation requires a Git project.");
  }

  const gitDirectory = await getGitDirectory(cwd);
  const hookPath = path.resolve(cwd, gitDirectory, "hooks", hookName);
  await writeFile(hookPath, hookScript, "utf8");
  await chmod(hookPath, 0o755);
  return hookPath;
};

export const uninstallHook = async (cwd = process.cwd()): Promise<string> => {
  const gitDirectory = await getGitDirectory(cwd);
  const hookPath = path.resolve(cwd, gitDirectory, "hooks", hookName);
  await rm(hookPath, { force: true });
  return hookPath;
};

export const getHookStatus = async (cwd = process.cwd()): Promise<{ hookPath: string; installed: boolean }> => {
  const gitDirectory = await getGitDirectory(cwd);
  const hookPath = path.resolve(cwd, gitDirectory, "hooks", hookName);

  try {
    await readFile(hookPath, "utf8");
    return { hookPath, installed: true };
  } catch {
    return { hookPath, installed: false };
  }
};

export const runPrepareCommitHook = async (
  hookFile: string,
  hookSource?: string,
  cwd = process.cwd()
): Promise<void> => {
  if (shouldSkipHookSource(hookSource)) {
    return;
  }

  const existingMessage = await readFile(hookFile, "utf8");
  if (existingMessage.trim()) {
    return;
  }

  const config = await loadConfig({}, cwd);
  if (config.privacyMode === "local-only" || !config.apiKey) {
    return;
  }

  const bundle = await generateCommitBundle({ autoAccept: true }, cwd);
  await writeFile(hookFile, bundle.formattedMessage, "utf8");
};
