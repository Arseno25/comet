import * as p from "@clack/prompts";

export type CommitAction = "accept" | "edit" | "regenerate" | "cancel";

export const chooseCommitAction = async (): Promise<CommitAction> => {
  const result = await p.select<CommitAction>({
    message: "Use this commit message?",
    options: [
      { value: "accept", label: "Yes", hint: "commit now" },
      { value: "edit", label: "Edit", hint: "open in editor" },
      { value: "regenerate", label: "Regenerate", hint: "ask AI again" },
      { value: "cancel", label: "Cancel", hint: "abort" },
    ],
  });

  if (p.isCancel(result)) {
    return "cancel";
  }

  return result;
};

export const handlePromptCancel = (): never => {
  p.cancel("Operation cancelled.");
  process.exit(0);
};

export const confirmGitPush = async (): Promise<boolean> => {
  const result = await p.confirm({
    message: "Push to remote now?",
    initialValue: true,
  });

  if (p.isCancel(result)) {
    return false;
  }

  return result;
};
