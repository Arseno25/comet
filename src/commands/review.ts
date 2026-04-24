import type { Command } from "commander";
import { inspectStagedChanges } from "../core/generate-commit.js";
import { renderConfigPanel, renderList } from "../ui/panels.js";
import { printJson } from "../utils/output.js";
import { addRuntimeOptions, collectRuntimeOverrides } from "./shared.js";

export const registerReviewCommand = (program: Command): void => {
  const command = addRuntimeOptions(
    program.command("review").description("Review staged changes before committing")
  );

  command.action(async () => {
    const overrides = collectRuntimeOverrides(command);
    const bundle = await inspectStagedChanges(overrides);

    if (overrides.json) {
      printJson({
        diffReview: bundle.diffReview,
        quality: bundle.review,
        analysis: bundle.analysis,
        splitPlan: bundle.splitPlan,
      });
      return;
    }

    console.log(
      renderConfigPanel("Review / Risks", [
        bundle.diffReview.summary,
        "",
        `Risk level: ${bundle.riskLevel}`,
        `Privacy: ${bundle.privacy.mode} / ~${bundle.privacy.estimatedInputTokens} tok`,
        "",
        "Risks",
        ...(bundle.diffReview.risks.length > 0 ? renderList(bundle.diffReview.risks, "warning") : ["◇ No major risks"]),
      ])
    );
    console.log(
      renderConfigPanel("Review / Highlights", [
        ...(bundle.diffReview.highlights.length > 0
          ? renderList(bundle.diffReview.highlights, "success")
          : ["◇ No highlights"]),
      ])
    );
    console.log(
      renderConfigPanel("Review / Split Plan", [
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
