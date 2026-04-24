import type { RuntimeOverrides, SplitPlanStep } from "../domain/models.js";
import { loadConfig } from "../config/loader.js";
import { createGitCommit } from "../git/commit.js";
import { pushGitCommit } from "../git/push.js";
import { getStagedFiles, stageFiles, unstageFiles } from "../git/status.js";
import { parseCommittedMessage, recordRepoMemory } from "../memory/repo-memory.js";
import { logger } from "../ui/logger.js";
import { renderCommitPreview } from "../ui/panels.js";
import { chooseCommitAction, confirmGitPush, handlePromptCancel } from "../ui/prompts.js";
import { createSpinner, isInteractiveTerminal } from "../ui/spinner.js";
import { omitUndefined } from "../utils/object.js";
import { printJson } from "../utils/output.js";
import { editTextInEditor } from "../utils/editor.js";
import { ensureReadyRepository, generateCommitBundle, type GeneratedCommitBundle } from "./generate-commit.js";
import { cometOutro, printTreeTail } from "../ui/animations.js";

interface CommitInteractionResult {
  kind: "commit" | "previewed" | "split" | "cancel";
  bundle: GeneratedCommitBundle;
  message?: string;
}

interface SplitExecutionStep {
  title: string;
  summary: string;
  files: string[];
  suggestedType: SplitPlanStep["suggestedType"];
  suggestedScope: SplitPlanStep["suggestedScope"];
}

const uniqueStrings = (values: string[]): string[] => [...new Set(values)];

const createMemoryRecorder = (
  bundle: GeneratedCommitBundle,
  message: string,
  overrides: RuntimeOverrides,
  cwd: string
): (() => Promise<void>) => async () => {
  await recordRepoMemory({
    cwd,
    commit: parseCommittedMessage(message, bundle.generatedCommit),
    analysis: bundle.analysis,
    ...(overrides.intent ? { explicitIntent: overrides.intent } : {}),
  });
};

const maybePushAndOutro = async (gitPush: boolean, cwd: string): Promise<void> => {
  if (!gitPush) {
    await cometOutro(true);
    return;
  }

  if (!isInteractiveTerminal()) {
    logger.warn("Git push is enabled, but push confirmation requires a TTY. Skipping push.");
    await cometOutro(true);
    return;
  }

  const shouldPush = await confirmGitPush();
  if (!shouldPush) {
    logger.step("Skipped git push.");
    await cometOutro(true);
    return;
  }

  await pushGitCommit(cwd);
  logger.success("Git push completed.");
  await cometOutro(true);
};

const commitAndMaybePush = async (
  message: string,
  gitPush: boolean,
  cwd: string,
  onCommitted?: () => Promise<void>
): Promise<void> => {
  await createGitCommit(message, cwd);
  if (onCommitted) {
    await onCommitted();
  }
  logger.success("Git commit created.");
  await maybePushAndOutro(gitPush, cwd);
};

const runCommitInteraction = async ({
  overrides,
  cwd,
  allowSplit,
}: {
  overrides: RuntimeOverrides;
  cwd: string;
  allowSplit: boolean;
}): Promise<CommitInteractionResult> => {
  let regenerationAttempt = 0;
  let previousMessage: string | null = null;

  while (true) {
    const spinner = createSpinner();
    spinner.start("Analyzing staged diff");

    let bundle: GeneratedCommitBundle;
    try {
      spinner.update("Generating commit message");
      bundle = await generateCommitBundle(overrides, cwd, {
        regenerationAttempt,
        previousMessage,
      });
      spinner.stop("Commit message ready", true);
    } catch (error) {
      spinner.stop(error instanceof Error ? error.message : "Generation failed", false);
      throw error;
    }

    if (bundle.truncated) {
      logger.warn("Diff was truncated to stay within the configured token budget.");
    }

    if (overrides.json) {
      printJson(bundle);
    } else {
      console.log();
      console.log(renderCommitPreview(bundle));
    }

    if (overrides.previewOnly) {
      printTreeTail("Preview only — no commit created", "info");
      return { kind: "previewed", bundle };
    }

    if (bundle.config.autoCommit || overrides.autoAccept) {
      return {
        kind: "commit",
        bundle,
        message: bundle.formattedMessage,
      };
    }

    if (!isInteractiveTerminal()) {
      throw new Error("Interactive confirmation requires a TTY. Use --yes or --preview.");
    }

    const action = await chooseCommitAction({
      allowSplit: allowSplit && bundle.config.allowSplitSuggestions && bundle.splitPlan.recommended,
    });

    if (action === "cancel") {
      return { kind: "cancel", bundle };
    }

    if (action === "split") {
      return { kind: "split", bundle };
    }

    if (action === "regenerate") {
      regenerationAttempt += 1;
      previousMessage = bundle.formattedMessage;
      logger.step("Generating a new commit message alternative.");
      continue;
    }

    if (action === "edit") {
      const editedMessage = await editTextInEditor(bundle.formattedMessage);
      if (!editedMessage) {
        logger.warn("Edited commit message was empty. Returning to preview.");
        continue;
      }

      return {
        kind: "commit",
        bundle,
        message: editedMessage,
      };
    }

    return {
      kind: "commit",
      bundle,
      message: bundle.formattedMessage,
    };
  }
};

