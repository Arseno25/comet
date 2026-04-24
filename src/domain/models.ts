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
export type AnalysisConfidence = "high" | "medium" | "low";
export type GenerationSource = "provider" | "local-fallback";
export type RiskLevel = "low" | "medium" | "high";
export type UiMode = "minimal" | "standard" | "full";
export type SemanticChangeType =
  | "behavioral"
  | "format-only"
  | "rename-only"
  | "deletion-only"
  | "addition-only"
  | "mixed";

export interface CometConfig {
  provider: string;
  model: string;
  baseUrl: string | null;
  apiKey: string | null;
  customHeaders: Record<string, string> | null;
  promptModule: string;
  language: string;
  uiMode: UiMode;
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
  policyAllowedTypes: CommitType[];
  policyRequireIssueKey: boolean;
  issueKeyPattern: string;
  policyScopeMap: Record<string, string> | null;
  showCopilot: boolean;
  showSplitPlan: boolean;
  showSafeSend: boolean;
  showAnalysis: boolean;
  showQuality: boolean;
  showWarnings: boolean;
  allowSplitSuggestions: boolean;
  allowSplitExecution: boolean;
  verbose: boolean;
}

export interface GitDiffStats {
  filesChanged: number;
  insertions: number;
  deletions: number;
}

export interface GitDiffContext {
  branch: string;
  issueKey: string | null;
  files: string[];
  includedFiles: string[];
  stats: GitDiffStats;
  rawDiff: string;
  safeDiff: string;
  semanticDiff: string;
  skippedFiles: string[];
  redactionReport: RedactionReport;
  semanticChanges: SemanticFileChange[];
}

export interface CommitAnalysis {
  candidateType: CommitType;
  allowedTypes: CommitType[];
  candidateScope: string | null;
  changedAreas: string[];
  summary: string;
  rationale: string[];
  confidence: AnalysisConfidence;
  issueKey: string | null;
}

export interface GeneratedCommit {
  type: CommitType;
  scope: string | null;
  subject: string;
  body: string[];
  breaking: boolean;
  breakingDescription: string | null;
  why: string | null;
  issueKey: string | null;
}

export interface RedactionMatch {
  label: string;
  count: number;
}

export interface RedactionReport {
  changed: boolean;
  totalMatches: number;
  matches: RedactionMatch[];
}

export interface SemanticFileChange {
  file: string;
  previousFile: string | null;
  changeType: SemanticChangeType;
  additions: number;
  deletions: number;
  summaryLines: string[];
}

export interface CommitQualityReport {
  score: number;
  confidence: AnalysisConfidence;
  warnings: string[];
  suggestions: string[];
}

export interface DiffReviewReport {
  summary: string;
  risks: string[];
  highlights: string[];
}

export interface CommitIntent {
  value: string;
  source: "explicit" | "analysis" | "repo-memory";
}

export interface PrivacySummary {
  mode: PrivacyMode;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  includedFiles: number;
  skippedFiles: number;
  redactions: number;
}

export interface RepoMemory {
  version: number;
  typeCounts: Partial<Record<CommitType, number>>;
  scopeCounts: Record<string, number>;
  recentIntents: string[];
  lastUpdatedAt: string | null;
}

export interface RepoMemoryInsights {
  preferredTypes: Array<{
    type: CommitType;
    count: number;
  }>;
  preferredScopes: Array<{
    scope: string;
    count: number;
  }>;
  recentIntents: string[];
  lastUpdatedAt: string | null;
}

export interface SplitPlanStep {
  id: string;
  title: string;
  summary: string;
  rationale: string[];
  files: string[];
  suggestedType: CommitType;
  suggestedScope: string | null;
}

export interface SplitPlan {
  recommended: boolean;
  reason: string;
  confidence: AnalysisConfidence;
  steps: SplitPlanStep[];
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
  regenerationAttempt?: number;
}

export interface RuntimeOverrides {
  provider?: string;
  model?: string;
  baseUrl?: string | null;
  apiKey?: string | null;
  language?: string;
  intent?: string;
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
  json?: boolean;
}
