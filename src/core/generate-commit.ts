import { createCommitAnalysis } from "../analyzer/diff-summary.js";
import { hasGenericSubject, reviewDiffRisk, reviewGeneratedCommit } from "../analyzer/quality-review.js";
import { createSplitPlan } from "../analyzer/split-plan.js";
import { createLocalFallbackCommit } from "../ai/local-fallback.js";
import { createProvider } from "../ai/provider.js";
import { loadConfig } from "../config/loader.js";
import { createCommitIntent, createPrivacySummary, createRiskLevel } from "./copilot-insights.js";
import type {
  CommitIntent,
  CommitQualityReport,
  CometConfig,
  DiffReviewReport,
  GeneratedCommit,
  GitDiffContext,
  PrivacySummary,
  RepoMemoryInsights,
  SplitPlan,
  RuntimeOverrides,
} from "../domain/models.js";
import { formatCommitMessage } from "../formatter/commit-formatter.js";
import { collectDiffContext, collectRangeDiffContext } from "../git/diff.js";
import { getStagedFiles, isGitRepository, stageAllChanges } from "../git/status.js";
import { loadRepoMemory, summarizeRepoMemory } from "../memory/repo-memory.js";
import { createPrompt } from "../prompt/builder.js";
import { omitUndefined } from "../utils/object.js";
import { applyMessageTemplate } from "../utils/template.js";

export interface GeneratedCommitBundle {
  config: CometConfig;
  context: GitDiffContext;
  analysis: ReturnType<typeof createCommitAnalysis>;
  review: CommitQualityReport;
  diffReview: DiffReviewReport;
  generatedCommit: GeneratedCommit;
  formattedMessage: string;
  promptPayload: string;
  truncated: boolean;
  source: "provider" | "local-fallback";
  warnings: string[];
  intent: CommitIntent;
  privacy: PrivacySummary;
  repoMemory: RepoMemoryInsights;
  riskLevel: "low" | "medium" | "high";
  splitPlan: SplitPlan;
}

interface BundleGenerationOptions {
  regenerationAttempt?: number;
  previousMessage?: string | null;
}

const applyGeneratedOverrides = (
  commit: GeneratedCommit,
  overrides: RuntimeOverrides,
  config: CometConfig,
  analysis: ReturnType<typeof createCommitAnalysis>
): GeneratedCommit => ({
  ...commit,
  type: overrides.forcedType ?? commit.type,
  scope: overrides.forcedScope !== undefined ? overrides.forcedScope : commit.scope,
  why: config.why ? commit.why ?? analysis.rationale.join(" ") : null,
  issueKey:
    commit.issueKey ??
    analysis.issueKey ??
    (config.policyRequireIssueKey ? analysis.issueKey : null) ??
    null,
});

const toConfigOverrides = (overrides: RuntimeOverrides): Partial<CometConfig> =>
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
  }) as Partial<CometConfig>;

const ensureMessageIsUsable = (
  commit: GeneratedCommit,
  analysis: ReturnType<typeof createCommitAnalysis>,
  context: GitDiffContext,
  regenerationAttempt = 0
): GeneratedCommit => {
  if (commit.subject.trim()) {
    return commit;
  }

  return createLocalFallbackCommit(analysis, context, regenerationAttempt);
};

const normalizeWhitespace = (value: string): string => value.replace(/\s+/g, " ").trim();

const stripCommitPrefix = (value: string): string =>
  value.replace(/^[a-z]+(?:\([^)]+\))?!?:\s*/i, "");

const normalizeOptionalValue = (value: string | null | undefined): string | null => {
  if (!value) {
    return null;
  }

  const normalized = normalizeWhitespace(value)
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/\.$/, "");

  if (!normalized || /^(none|null|n\/a)$/i.test(normalized)) {
    return null;
  }

  return normalized;
};

