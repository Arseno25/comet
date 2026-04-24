import { execa } from "execa";

export const createGitCommit = async (message: string, cwd = process.cwd()): Promise<void> => {
  await execa("git", ["commit", "-F", "-"], {
    cwd,
    input: message,
    stdio: ["pipe", "pipe", "pipe"],
  });
};
