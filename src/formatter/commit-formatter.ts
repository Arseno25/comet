import type { CometConfig, GeneratedCommit } from "../domain/models.js";
import { typeEmojiMap } from "./emoji.js";

const appendIssueKey = (subject: string, issueKey: string | null, required: boolean): string => {
  if (!required || !issueKey) {
    return subject;
  }

  if (subject.includes(issueKey)) {
    return subject;
  }

  return `${subject} [${issueKey}]`;
};

const buildHeader = (commit: GeneratedCommit, config: CometConfig): string => {
  const prefix = config.emoji ? `${typeEmojiMap[commit.type]} ` : "";
  const scopeSegment =
    config.omitScope || !commit.scope ? "" : `(${commit.scope})`;
  const breakingSegment = commit.breaking ? "!" : "";
  const subject = appendIssueKey(commit.subject, commit.issueKey, config.policyRequireIssueKey);

  return `${prefix}${commit.type}${scopeSegment}${breakingSegment}: ${subject}`;
};

export const formatCommitMessage = (commit: GeneratedCommit, config: CometConfig): string => {
  const header = buildHeader(commit, config);
  if (config.oneLine) {
    return header;
  }

  const lines = [header];

  if (config.description && commit.body.length > 0) {
    lines.push("", ...commit.body.map((item) => `- ${item}`));
  }

  if (config.why && commit.why) {
    lines.push("", `Why: ${commit.why}`);
  }

  if (commit.breaking && commit.breakingDescription) {
    lines.push("", `BREAKING CHANGE: ${commit.breakingDescription}`);
  }

  return lines.join("\n");
};
