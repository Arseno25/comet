import boxen from "boxen";
import color from "yoctocolors";
import type { GeneratedCommitBundle } from "../core/generate-commit.js";

const renderPanel = (
  title: string,
  borderColor: "blue" | "cyan" | "magenta" | "yellow" | "red",
  lines: string[]
): string =>
  boxen(lines.join("\n"), {
    borderStyle: "round",
    borderColor,
    padding: 1,
    title: ` ${title} `,
    titleAlignment: "center",
  });

const formatStats = (bundle: GeneratedCommitBundle): string =>
  [
    `${color.cyan("Branch")} ${bundle.context.branch}`,
    `${color.cyan("Files")} ${bundle.context.stats.filesChanged}`,
    `${color.cyan("Insertions")} ${bundle.context.stats.insertions}`,
    `${color.cyan("Deletions")} ${bundle.context.stats.deletions}`,
    `${color.cyan("Source")} ${bundle.source}`,
  ].join("  ");

export const renderCommitPreview = (bundle: GeneratedCommitBundle): string => {
  const previewLines = [
    color.bold("Comet generated this commit message"),
    "",
    bundle.formattedMessage,
    "",
    formatStats(bundle),
  ];

  const sendPreviewLines = [
    `${color.cyan("Included files")} ${bundle.context.includedFiles.length}`,
    `${color.cyan("Skipped files")} ${bundle.context.skippedFiles.length}`,
    `${color.cyan("Redactions")} ${bundle.context.redactionReport.totalMatches}`,
    `${color.cyan("Privacy mode")} ${bundle.config.privacyMode}`,
    "",
    ...bundle.context.includedFiles.slice(0, 8).map((file) => `- ${file}`),
  ];

  if (bundle.context.skippedFiles.length > 0) {
    sendPreviewLines.push("", color.yellow("Skipped from AI payload"));
    sendPreviewLines.push(...bundle.context.skippedFiles.slice(0, 8).map((file) => `- ${file}`));
  }

  const analysisLines = [
    `${color.cyan("Candidate type")} ${bundle.analysis.candidateType}`,
    `${color.cyan("Candidate scope")} ${bundle.analysis.candidateScope ?? "none"}`,
    `${color.cyan("Confidence")} ${bundle.analysis.confidence}`,
    `${color.cyan("Issue key")} ${bundle.analysis.issueKey ?? "none"}`,
    "",
    `${color.bold("Summary")}`,
    bundle.analysis.summary,
    "",
    `${color.bold("Rationale")}`,
    ...bundle.analysis.rationale.map((item) => `- ${item}`),
  ];

  const qualityLines = [
    `${color.cyan("Score")} ${bundle.review.score}/100`,
    `${color.cyan("Confidence")} ${bundle.review.confidence}`,
    "",
    `${color.bold("Warnings")}`,
    ...(bundle.review.warnings.length > 0 ? bundle.review.warnings.map((item) => `- ${item}`) : ["- none"]),
    "",
    `${color.bold("Suggestions")}`,
    ...(bundle.review.suggestions.length > 0
      ? bundle.review.suggestions.map((item) => `- ${item}`)
      : ["- none"]),
  ];

  const warningLines = bundle.warnings.length > 0 ? bundle.warnings.map((item) => `- ${item}`) : ["- none"];

  return [
    renderPanel("Comet Preview", "cyan", previewLines),
    renderPanel("Safe Send", "blue", sendPreviewLines),
    renderPanel("Analysis", "magenta", analysisLines),
    renderPanel("Quality", "yellow", qualityLines),
    renderPanel("Runtime Warnings", "red", warningLines),
  ].join("\n");
};

export const renderConfigPanel = (title: string, lines: string[]): string =>
  renderPanel(title, "blue", lines);
