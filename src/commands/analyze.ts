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
      printJson({
        source: bundle.source,
        warnings: bundle.warnings,
        analysis: bundle.analysis,
        quality: bundle.review,
        diffReview: bundle.diffReview,
        redactionReport: bundle.context.redactionReport,
        context: {
          branch: bundle.context.branch,
          issueKey: bundle.context.issueKey,
          files: bundle.context.files,
          includedFiles: bundle.context.includedFiles,
          skippedFiles: bundle.context.skippedFiles,
          stats: bundle.context.stats,
          semanticChanges: bundle.context.semanticChanges,
        },
        generatedCommit: bundle.generatedCommit,
        formattedMessage: bundle.formattedMessage,
      });
      return;
    }

    console.log(
      renderConfigPanel("Analyze / Summary", [
        renderKeyValueRow("type", bundle.analysis.candidateType),
        renderKeyValueRow("scope", bundle.analysis.candidateScope ?? "none"),
        renderKeyValueRow("issue key", bundle.analysis.issueKey ?? "none"),
        renderKeyValueRow("confidence", bundle.analysis.confidence),
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
  });
};
