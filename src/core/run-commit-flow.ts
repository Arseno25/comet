import type { RuntimeOverrides } from "../domain/models.js";
import { loadConfig } from "../config/loader.js";
import { getStagedFiles } from "../git/status.js";
import { createGitCommit } from "../git/commit.js";
import { pushGitCommit } from "../git/push.js";
import { logger } from "../ui/logger.js";
import { renderCommitPreview } from "../ui/panels.js";
import { chooseCommitAction, confirmGitPush, handlePromptCancel } from "../ui/prompts.js";
import { createSpinner, isInteractiveTerminal } from "../ui/spinner.js";
import { editTextInEditor } from "../utils/editor.js";
import { omitUndefined } from "../utils/object.js";
import { ensureReadyRepository, generateCommitBundle } from "./generate-commit.js";

const commitAndMaybePush = async (
  message: string,
  gitPush: boolean,
  cwd: string
): Promise<void> => {
  await createGitCommit(message, cwd);
  logger.success("Git commit created.");

  if (!gitPush) {
    return;
  }

  if (!isInteractiveTerminal()) {
    logger.warn("Git push is enabled, but push confirmation requires a TTY. Skipping push.");
    return;
  }

  const shouldPush = await confirmGitPush();
  if (!shouldPush) {
    logger.step("Skipped git push.");
    return;
  }

  await pushGitCommit(cwd);
  logger.success("Git push completed.");
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

  while (true) {
    const spinner = createSpinner();
    spinner.start("Analyzing staged diff and generating commit message");

    const bundle = await generateCommitBundle(overrides, cwd);
    spinner.stop("Commit message ready");

    if (bundle.truncated) {
      logger.warn("Diff was truncated to stay within the configured token budget.");
    }

    console.log(renderCommitPreview(bundle.formattedMessage, bundle.context));

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