const normalizeSubject = (value: string): string =>
  normalizeWhitespace(
    stripCommitPrefix(value)
      .replace(/^["'`]+|["'`]+$/g, "")
      .replace(/^[*-]\s*/, "")
      .replace(/\.$/, "")
  );

const normalizeGeneratedCommit = (
  commit: GeneratedCommit,
  analysis: ReturnType<typeof createCommitAnalysis>
): GeneratedCommit => {
  const subject = normalizeSubject(commit.subject);
  const normalizedScope = normalizeOptionalValue(commit.scope) ?? analysis.candidateScope ?? null;

  return {
    ...commit,
    scope: normalizedScope,
    subject,
    body: commit.body
      .map((line) => normalizeOptionalValue(line))
      .filter((line): line is string => Boolean(line))
      .slice(0, 3),
    breakingDescription: normalizeOptionalValue(commit.breakingDescription),
    why: normalizeOptionalValue(commit.why),
    issueKey: normalizeOptionalValue(commit.issueKey),
  };
};

const enforceProductionQuality = (
  commit: GeneratedCommit,
  analysis: ReturnType<typeof createCommitAnalysis>,
  context: GitDiffContext,
  regenerationAttempt = 0
): GeneratedCommit => {
  const normalizedCommit = normalizeGeneratedCommit(commit, analysis);

  if (!normalizedCommit.subject || normalizedCommit.subject.length > 72 || hasGenericSubject(normalizedCommit.subject)) {
    return createLocalFallbackCommit(analysis, context, regenerationAttempt);
  }

  return normalizedCommit;
};

const createBundleFromContext = async (
  config: CometConfig,
  context: GitDiffContext,
  repoMemory: RepoMemoryInsights,
  overrides: RuntimeOverrides = {},
  mode: "generate" | "inspect" = "generate",
  generationOptions: BundleGenerationOptions = {}
): Promise<GeneratedCommitBundle> => {
  const analysis = createCommitAnalysis(context, config);
  const intent = createCommitIntent(analysis, repoMemory, overrides.intent);
  const regenerationAttempt = generationOptions.regenerationAttempt ?? 0;
  const warnings: string[] = [];
  let generatedCommit: GeneratedCommit;
  let truncated = false;
  let promptPayload = context.semanticDiff;
  let source: GeneratedCommitBundle["source"] = "provider";

  if (mode === "inspect") {
    source = "local-fallback";
    generatedCommit = createLocalFallbackCommit(analysis, context, regenerationAttempt);
    warnings.push("Inspect mode uses local analysis only. Provider generation was skipped.");
  } else if (config.privacyMode === "local-only") {
    source = "local-fallback";
    generatedCommit = createLocalFallbackCommit(analysis, context, regenerationAttempt);
    warnings.push("Using local-only mode. Provider generation was skipped.");
  } else {
    try {
      const provider = createProvider(config);
      const prompt = createPrompt(config, context, analysis, {
        ...generationOptions,
        intent,
        repoMemory,
      });
      truncated = prompt.truncated;
      promptPayload = prompt.payload;
      generatedCommit = await provider.generateCommitMessage({
        model: config.model,
        baseUrl: config.baseUrl,
        apiKey: config.apiKey,
        customHeaders: config.customHeaders,
        prompt: prompt.prompt,
        diff: prompt.payload,
        maxInputTokens: config.maxInputTokens,
        maxOutputTokens: config.maxOutputTokens,
        regenerationAttempt,
      });
    } catch (error) {
      source = "local-fallback";
      warnings.push(
        `Provider generation failed. Falling back to local commit generation. Reason: ${error instanceof Error ? error.message : String(error)}`
      );
      generatedCommit = createLocalFallbackCommit(analysis, context, regenerationAttempt);
    }
  }

  const usableCommit = ensureMessageIsUsable(generatedCommit, analysis, context, regenerationAttempt);
  const productionCommit = enforceProductionQuality(
    usableCommit,
    analysis,
    context,
    regenerationAttempt
  );
  const finalCommit = applyGeneratedOverrides(productionCommit, overrides, config, analysis);
  const formattedMessage = applyMessageTemplate(
    config.messageTemplate,
    formatCommitMessage(finalCommit, config)
  );
  const review = reviewGeneratedCommit(finalCommit, analysis, config);
  const diffReview = reviewDiffRisk(context, analysis);
  const splitPlan = createSplitPlan(context, analysis, config);
  const privacy = createPrivacySummary({
    promptPayload,
    privacyMode: config.privacyMode,
    maxOutputTokens: config.maxOutputTokens,
    context,
  });
  const riskLevel = createRiskLevel(context, analysis, diffReview);

  return {
    config,
    context,
    analysis,
    review,
    diffReview,
    generatedCommit: finalCommit,
    formattedMessage,
    promptPayload,
    truncated,
    source,
    warnings,
    intent,
    privacy,
    repoMemory,
    riskLevel,
    splitPlan,
  };
};

export const ensureReadyRepository = async (config: CometConfig, cwd = process.cwd()): Promise<void> => {
  if (!(await isGitRepository(cwd))) {
    throw new Error("Not a Git repository. Run Comet inside a Git project.");
  }

  const stagedFiles = await getStagedFiles(cwd);
  if (stagedFiles.length > 0 || !config.stageAll) {
    return;
  }

  await stageAllChanges(cwd);
};

export const analyzeStagedChanges = async (
  overrides: RuntimeOverrides = {},
  cwd = process.cwd(),
  generationOptions: BundleGenerationOptions = {}
): Promise<GeneratedCommitBundle> => {
  const config = await loadConfig(toConfigOverrides(overrides), cwd);
  await ensureReadyRepository(config, cwd);
  const repoMemory = summarizeRepoMemory(await loadRepoMemory(cwd));

  const stagedFiles = await getStagedFiles(cwd);
  if (stagedFiles.length === 0) {
    throw new Error("No staged changes found. Stage files first or enable COMET_STAGE_ALL.");
  }

  const context = await collectDiffContext(config, cwd);
  return createBundleFromContext(config, context, repoMemory, overrides, "generate", generationOptions);
};

export const inspectStagedChanges = async (
  overrides: RuntimeOverrides = {},
  cwd = process.cwd()
): Promise<GeneratedCommitBundle> => {
  const config = await loadConfig(toConfigOverrides(overrides), cwd);
  await ensureReadyRepository(config, cwd);
  const repoMemory = summarizeRepoMemory(await loadRepoMemory(cwd));

  const stagedFiles = await getStagedFiles(cwd);
  if (stagedFiles.length === 0) {
    throw new Error("No staged changes found. Stage files first or enable COMET_STAGE_ALL.");
  }

  const context = await collectDiffContext(config, cwd);
  return createBundleFromContext(config, context, repoMemory, overrides, "inspect");
};

export const analyzeCommitRange = async (
  baseRef: string,
  headRef = "HEAD",
  overrides: RuntimeOverrides = {},
  cwd = process.cwd(),
  generationOptions: BundleGenerationOptions = {}
): Promise<GeneratedCommitBundle> => {
  const config = await loadConfig(toConfigOverrides(overrides), cwd);
  const repoMemory = summarizeRepoMemory(await loadRepoMemory(cwd));
  const context = await collectRangeDiffContext(config, baseRef, headRef, cwd);

  if (context.files.length === 0) {
    throw new Error(`No changes found between ${baseRef} and ${headRef}.`);
  }

  return createBundleFromContext(config, context, repoMemory, overrides, "generate", generationOptions);
};

export const inspectCommitRange = async (
  baseRef: string,
  headRef = "HEAD",
  overrides: RuntimeOverrides = {},
  cwd = process.cwd()
): Promise<GeneratedCommitBundle> => {
  const config = await loadConfig(toConfigOverrides(overrides), cwd);
  const repoMemory = summarizeRepoMemory(await loadRepoMemory(cwd));
  const context = await collectRangeDiffContext(config, baseRef, headRef, cwd);

  if (context.files.length === 0) {
    throw new Error(`No changes found between ${baseRef} and ${headRef}.`);
  }

  return createBundleFromContext(config, context, repoMemory, overrides, "inspect");
};

export const generateCommitBundle = analyzeStagedChanges;

export const normalizeCommitType = (value: string) => value as GeneratedCommit["type"];
