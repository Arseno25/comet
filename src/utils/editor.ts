import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { execa } from "execa";

const getEditorCommand = (): string =>
  process.env.COMET_EDITOR ??
  process.env.GIT_EDITOR ??
  process.env.VISUAL ??
  process.env.EDITOR ??
  (process.platform === "win32" ? "notepad" : "vi");

export const editTextInEditor = async (initialValue: string): Promise<string> => {
  const directory = await mkdtemp(path.join(tmpdir(), "comet-"));
  const filePath = path.join(directory, "COMMIT_EDITMSG");

  try {
    await writeFile(filePath, initialValue, "utf8");
    await execa(getEditorCommand(), [filePath], {
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    return (await readFile(filePath, "utf8")).trim();
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
};
