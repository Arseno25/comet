import { createCommitAnalysis } from "../analyzer/diff-summary.js";
import { createLocalFallbackCommit } from "../ai/local-fallback.js";
import { createProvider } from "../ai/provider.js";
import { loadConfig } from "../config/loader.js";
import type { CommitType, CometConfig, GeneratedCommit, GitDiffContext, RuntimeOverrides } from "../domain/models.js";
import { formatCommitMessage } from "../formatter/commit-formatter.js";
import { collectDiffContext } from "../git/diff.js";
import { getStagedFiles, isGitRepository, stageAllChanges } from "../git/status.js";
import { createPrompt } from "../prompt/builder.js";
import { omitUndefined } from "../utils/object.js";
import { applyMessageTemplate } from "../utils/template.js";

export interface GeneratedCommitBundle {
  config: CometConfig;
  context: GitDiffContext;
  generatedCommit: GeneratedCommit;
  formattedMessage: string;
  truncated: boolean;
}

const applyGeneratedOverrides = (
  commit: GeneratedCommit,
  overrides: RuntimeOverrides
): GeneratedCommit => ({
  ...commit,
  type: overrides.forcedType ?? commit.type,
  scope: overrides.forcedScope !== undefined ? overrides.forcedScope : commit.scope,
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

export const generateCommitBundle = async (
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
  const analysis = createCommitAnalysis(context);

  let generatedCommit: GeneratedCommit;
  let truncated = false;

  if (config.privacyMode === "local-only") {
    generatedCommit = createLocalFallbackCommit(analysis, context);
  } else {
    const provider = createProvider(config);
    const prompt = createPrompt(config, context, analysis);
    truncated = prompt.truncated;
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
  }

  const finalCommit = applyGeneratedOverrides(generatedCommit, overrides);
  const formattedMessage = applyMessageTemplate(
    config.messageTemplate,
    formatCommitMessage(finalCommit, config)
  );

  return {
    config,
    context,
    generatedCommit: finalCommit,
    formattedMessage,
    truncated,
  };
};

export const normalizeCommitType = (value: string): CommitType => value as CommitType;
