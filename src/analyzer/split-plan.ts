import type { CommitAnalysis, CometConfig, GitDiffContext, SemanticFileChange, SplitPlan, SplitPlanStep } from "../domain/models.js";
import { classifyCommitType } from "./type-classifier.js";
import { detectAreaForFile } from "./scope-detector.js";

interface StepSeed {
  id: string;
  area: string;
  variant: "main" | "format";
  files: string[];
  changes: SemanticFileChange[];
}

const unique = <T>(values: T[]): T[] => [...new Set(values)];

const buildStepId = (area: string, variant: StepSeed["variant"]): string =>
  variant === "format" ? `${area}-format` : area;

const buildStepTitle = (scope: string | null, variant: StepSeed["variant"], type: SplitPlanStep["suggestedType"]): string => {
  const subject = scope ?? "repo";
  if (variant === "format") {
    return `style(${subject}): isolate formatting cleanup`;
  }

  return `${type}(${subject}): commit ${subject} changes separately`;
};

const buildStepSummary = (seed: StepSeed): string => {
  const files = seed.files.length;
  const behavioral = seed.changes.filter((change) => change.changeType === "behavioral").length;
  const formatOnly = seed.changes.filter((change) => change.changeType === "format-only").length;

  if (seed.variant === "format") {
    return `Keep ${files} formatting-focused file${files === 1 ? "" : "s"} separate from logic changes.`;
  }

  if (behavioral > 0 && formatOnly > 0) {
    return `This group concentrates ${seed.area} behavior changes while keeping formatting noise limited.`;
  }

  return `This group isolates ${seed.area} work across ${files} file${files === 1 ? "" : "s"}.`;
};

const buildStepRationale = (seed: StepSeed, type: SplitPlanStep["suggestedType"]): string[] => {
  const rationale = [`${seed.files.length} file${seed.files.length === 1 ? "" : "s"} map to the "${seed.area}" area.`];

  if (seed.variant === "format") {
    rationale.push("Formatting-only edits are easier to review when committed on their own.");
  } else {
    rationale.push(`Suggested type "${type}" matches the dominant files in this group.`);
  }

  const changeKinds = unique(seed.changes.map((change) => change.changeType));
  rationale.push(`Detected semantic change kinds: ${changeKinds.join(", ")}.`);

  return rationale;
};

const createSeeds = (context: GitDiffContext, config: CometConfig): StepSeed[] => {
  const seedMap = new Map<string, StepSeed>();
  const semanticChangeMap = new Map(
    context.semanticChanges.map((change) => [change.file, change] as const)
  );
  const semanticChanges = context.files.map<SemanticFileChange>((file) =>
    semanticChangeMap.get(file) ?? {
        file,
        previousFile: null,
        changeType: "mixed",
        additions: 0,
        deletions: 0,
        summaryLines: [],
      }
  );

  const hasBehavioralInArea = new Set(
    semanticChanges
      .filter((change) => change.changeType !== "format-only")
      .map((change) => detectAreaForFile(change.file, config.policyScopeMap))
  );

  for (const change of semanticChanges) {
    const area = detectAreaForFile(change.file, config.policyScopeMap);
    const variant: StepSeed["variant"] =
      change.changeType === "format-only" && hasBehavioralInArea.has(area) ? "format" : "main";
    const id = buildStepId(area, variant);
    const existing = seedMap.get(id);

    if (existing) {
      existing.files.push(change.file);
      existing.changes.push(change);
      continue;
    }

    seedMap.set(id, {
      id,
      area,
      variant,
      files: [change.file],
      changes: [change],
    });
  }

  return [...seedMap.values()].map((seed) => ({
    ...seed,
    files: unique(seed.files),
  }));
};

const toSplitPlanStep = (seed: StepSeed, config: CometConfig): SplitPlanStep => {
  const files = unique(seed.files);
  const type = seed.variant === "format"
    ? "style"
    : classifyCommitType(
        files,
        seed.changes.flatMap((change) => change.summaryLines).join(" "),
        seed.changes,
        config.policyAllowedTypes
      );
  const scope = seed.area === "repo" ? null : seed.area;

  return {
    id: seed.id,
    title: buildStepTitle(scope, seed.variant, type),
    summary: buildStepSummary(seed),
    rationale: buildStepRationale(seed, type),
    files,
    suggestedType: type,
    suggestedScope: scope,
  };
};

const detectPlanConfidence = (analysis: CommitAnalysis, steps: SplitPlanStep[]): SplitPlan["confidence"] => {
  if (steps.length >= 3 || analysis.confidence === "low") {
    return "high";
  }

  if (steps.length === 2) {
    return "medium";
  }

  return "low";
};

export const createSplitPlan = (context: GitDiffContext, analysis: CommitAnalysis, config: CometConfig): SplitPlan => {
  const steps = createSeeds(context, config)
    .map((seed) => toSplitPlanStep(seed, config))
    .sort((left, right) => right.files.length - left.files.length);

  if (steps.length <= 1) {
    return {
      recommended: false,
      reason: "The staged diff looks focused enough for a single commit.",
      confidence: "low",
      steps,
    };
  }

  const reason =
    analysis.changedAreas.length > 1
      ? `Detected ${analysis.changedAreas.length} distinct areas in one staged diff.`
      : "Formatting and behavioral edits are mixed in the same staged diff.";

  return {
    recommended: true,
    reason,
    confidence: detectPlanConfidence(analysis, steps),
    steps,
  };
};
