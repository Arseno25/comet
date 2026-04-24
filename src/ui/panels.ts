import boxen from "boxen";
import type { GeneratedCommitBundle } from "../core/generate-commit.js";
import {
  COMET_COLORS,
  COMET_PANEL_STYLES,
  renderBullet,
  renderStatusBadge,
  type CometStatusTone,
} from "./animations.js";

type PanelBorder = "blue" | "cyan" | "magenta" | "yellow" | "red" | "green";

const renderPanel = (title: string, borderColor: PanelBorder, lines: string[]): string =>
  boxen(lines.join("\n"), {
    borderStyle: "round",
    borderColor,
    padding: { top: 0, right: 1, bottom: 0, left: 1 },
    margin: { top: 0, bottom: 0, left: 0, right: 0 },
    title: ` ${COMET_COLORS.accent("✦")} ${title} `,
    titleAlignment: "left",
  });

export const renderKeyValueRow = (label: string, value: string): string =>
  `${COMET_COLORS.muted(label.padEnd(12, " "))} ${value}`;

export const renderStatusRow = (status: CometStatusTone, label: string, value: string): string =>
  `${renderStatusBadge(status)} ${COMET_COLORS.muted(label.padEnd(18, " "))} ${value}`;

export const renderList = (
  items: string[],
  tone: "default" | "accent" | "success" | "warning" = "default"
): string[] => items.map((item) => `${renderBullet(tone)} ${item}`);

const formatStats = (bundle: GeneratedCommitBundle): string =>
  [
    renderKeyValueRow("branch", bundle.context.branch),
    renderKeyValueRow("files", String(bundle.context.stats.filesChanged)),
    renderKeyValueRow("insertions", String(bundle.context.stats.insertions)),
    renderKeyValueRow("deletions", String(bundle.context.stats.deletions)),
    renderKeyValueRow("source", bundle.source),
  ].join("   ");

export const renderCommitPreview = (bundle: GeneratedCommitBundle): string => {
  const { config } = bundle;
  const panels: string[] = [];

  panels.push(
    renderPanel(COMET_PANEL_STYLES.preview.title, COMET_PANEL_STYLES.preview.border, [
      COMET_COLORS.bold(bundle.formattedMessage),
      "",
      formatStats(bundle),
    ])
  );

  if (config.showSafeSend) {
    const sendPreviewLines = [
      renderKeyValueRow("included", String(bundle.context.includedFiles.length)),
      renderKeyValueRow("skipped", String(bundle.context.skippedFiles.length)),
      renderKeyValueRow("redactions", String(bundle.context.redactionReport.totalMatches)),
      renderKeyValueRow("privacy", bundle.config.privacyMode),
      "",
      COMET_COLORS.secondary("Files included in AI payload"),
      ...renderList(bundle.context.includedFiles.slice(0, 8), "accent"),
    ];

    if (bundle.context.skippedFiles.length > 0) {
      sendPreviewLines.push("");
      sendPreviewLines.push(COMET_COLORS.warning("Files skipped from AI payload"));
      sendPreviewLines.push(...renderList(bundle.context.skippedFiles.slice(0, 8), "warning"));
    }

    panels.push(
      renderPanel(COMET_PANEL_STYLES.safeSend.title, COMET_PANEL_STYLES.safeSend.border, sendPreviewLines)
    );
  }

  if (config.showAnalysis) {
    panels.push(
      renderPanel(COMET_PANEL_STYLES.analysis.title, COMET_PANEL_STYLES.analysis.border, [
        renderKeyValueRow("type", bundle.analysis.candidateType),
        renderKeyValueRow("scope", bundle.analysis.candidateScope ?? "none"),
        renderKeyValueRow("confidence", bundle.analysis.confidence),
        renderKeyValueRow("issue key", bundle.analysis.issueKey ?? "none"),
        "",
        COMET_COLORS.secondary("Summary"),
        bundle.analysis.summary,
        "",
        COMET_COLORS.secondary("Rationale"),
        ...renderList(bundle.analysis.rationale, "default"),
      ])
    );
  }

  if (config.showQuality) {
    panels.push(
      renderPanel(COMET_PANEL_STYLES.quality.title, COMET_PANEL_STYLES.quality.border, [
        renderKeyValueRow("score", `${bundle.review.score}/100`),
        renderKeyValueRow("confidence", bundle.review.confidence),
        "",
        COMET_COLORS.secondary("Suggestions"),
        ...(bundle.review.suggestions.length > 0
          ? renderList(bundle.review.suggestions.slice(0, 5), "success")
          : [COMET_COLORS.muted("◇ No refinement needed")]),
        ...(bundle.review.warnings.length > 0
          ? ["", COMET_COLORS.warning("Warnings"), ...renderList(bundle.review.warnings.slice(0, 5), "warning")]
          : []),
      ])
    );
  }

  if (config.showWarnings && bundle.warnings.length > 0) {
    panels.push(
      renderPanel(COMET_PANEL_STYLES.warning.title, COMET_PANEL_STYLES.warning.border, [
        ...renderList(bundle.warnings, "warning"),
      ])
    );
  }

  return panels.join("\n");
};

export const renderConfigPanel = (title: string, lines: string[]): string =>
  renderPanel(title, "blue", lines);
