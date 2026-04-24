import { execa } from "execa";

export const isGitRepository = async (cwd = process.cwd()): Promise<boolean> => {
  const result = await execa("git", ["rev-parse", "--is-inside-work-tree"], {
    cwd,
    reject: false,
  });

  return result.exitCode === 0 && result.stdout.trim() === "true";
};

export const getCurrentBranch = async (cwd = process.cwd()): Promise<string> => {
  const result = await execa("git", ["branch", "--show-current"], { cwd });
  return result.stdout.trim() || "HEAD";
};

export const getStagedFiles = async (cwd = process.cwd()): Promise<string[]> => {
  const result = await execa("git", ["diff", "--cached", "--name-only", "--diff-filter=ACMRTUXB"], {
    cwd,
  });

  return result.stdout
    .split("\n")
    .map((value) => value.trim())
    .filter(Boolean);
};

export const stageAllChanges = async (cwd = process.cwd()): Promise<void> => {
  await execa("git", ["add", "-A"], { cwd });
};

export const getGitDirectory = async (cwd = process.cwd()): Promise<string> => {
  const result = await execa("git", ["rev-parse", "--git-dir"], { cwd });
  return result.stdout.trim();
};
