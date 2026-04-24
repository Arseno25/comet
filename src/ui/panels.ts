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

const renderPanelStack = (panels: string[]): string => {
  if (panels.length <= 1) {
    return panels.join("\n");
  }

  const connector = `  ${COMET_COLORS.secondary("│")}`;
  return panels.join(`\n${connector}\n`);
};

const formatStats = (bundle: GeneratedCommitBundle): string =>
  ([
    ["branch", bundle.context.branch],
    ["files", String(bundle.context.stats.filesChanged)],
    ["insertions", String(bundle.context.stats.insertions)],
    ["deletions", String(bundle.context.stats.deletions)],
    ["source", bundle.source],
  ] satisfies Array<[string, string]>)
    .map(([label, value]) => `${COMET_COLORS.muted(label)} ${value}`)
    .join("  ");

const riskToTone = (riskLevel: GeneratedCommitBundle["riskLevel"]): CometStatusTone => {
  switch (riskLevel) {
    case "high":
      return "fail";
    case "medium":
      return "warn";
    default:
      return "ok";
  }
};

const formatRepoMemory = (bundle: GeneratedCommitBundle): string => {
  const typeHint = bundle.repoMemory.preferredTypes[0]?.type ?? "learning";
  const scopeHint = bundle.repoMemory.preferredScopes[0]?.scope ?? "none";
  return `${typeHint} / ${scopeHint}`;
};

const formatPrivacy = (bundle: GeneratedCommitBundle): string => {
  if (bundle.privacy.mode === "local-only") {
    return "local-only / 0 tok";
  }

  return `${bundle.privacy.mode} / ~${bundle.privacy.estimatedInputTokens} tok`;
};

const shouldShowCopilotPanel = (bundle: GeneratedCommitBundle): boolean =>
  bundle.config.showCopilot || bundle.config.uiMode === "standard" || bundle.config.uiMode === "full";

const shouldShowSplitPlanPanel = (bundle: GeneratedCommitBundle): boolean =>
  bundle.config.allowSplitSuggestions &&
  bundle.splitPlan.recommended &&
  (bundle.config.showSplitPlan || bundle.config.uiMode === "standard" || bundle.config.uiMode === "full");

const shouldShowSafeSendPanel = (bundle: GeneratedCommitBundle): boolean =>
  bundle.config.showSafeSend || bundle.config.uiMode === "full";

const shouldShowAnalysisPanel = (bundle: GeneratedCommitBundle): boolean =>
  bundle.config.showAnalysis || bundle.config.uiMode === "full";

const shouldShowQualityPanel = (bundle: GeneratedCommitBundle): boolean =>
  bundle.config.showQuality || bundle.config.uiMode === "full";

const shouldShowWarningsPanel = (bundle: GeneratedCommitBundle): boolean =>
  bundle.warnings.length > 0 && (bundle.config.showWarnings || bundle.config.uiMode === "full");

const renderCompactSignals = (bundle: GeneratedCommitBundle): string[] => {
  const signals = [`confidence ${bundle.analysis.confidence}`];

  if (bundle.source === "local-fallback") {
    signals.push("local fallback");
  }

  if (bundle.riskLevel !== "low") {
    signals.push(`risk ${bundle.riskLevel}`);
  }

  if (bundle.config.allowSplitSuggestions && bundle.splitPlan.recommended) {
    signals.push("split suggested");
  }

  if (bundle.privacy.redactions > 0) {
    signals.push(`${bundle.privacy.redactions} redaction${bundle.privacy.redactions === 1 ? "" : "s"}`);
  }

  return [COMET_COLORS.secondary(signals.join("  •  "))];
};

const renderSplitPlanLines = (bundle: GeneratedCommitBundle): string[] => {
  if (!bundle.splitPlan.recommended) {
    return [COMET_COLORS.muted(bundle.splitPlan.reason)];
  }

  return [
    renderKeyValueRow("confidence", bundle.splitPlan.confidence),
    "",
    bundle.splitPlan.reason,
    "",
    ...bundle.splitPlan.steps.slice(0, 3).flatMap((step, index) => [
      COMET_COLORS.bold(`${index + 1}. ${step.title}`),
      COMET_COLORS.secondary(step.summary),
      ...renderList(step.files.slice(0, 4), "accent"),
      ...(step.files.length > 4
        ? [COMET_COLORS.muted(`+${step.files.length - 4} more file${step.files.length - 4 === 1 ? "" : "s"}`)]
        : []),
      "",
    ]).slice(0, -1),
  ];
};

