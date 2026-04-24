import type { RuntimeOverrides } from "../domain/models.js";
import { createGitCommit } from "../git/commit.js";
import { pushGitCommit } from "../git/push.js";
import { logger } from "../ui/logger.js";
import { renderCommitPreview } from "../ui/panels.js";
import { chooseCommitAction, handlePromptCancel } from "../ui/prompts.js";
import { createSpinner, isInteractiveTerminal } from "../ui/spinner.js";
import { editTextInEditor } from "../utils/editor.js";
import { generateCommitBundle } from "./generate-commit.js";

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

  await pushGitCommit(cwd);
  logger.success("Git push completed.");
};

export const runCommitFlow = async (
  overrides: RuntimeOverrides = {},
  cwd = process.cwd()
): Promise<void> => {
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
      return;
    }

    if (bundle.config.autoCommit || overrides.autoAccept) {
      await commitAndMaybePush(bundle.formattedMessage, bundle.config.gitPush, cwd);
      return;
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
      return;
    }

    await commitAndMaybePush(bundle.formattedMessage, bundle.config.gitPush, cwd);
    return;
  }
};
