import { createCommitAnalysis } from "../analyzer/diff-summary.js";
import { reviewDiffRisk, reviewGeneratedCommit } from "../analyzer/quality-review.js";
import { createLocalFallbackCommit } from "../ai/local-fallback.js";
import { createProvider } from "../ai/provider.js";
import { loadConfig } from "../config/loader.js";
import type {
  CommitQualityReport,
  CometConfig,
  DiffReviewReport,
  GeneratedCommit,
  GitDiffContext,
  RuntimeOverrides,
} from "../domain/models.js";
import { formatCommitMessage } from "../formatter/commit-formatter.js";
import { collectDiffContext, collectRangeDiffContext } from "../git/diff.js";
import { getStagedFiles, isGitRepository, stageAllChanges } from "../git/status.js";
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
  context: GitDiffContext
): GeneratedCommit => {
  if (commit.subject.trim()) {
    return commit;
  }

  return createLocalFallbackCommit(analysis, context);
};

const createBundleFromContext = async (
  config: CometConfig,
  context: GitDiffContext,
  overrides: RuntimeOverrides = {},
  mode: "generate" | "inspect" = "generate"
): Promise<GeneratedCommitBundle> => {
  const analysis = createCommitAnalysis(context, config);
  const warnings: string[] = [];
  let generatedCommit: GeneratedCommit;
  let truncated = false;
  let promptPayload = context.semanticDiff;
  let source: GeneratedCommitBundle["source"] = "provider";

  if (mode === "inspect") {
    source = "local-fallback";
    generatedCommit = createLocalFallbackCommit(analysis, context);
    warnings.push("Inspect mode uses local analysis only. Provider generation was skipped.");
  } else if (config.privacyMode === "local-only") {
    source = "local-fallback";
    generatedCommit = createLocalFallbackCommit(analysis, context);
    warnings.push("Using local-only mode. Provider generation was skipped.");
  } else {
    try {
      const provider = createProvider(config);
      const prompt = createPrompt(config, context, analysis);
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
      });
    } catch (error) {
      source = "local-fallback";
      warnings.push(
        `Provider generation failed. Falling back to local commit generation. Reason: ${error instanceof Error ? error.message : String(error)}`
      );
      generatedCommit = createLocalFallbackCommit(analysis, context);
    }
  }

  const normalizedCommit = ensureMessageIsUsable(generatedCommit, analysis, context);
  const finalCommit = applyGeneratedOverrides(normalizedCommit, overrides, config, analysis);
  const formattedMessage = applyMessageTemplate(
    config.messageTemplate,
    formatCommitMessage(finalCommit, config)
  );
  const review = reviewGeneratedCommit(finalCommit, analysis, config);
  const diffReview = reviewDiffRisk(context, analysis);

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
  cwd = process.cwd()
): Promise<GeneratedCommitBundle> => {
  const config = await loadConfig(toConfigOverrides(overrides), cwd);
  await ensureReadyRepository(config, cwd);

  const stagedFiles = await getStagedFiles(cwd);
  if (stagedFiles.length === 0) {
    throw new Error("No staged changes found. Stage files first or enable COMET_STAGE_ALL.");
  }

  const context = await collectDiffContext(config, cwd);
  return createBundleFromContext(config, context, overrides);
};

export const inspectStagedChanges = async (
  overrides: RuntimeOverrides = {},
  cwd = process.cwd()
): Promise<GeneratedCommitBundle> => {
  const config = await loadConfig(toConfigOverrides(overrides), cwd);
  await ensureReadyRepository(config, cwd);

  const stagedFiles = await getStagedFiles(cwd);
  if (stagedFiles.length === 0) {
    throw new Error("No staged changes found. Stage files first or enable COMET_STAGE_ALL.");
  }

  const context = await collectDiffContext(config, cwd);
  return createBundleFromContext(config, context, overrides, "inspect");
};

export const analyzeCommitRange = async (
  baseRef: string,
  headRef = "HEAD",
  overrides: RuntimeOverrides = {},
  cwd = process.cwd()
): Promise<GeneratedCommitBundle> => {
  const config = await loadConfig(toConfigOverrides(overrides), cwd);
  const context = await collectRangeDiffContext(config, baseRef, headRef, cwd);

  if (context.files.length === 0) {
    throw new Error(`No changes found between ${baseRef} and ${headRef}.`);
  }

  return createBundleFromContext(config, context, overrides);
};

export const inspectCommitRange = async (
  baseRef: string,
  headRef = "HEAD",
  overrides: RuntimeOverrides = {},
  cwd = process.cwd()
): Promise<GeneratedCommitBundle> => {
  const config = await loadConfig(toConfigOverrides(overrides), cwd);
  const context = await collectRangeDiffContext(config, baseRef, headRef, cwd);

  if (context.files.length === 0) {
    throw new Error(`No changes found between ${baseRef} and ${headRef}.`);
  }

  return createBundleFromContext(config, context, overrides, "inspect");
};

export const generateCommitBundle = analyzeStagedChanges;

export const normalizeCommitType = (value: string) => value as GeneratedCommit["type"];