export const renderCommitPreview = (bundle: GeneratedCommitBundle): string => {
  const { config } = bundle;
  const panels: string[] = [];
  const stagedFiles = bundle.context.files;
  const visibleFiles = stagedFiles.slice(0, 8);

  panels.push(
    renderPanel(COMET_PANEL_STYLES.git.title, COMET_PANEL_STYLES.git.border, [
      COMET_COLORS.secondary(
        `${stagedFiles.length} staged file${stagedFiles.length === 1 ? "" : "s"} ready for commit`
      ),
      "",
      ...visibleFiles.map((file) => COMET_COLORS.bold(file)),
      ...(stagedFiles.length > visibleFiles.length
        ? [
            COMET_COLORS.muted(
              `+${stagedFiles.length - visibleFiles.length} more staged file${
                stagedFiles.length - visibleFiles.length === 1 ? "" : "s"
              }`
            ),
          ]
        : []),
    ])
  );

  panels.push(
    renderPanel(COMET_PANEL_STYLES.preview.title, COMET_PANEL_STYLES.preview.border, [
      COMET_COLORS.bold(bundle.formattedMessage),
      "",
      formatStats(bundle),
      ...(config.uiMode === "minimal" ? ["", ...renderCompactSignals(bundle)] : []),
    ])
  );

  if (shouldShowCopilotPanel(bundle)) {
    panels.push(
      renderPanel(COMET_PANEL_STYLES.copilot.title, COMET_PANEL_STYLES.copilot.border, [
        renderKeyValueRow("intent", bundle.intent.value),
        renderKeyValueRow("intent src", bundle.intent.source),
        renderStatusRow(
          riskToTone(bundle.riskLevel),
          "risk",
          `${bundle.riskLevel} (${bundle.diffReview.risks.length} signal${bundle.diffReview.risks.length === 1 ? "" : "s"})`
        ),
        renderStatusRow("info", "privacy", formatPrivacy(bundle)),
        renderKeyValueRow("repo fit", formatRepoMemory(bundle)),
        renderKeyValueRow("confidence", bundle.analysis.confidence),
        ...(bundle.diffReview.risks.length > 0
          ? ["", COMET_COLORS.warning("Top risks"), ...renderList(bundle.diffReview.risks.slice(0, 2), "warning")]
          : []),
        ...(bundle.diffReview.highlights.length > 0
          ? [
              "",
              COMET_COLORS.secondary("Highlights"),
              ...renderList(bundle.diffReview.highlights.slice(0, 2), "success"),
            ]
          : []),
      ])
    );
  }

  if (shouldShowSplitPlanPanel(bundle)) {
    panels.push(
      renderPanel(COMET_PANEL_STYLES.plan.title, COMET_PANEL_STYLES.plan.border, renderSplitPlanLines(bundle))
    );
  }

  if (shouldShowSafeSendPanel(bundle)) {
    const sendPreviewLines = [
        renderKeyValueRow("included", String(bundle.context.includedFiles.length)),
        renderKeyValueRow("skipped", String(bundle.context.skippedFiles.length)),
        renderKeyValueRow("redactions", String(bundle.context.redactionReport.totalMatches)),
        renderKeyValueRow("privacy", bundle.config.privacyMode),
        "",
        COMET_COLORS.secondary("Files included in AI payload"),
        ...renderList(bundle.context.includedFiles.slice(0, 8), "accent"),
        ...(bundle.context.skippedFiles.length > 0
          ? [
              "",
              COMET_COLORS.warning("Files skipped from AI payload"),
              ...renderList(bundle.context.skippedFiles.slice(0, 8), "warning"),
            ]
          : []),
      ];

    panels.push(
      renderPanel(COMET_PANEL_STYLES.safeSend.title, COMET_PANEL_STYLES.safeSend.border, sendPreviewLines)
    );
  }

  if (shouldShowAnalysisPanel(bundle)) {
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

  if (shouldShowQualityPanel(bundle)) {
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

  if (shouldShowWarningsPanel(bundle)) {
    panels.push(
      renderPanel(COMET_PANEL_STYLES.warning.title, COMET_PANEL_STYLES.warning.border, [
        ...renderList(bundle.warnings, "warning"),
      ])
    );
  }

  return renderPanelStack(panels);
};

export const renderConfigPanel = (title: string, lines: string[]): string =>
  renderPanel(title, "blue", lines);
