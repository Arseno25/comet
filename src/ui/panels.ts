import boxen from "boxen";
import color from "yoctocolors";
import type { GitDiffContext } from "../domain/models.js";

const formatStats = (context: GitDiffContext): string =>
  [
    `${color.cyan("Branch")} ${context.branch}`,
    `${color.cyan("Files")} ${context.stats.filesChanged}`,
    `${color.cyan("Insertions")} ${context.stats.insertions}`,
    `${color.cyan("Deletions")} ${context.stats.deletions}`,
  ].join("  ");

export const renderCommitPreview = (message: string, context: GitDiffContext): string => {
  const skipped =
    context.skippedFiles.length > 0
      ? `\n\n${color.yellow("Skipped")}\n${context.skippedFiles.map((file) => `- ${file}`).join("\n")}`
      : "";

  return boxen(
    [
      color.bold("Comet generated this commit message"),
      "",
      message,
      "",
      formatStats(context),
      skipped,
    ].join("\n"),
    {
      borderStyle: "round",
      borderColor: "cyan",
      padding: 1,
      title: " Comet Preview ",
      titleAlignment: "center",
    }
  );
};

export const renderConfigPanel = (title: string, lines: string[]): string =>
  boxen(lines.join("\n"), {
    borderStyle: "round",
    borderColor: "blue",
    padding: 1,
    title: ` ${title} `,
    titleAlignment: "center",
  });
