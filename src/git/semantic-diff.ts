import type { SemanticChangeType, SemanticFileChange } from "../domain/models.js";

const DIFF_SEPARATOR = /^diff --git /m;

const normalizeForComparison = (value: string): string => value.replace(/\s+/g, "");

const summarizeLine = (value: string): string => {
  const trimmed = value.trim();
  if (trimmed.length <= 96) {
    return trimmed;
  }

  return `${trimmed.slice(0, 93)}...`;
};

const detectChangeType = (
  additions: string[],
  deletions: string[],
  hasRename: boolean
): SemanticChangeType => {
  const meaningfulAdditions = additions.map(normalizeForComparison).filter(Boolean);
  const meaningfulDeletions = deletions.map(normalizeForComparison).filter(Boolean);

  if (hasRename && meaningfulAdditions.length === 0 && meaningfulDeletions.length === 0) {
    return "rename-only";
  }

  if (meaningfulAdditions.length === 0 && meaningfulDeletions.length > 0) {
    return "deletion-only";
  }

  if (meaningfulAdditions.length > 0 && meaningfulDeletions.length === 0) {
    return "addition-only";
  }

  if (
    meaningfulAdditions.length > 0 &&
    meaningfulAdditions.length === meaningfulDeletions.length &&
    meaningfulAdditions.every((line, index) => line === meaningfulDeletions[index])
  ) {
    return "format-only";
  }

  if (meaningfulAdditions.length === 0 && meaningfulDeletions.length === 0) {
    return "mixed";
  }

  return "behavioral";
};

const formatSemanticSummary = (change: SemanticFileChange): string => {
  const summaryBits = [
    `${change.file}`,
    `type=${change.changeType}`,
    `+${change.additions}`,
    `-${change.deletions}`,
  ];

  if (change.previousFile) {
    summaryBits.push(`from=${change.previousFile}`);
  }

  if (change.summaryLines.length === 0) {
    return `- ${summaryBits.join(" ")}`;
  }

  return [`- ${summaryBits.join(" ")}`, ...change.summaryLines.map((line) => `  • ${line}`)].join("\n");
};

const parseSection = (section: string): SemanticFileChange | null => {
  const lines = section.split("\n");
  const header = lines[0];
  if (!header) {
    return null;
  }
  const headerMatch = header.match(/^diff --git a\/(.+?) b\/(.+)$/);
  if (!headerMatch) {
    return null;
  }

  const currentFile = headerMatch[2] ?? null;
  if (!currentFile) {
    return null;
  }

  const previousFile = headerMatch[1] === currentFile ? null : (headerMatch[1] ?? null);
  let file = currentFile;
  let renameFrom: string | null = null;
  let renameTo: string | null = null;
  const additions: string[] = [];
  const deletions: string[] = [];

  for (const line of lines.slice(1)) {
    if (line.startsWith("rename from ")) {
      renameFrom = line.slice("rename from ".length).trim();
      continue;
    }

    if (line.startsWith("rename to ")) {
      renameTo = line.slice("rename to ".length).trim();
      file = renameTo;
      continue;
    }

    if (line.startsWith("+++ ") || line.startsWith("--- ") || line.startsWith("@@")) {
      continue;
    }

    if (line.startsWith("+")) {
      additions.push(line.slice(1));
      continue;
    }

    if (line.startsWith("-")) {
      deletions.push(line.slice(1));
    }
  }

  const changeType = detectChangeType(additions, deletions, Boolean(renameFrom && renameTo));
  const summaryLines = [...additions.slice(0, 2), ...deletions.slice(0, 2)]
    .map(summarizeLine)
    .filter((line): line is string => Boolean(line))
    .slice(0, 3);

  return {
    file,
    previousFile: renameFrom ?? previousFile,
    changeType,
    additions: additions.length,
    deletions: deletions.length,
    summaryLines,
  };
};

export const parseSemanticDiff = (rawDiff: string): SemanticFileChange[] => {
  if (!rawDiff.trim()) {
    return [];
  }

  const sections = rawDiff
    .split(DIFF_SEPARATOR)
    .map((section, index) => (index === 0 ? section : `diff --git ${section}`))
    .filter((section) => section.startsWith("diff --git "));

  return sections
    .map(parseSection)
    .filter((section): section is SemanticFileChange => section !== null);
};

export const renderSemanticDiff = (changes: SemanticFileChange[]): string => {
  if (changes.length === 0) {
    return "No semantic diff details were available.";
  }

  return changes.map(formatSemanticSummary).join("\n");
};