const buildSplitExecutionSteps = (
  bundle: GeneratedCommitBundle,
  stagedFiles: string[]
): SplitExecutionStep[] => {
  const plannedSteps: SplitExecutionStep[] = bundle.splitPlan.steps.map((step) => ({
    title: step.title,
    summary: step.summary,
    files: uniqueStrings(step.files.filter((file) => stagedFiles.includes(file))),
    suggestedType: step.suggestedType,
    suggestedScope: step.suggestedScope,
  }));

  const coveredFiles = new Set(plannedSteps.flatMap((step) => step.files));
  const remainingFiles = stagedFiles.filter((file) => !coveredFiles.has(file));

  if (remainingFiles.length > 0) {
    plannedSteps.push({
      title: "chore(repo): commit remaining staged changes",
      summary: "Commit staged files that were not grouped by the split heuristics.",
      files: remainingFiles,
      suggestedType: bundle.analysis.candidateType,
      suggestedScope: bundle.analysis.candidateScope,
    });
  }

  return plannedSteps.filter((step) => step.files.length > 0);
};

const restageRemainingSplitFiles = async (
  splitSteps: SplitExecutionStep[],
  startIndex: number,
  executedFiles: Set<string>,
  cwd: string
): Promise<void> => {
  const remainingFiles = uniqueStrings(
    splitSteps
      .slice(startIndex)
      .flatMap((step) => step.files)
      .filter((file) => !executedFiles.has(file))
  );

  await stageFiles(remainingFiles, cwd);
};

const runSplitCommitFlow = async (
  bundle: GeneratedCommitBundle,
  overrides: RuntimeOverrides,
  cwd: string
): Promise<boolean> => {
  const originalStagedFiles = await getStagedFiles(cwd);
  if (originalStagedFiles.length === 0) {
    printTreeTail("No staged changes detected for split flow", "info");
    return false;
  }

  const splitSteps = buildSplitExecutionSteps(bundle, originalStagedFiles);
  if (splitSteps.length <= 1) {
    logger.warn("Split plan did not produce multiple executable steps. Continuing with normal commit flow is safer.");
    return false;
  }

  logger.step(`Starting split flow with ${splitSteps.length} planned commit${splitSteps.length === 1 ? "" : "s"}.`);
  await unstageFiles(originalStagedFiles, cwd);

  const executedFiles = new Set<string>();
  let committedSteps = 0;

  for (const [index, step] of splitSteps.entries()) {
    const stepFiles = uniqueStrings(step.files.filter((file) => !executedFiles.has(file)));
    if (stepFiles.length === 0) {
      continue;
    }

    await stageFiles(stepFiles, cwd);
    logger.step(`Split step ${index + 1}/${splitSteps.length}: ${step.title}`);

    const stepOverrides = omitUndefined({
      ...overrides,
      previewOnly: false,
      json: false,
      autoAccept: false,
      intent: overrides.intent ? `${overrides.intent} / ${step.summary}` : step.summary,
      forcedType: overrides.forcedType ?? step.suggestedType,
      forcedScope:
        overrides.forcedScope !== undefined
          ? overrides.forcedScope
          : (step.suggestedScope ?? undefined),
    }) as RuntimeOverrides;

    const interaction = await runCommitInteraction({
      overrides: stepOverrides,
      cwd,
      allowSplit: false,
    });

    if (interaction.kind === "cancel") {
      await restageRemainingSplitFiles(splitSteps, index, executedFiles, cwd);

      if (committedSteps === 0) {
        printTreeTail("Split flow cancelled — staged changes restored", "info");
        return false;
      }

      logger.warn("Split flow cancelled. Remaining planned changes were re-staged for manual follow-up.");
      return true;
    }

    if (interaction.kind !== "commit" || !interaction.message) {
      throw new Error("Unexpected split flow state.");
    }

    await createGitCommit(interaction.message, cwd);
    await createMemoryRecorder(interaction.bundle, interaction.message, stepOverrides, cwd)();
    committedSteps += 1;
    stepFiles.forEach((file) => executedFiles.add(file));
    logger.success(`Created split commit ${committedSteps}/${splitSteps.length}.`);
  }

  logger.success(`Split flow completed with ${committedSteps} commit${committedSteps === 1 ? "" : "s"}.`);
  await maybePushAndOutro(bundle.config.gitPush, cwd);
  return true;
};

export const runCommitFlow = async (
  overrides: RuntimeOverrides = {},
  cwd = process.cwd()
): Promise<boolean> => {
  const config = await loadConfig(
    omitUndefined({
      provider: overrides.provider,
      model: overrides.model,
      baseUrl: overrides.baseUrl,
      apiKey: overrides.apiKey,
      language: overrides.language,
      emoji: overrides.emoji,
      description: overrides.description,
      oneLine: overrides.oneLine,
      omitScope: overrides.omitScope,
      why: overrides.why,
      gitPush: overrides.gitPush,
      privacyMode: overrides.privacyMode,
    }),
    cwd
  );

  await ensureReadyRepository(config, cwd);
  const stagedFiles = await getStagedFiles(cwd);

  if (stagedFiles.length === 0) {
    printTreeTail("No changes detected", "info");
    return false;
  }

  const interaction = await runCommitInteraction({
    overrides,
    cwd,
    allowSplit: config.allowSplitExecution,
  });

  if (interaction.kind === "previewed") {
    return true;
  }

  if (interaction.kind === "cancel") {
    handlePromptCancel();
  }

  if (interaction.kind === "split") {
    return runSplitCommitFlow(interaction.bundle, overrides, cwd);
  }

  if (!interaction.message) {
    throw new Error("Commit interaction returned no message.");
  }

  await commitAndMaybePush(
    interaction.message,
    interaction.bundle.config.gitPush,
    cwd,
    createMemoryRecorder(interaction.bundle, interaction.message, overrides, cwd)
  );
  return true;
};
