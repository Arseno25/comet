export const commitTypes = [
  "feat",
  "fix",
  "docs",
  "style",
  "refactor",
  "perf",
  "test",
  "build",
  "ci",
  "chore",
  "revert",
] as const;

export type CommitType = (typeof commitTypes)[number];
export type PrivacyMode = "standard" | "strict" | "local-only";

export interface CometConfig {
  provider: string;
  model: string;
  baseUrl: string | null;
  apiKey: string | null;
  customHeaders: Record<string, string> | null;
  promptModule: string;
  language: string;
  description: boolean;
  emoji: boolean;
  oneLine: boolean;
  omitScope: boolean;
  why: boolean;
  messageTemplate: string;
  maxInputTokens: number;
  maxOutputTokens: number;
  autoCommit: boolean;
  gitPush: boolean;
  stageAll: boolean;
  redactSecrets: boolean;
  privacyMode: PrivacyMode;
  excludeFiles: string[];
}

export interface GitDiffStats {
  filesChanged: number;
  insertions: number;
  deletions: number;
}

export interface GitDiffContext {
  branch: string;
  files: string[];
  stats: GitDiffStats;
  rawDiff: string;
  safeDiff: string;
  skippedFiles: string[];
}

export interface CommitAnalysis {
  candidateType: CommitType;
  candidateScope: string | null;
  changedAreas: string[];
  summary: string;
}

export interface GeneratedCommit {
  type: CommitType;
  scope: string | null;
  subject: string;
  body: string[];
  breaking: boolean;
  breakingDescription: string | null;
  why: string | null;
}

export interface GenerateCommitInput {
  model: string;
  baseUrl?: string | null;
  apiKey?: string | null;
  customHeaders?: Record<string, string> | null;
  prompt: string;
  diff: string;
  maxInputTokens: number;
  maxOutputTokens: number;
}

export interface RuntimeOverrides {
  provider?: string;
  model?: string;
  baseUrl?: string | null;
  apiKey?: string | null;
  language?: string;
  emoji?: boolean;
  description?: boolean;
  oneLine?: boolean;
  omitScope?: boolean;
  why?: boolean;
  gitPush?: boolean;
  previewOnly?: boolean;
  autoAccept?: boolean;
  forcedType?: CommitType;
  forcedScope?: string | null;
  privacyMode?: PrivacyMode;
}
