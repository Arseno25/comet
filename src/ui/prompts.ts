import * as p from "@clack/prompts";

export type CommitAction = "accept" | "regenerate" | "cancel";

export const chooseCommitAction = async (): Promise<CommitAction> => {
  const result = await p.select<CommitAction>({
    message: "Commit this message?",
    options: [
      { value: "accept", label: "Yes", hint: "commit now" },
      { value: "regenerate", label: "Regenerate", hint: "generate a new alternative" },
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
