import type { RuntimeOverrides } from "../domain/models.js";
import { loadConfig } from "../config/loader.js";
import { getStagedFiles } from "../git/status.js";
import { createGitCommit } from "../git/commit.js";
import { pushGitCommit } from "../git/push.js";
import { logger } from "../ui/logger.js";
import { renderCommitPreview } from "../ui/panels.js";
import { chooseCommitAction, confirmGitPush, handlePromptCancel } from "../ui/prompts.js";
import { createSpinner, isInteractiveTerminal } from "../ui/spinner.js";
import { omitUndefined } from "../utils/object.js";
import { printJson } from "../utils/output.js";
import { editTextInEditor } from "../utils/editor.js";
import { ensureReadyRepository, generateCommitBundle } from "./generate-commit.js";
import { cometOutro } from "../ui/animations.js";

const commitAndMaybePush = async (
  message: string,
  gitPush: boolean,
  cwd: string
): Promise<void> => {
  await createGitCommit(message, cwd);
  logger.success("Git commit created.");

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
    logger.warn("No staged changes found. Run `git add .` first or enable COMET_STAGE_ALL.");
    return false;
  }

  let regenerationAttempt = 0;
  let previousMessage: string | null = null;

  while (true) {
    const spinner = createSpinner();
    spinner.start("Analyzing staged diff");

    let bundle: Awaited<ReturnType<typeof generateCommitBundle>>;
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
      return true;
    }

    if (bundle.config.autoCommit || overrides.autoAccept) {
      await commitAndMaybePush(bundle.formattedMessage, bundle.config.gitPush, cwd);
      return true;
    }

    if (!isInteractiveTerminal()) {
      throw new Error("Interactive confirmation requires a TTY. Use --yes or --preview.");
    }

    const action = await chooseCommitAction();

    if (action === "cancel") {
      handlePromptCancel();
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

      await commitAndMaybePush(editedMessage, bundle.config.gitPush, cwd);
      return true;
    }

    await commitAndMaybePush(bundle.formattedMessage, bundle.config.gitPush, cwd);
    return true;
  }
};
