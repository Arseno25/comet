import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { execa } from "execa";

const SAFE_COMMAND = /^[\w.\-+/\\: ]+$/;

const getEditorCommand = (): string => {
  const candidate =
    process.env.COMET_EDITOR ??
    process.env.GIT_EDITOR ??
    process.env.VISUAL ??
    process.env.EDITOR ??
    (process.platform === "win32" ? "notepad" : "vi");

  if (!SAFE_COMMAND.test(candidate)) {
    throw new Error(
      `Refusing to launch editor: command "${candidate}" contains unsafe characters. ` +
        "Set COMET_EDITOR, GIT_EDITOR, VISUAL, or EDITOR to a plain path."
    );
  }

  return candidate;
};

export const editTextInEditor = async (initialValue: string): Promise<string> => {
  const directory = await mkdtemp(path.join(tmpdir(), "comet-"));
  const filePath = path.join(directory, "COMMIT_EDITMSG");

  try {
    await writeFile(filePath, initialValue, "utf8");
    const command = getEditorCommand();
    const parts = command.split(/\s+/).filter(Boolean);
    const [binary, ...extraArgs] = parts;
    if (!binary) {
      throw new Error("No editor command configured.");
    }
    await execa(binary, [...extraArgs, filePath], { stdio: "inherit" });
    return (await readFile(filePath, "utf8")).trim();
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
};
