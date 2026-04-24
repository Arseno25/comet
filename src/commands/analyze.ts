import type { Command } from "commander";
import { inspectStagedChanges } from "../core/generate-commit.js";
import { renderConfigPanel, renderKeyValueRow, renderList } from "../ui/panels.js";
import { printJson } from "../utils/output.js";
import { addRuntimeOptions, collectRuntimeOverrides } from "./shared.js";

export const registerAnalyzeCommand = (program: Command): void => {
  const command = addRuntimeOptions(
    program.command("analyze").description("Analyze staged changes without creating a commit")
  );

  command.action(async () => {
    const overrides = collectRuntimeOverrides(command);
    const bundle = await inspectStagedChanges(overrides);

    if (overrides.json) {
      printJson(bundle);
      return;
    }

    console.log(
      renderConfigPanel("Analyze / Summary", [
        renderKeyValueRow("type", bundle.analysis.candidateType),
        renderKeyValueRow("scope", bundle.analysis.candidateScope ?? "none"),
        renderKeyValueRow("intent", bundle.intent.value),
        renderKeyValueRow("issue key", bundle.analysis.issueKey ?? "none"),
        renderKeyValueRow("confidence", bundle.analysis.confidence),
        renderKeyValueRow("privacy", `${bundle.privacy.mode} / ~${bundle.privacy.estimatedInputTokens} tok`),
        "",
        bundle.analysis.summary,
      ])
    );
    console.log(
      renderConfigPanel("Analyze / Rationale", renderList(bundle.analysis.rationale))
    );
    console.log(
      renderConfigPanel("Analyze / Quality", [
        renderKeyValueRow("score", `${bundle.review.score}/100`),
        "",
        ...(bundle.review.warnings.length > 0 ? renderList(bundle.review.warnings, "warning") : ["◇ No warnings"]),
      ])
    );
    console.log(
      renderConfigPanel("Analyze / Split Plan", [
        `Recommended: ${bundle.splitPlan.recommended ? "yes" : "no"}`,
        `Confidence: ${bundle.splitPlan.confidence}`,
        "",
        bundle.splitPlan.reason,
        ...(bundle.splitPlan.steps.length > 0
          ? [
              "",
              ...bundle.splitPlan.steps.slice(0, 3).flatMap((step, index) => [
                `${index + 1}. ${step.title}`,
                ...renderList(step.files.slice(0, 4), "accent"),
              ]),
            ]
          : []),
      ])
    );
  });
};
