import { execa } from "execa";

export const pushGitCommit = async (cwd = process.cwd()): Promise<void> => {
  await execa("git", ["push"], { cwd });
};
