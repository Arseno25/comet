import boxen from "boxen";
import type { GeneratedCommitBundle } from "../core/generate-commit.js";
import { COMET_PANEL_STYLES, COMET_COLORS } from "./animations.js";

const renderPanel = (
  title: string,
  borderColor: "blue" | "cyan" | "magenta" | "yellow" | "red" | "green",
  lines: string[]
): string =>
  boxen(lines.join("\n"), {
    borderStyle: "round",
    borderColor,
    padding: 1,
    title: ` ${COMET_COLORS.accent("✦")} ${title} `,
    titleAlignment: "left",
  });

const formatStats = (bundle: GeneratedCommitBundle): string =>
  [
    `${COMET_COLORS.muted("branch")} ${bundle.context.branch}`,
    `${COMET_COLORS.muted("files")} ${bundle.context.stats.filesChanged}`,
    `${COMET_COLORS.muted("ins")} ${bundle.context.stats.insertions}`,
    `${COMET_COLORS.muted("del")} ${bundle.context.stats.deletions}`,
  ].join("  ");

export const renderCommitPreview = (bundle: GeneratedCommitBundle): string => {
  const { config } = bundle;
  const panels: string[] = [];

  const previewLines = [
    COMET_COLORS.bold(bundle.formattedMessage),
    "",
    formatStats(bundle),
  ];

  panels.push(renderPanel("Commit Preview", "cyan", previewLines));

  if (config.showSafeSend) {
    const sendPreviewLines = [
      `${COMET_COLORS.accent("Included")} ${bundle.context.includedFiles.length}`,
      `${COMET_COLORS.accent("Skipped")} ${bundle.context.skippedFiles.length}`,
      `${COMET_COLORS.accent("Redactions")} ${bundle.context.redactionReport.totalMatches}`,
      "",
      ...bundle.context.includedFiles.slice(0, 8).map((file) => `  ${COMET_COLORS.muted("◇")} ${file}`),
    ];

    if (bundle.context.skippedFiles.length > 0) {
      sendPreviewLines.push("", COMET_COLORS.warning("Skipped from AI payload"));
      sendPreviewLines.push(...bundle.context.skippedFiles.slice(0, 8).map((file) => `  ${COMET_COLORS.muted("◇")} ${file}`));
    }

    panels.push(renderPanel(COMET_PANEL_STYLES.safeSend.title, COMET_PANEL_STYLES.safeSend.border, sendPreviewLines));
  }

  if (config.showAnalysis) {
    const analysisLines = [
      `${COMET_COLORS.secondary("Type")} ${COMET_COLORS.bold(bundle.analysis.candidateType)}`,
      `${COMET_COLORS.secondary("Scope")} ${COMET_COLORS.bold(bundle.analysis.candidateScope ?? "none")}`,
      `${COMET_COLORS.secondary("Confidence")} ${COMET_COLORS.bold(bundle.analysis.confidence)}`,
      "",
      `${COMET_COLORS.dim(bundle.analysis.summary)}`,
    ];

    panels.push(renderPanel(COMET_PANEL_STYLES.analysis.title, COMET_PANEL_STYLES.analysis.border, analysisLines));
  }

  if (config.showQuality) {
    const qualityLines = [
      `${COMET_COLORS.accent("Score")} ${COMET_COLORS.bold(`${bundle.review.score}/100`)}`,
      `${COMET_COLORS.accent("Confidence")} ${COMET_COLORS.bold(bundle.review.confidence)}`,
      "",
      ...(bundle.review.suggestions.length > 0
        ? bundle.review.suggestions.slice(0, 5).map((s) => `  ${COMET_COLORS.success("✦")} ${s}`)
        : [`  ${COMET_COLORS.muted("◇ no issues")}`]),
    ];

    panels.push(renderPanel(COMET_PANEL_STYLES.quality.title, COMET_PANEL_STYLES.quality.border, qualityLines));
  }

  if (config.showWarnings && bundle.warnings.length > 0) {
    const warningLines = bundle.warnings.map((item) => `  ${COMET_COLORS.warning("◇")} ${item}`);
    panels.push(renderPanel(COMET_PANEL_STYLES.warning.title, COMET_PANEL_STYLES.warning.border, warningLines));
  }

  return panels.join("\n");
};

export const renderConfigPanel = (title: string, lines: string[]): string =>
  renderPanel(title, "blue", lines);
