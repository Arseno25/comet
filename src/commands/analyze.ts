import type { Command } from "commander";
import { inspectStagedChanges } from "../core/generate-commit.js";
import { renderConfigPanel } from "../ui/panels.js";
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
        `Type: ${bundle.analysis.candidateType}`,
        `Scope: ${bundle.analysis.candidateScope ?? "none"}`,
        `Issue key: ${bundle.analysis.issueKey ?? "none"}`,
        `Confidence: ${bundle.analysis.confidence}`,
        "",
        bundle.analysis.summary,
      ])
    );
    console.log(
      renderConfigPanel("Analyze / Rationale", bundle.analysis.rationale.map((item) => `- ${item}`))
    );
    console.log(
      renderConfigPanel("Analyze / Quality", [
        `Score: ${bundle.review.score}/100`,
        ...bundle.review.warnings.map((item) => `- ${item}`),
      ])
    );
  });
};
