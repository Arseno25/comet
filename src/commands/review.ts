import type { Command } from "commander";
import { inspectStagedChanges } from "../core/generate-commit.js";
import { renderConfigPanel } from "../ui/panels.js";
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
      });
      return;
    }

    console.log(
      renderConfigPanel("Review / Risks", [
        bundle.diffReview.summary,
        "",
        "Risks:",
        ...(bundle.diffReview.risks.length > 0 ? bundle.diffReview.risks.map((item) => `- ${item}`) : ["- none"]),
      ])
    );
    console.log(
      renderConfigPanel("Review / Highlights", [
        ...(bundle.diffReview.highlights.length > 0
          ? bundle.diffReview.highlights.map((item) => `- ${item}`)
          : ["- none"]),
      ])
    );
  });
};
