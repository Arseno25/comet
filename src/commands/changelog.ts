import type { Command } from "commander";
import color from "yoctocolors";
import { execa } from "execa";
import { COMET_COLORS, COMET_ICONS } from "../ui/animations.js";
import { renderConfigPanel, renderList } from "../ui/panels.js";
import { printJson } from "../utils/output.js";

interface CommitLogEntry {
  hash: string;
  type: string;
  scope?: string | undefined;
  subject: string;
  body?: string | undefined;
}

const parseConventionalCommit = (message: string): CommitLogEntry | null => {
  const conventionalRegex = /^(\w+)(?:\(([^)]+)\))?\s*:\s*(.+)$/i;
  const match = message.match(conventionalRegex);

  if (!match) {
    return null;
  }

  const [, rawType, rawScope, rawSubject] = match;
  return {
    hash: "",
    type: (rawType ?? "chore").toLowerCase(),
    scope: rawScope?.trim(),
    subject: (rawSubject ?? "").trim(),
  };
};

const getCommitLog = async (from = "", to = "HEAD", cwd = process.cwd()): Promise<CommitLogEntry[]> => {
  const range = from ? `${from}..${to}` : to;
  const { stdout } = await execa("git", ["log", "--pretty=%H|%s|%b", range], { cwd });

  const entries: CommitLogEntry[] = [];
  const lines = stdout.split("\n").filter(Boolean);

  for (const line of lines) {
    const parts = line.split("|");
    const hash = parts[0]?.slice(0, 7) ?? "";
    const subject = parts[1]?.trim() ?? "";
    const body = parts[2]?.trim();

    const parsed = parseConventionalCommit(subject);

    if (parsed) {
      entries.push({ ...parsed, hash, body });
    } else {
      entries.push({
        hash,
        type: "chore",
        subject,
        body,
      });
    }
  }

  return entries;
};

const groupByType = (entries: CommitLogEntry[]): Record<string, CommitLogEntry[]> => {
  const groups: Record<string, CommitLogEntry[]> = {
    feat: [],
    fix: [],
    docs: [],
    refactor: [],
    perf: [],
    test: [],
    build: [],
    ci: [],
    chore: [],
    style: [],
    revert: [],
  };

  for (const entry of entries) {
    const type = entry.type in groups ? entry.type : "chore";
    (groups[type] ?? []).push(entry);
  }

  return groups;
};

const formatChangelog = (entries: CommitLogEntry[], version?: string): string => {
  const groups = groupByType(entries);
  const panels: string[] = [];

  if (version) {
    panels.push(renderConfigPanel("Changelog / Version", [COMET_COLORS.bold(version)]));
  }

  const typeLabels: Record<string, string> = {
    feat: `${COMET_ICONS.success} Features`,
    fix: `${COMET_ICONS.error} Bug Fixes`,
    docs: `${COMET_ICONS.info} Documentation`,
    refactor: `${COMET_ICONS.loading} Refactoring`,
    perf: `${COMET_ICONS.warning} Performance`,
    test: "Tests",
    build: "Build",
    ci: "CI",
    chore: "Chore",
    style: "Style",
    revert: "Revert",
  };

  for (const [type, items] of Object.entries(groups)) {
    if (items.length === 0) continue;
    panels.push(
      renderConfigPanel(`Changelog / ${typeLabels[type] || type}`, renderList(items.map((item) => {
        const scopePrefix = item.scope ? `${COMET_COLORS.accent(item.scope)}: ` : "";
        return `${scopePrefix}${item.subject} (${COMET_COLORS.muted(item.hash)})`;
      })))
    );
  }

  return panels.join("\n");
};

export const registerChangelogCommand = (program: Command): void => {
  program
    .command("changelog")
    .description("Generate changelog from commit history")
    .option("--from <ref>", "Starting ref (e.g., v1.0.0, main~10)")
    .option("--to <ref>", "Ending ref (default: HEAD)", "HEAD")
    .option("--json", "Output as JSON")
    .option("--version <version>", "Version header for changelog")
    .action(async (options) => {
      try {
        const entries = await getCommitLog(options.from, options.to);

        if (options.json) {
          const grouped = groupByType(entries);
          printJson({ version: options.version, entries, grouped });
        } else {
          const changelog = formatChangelog(entries, options.version);
          console.log(changelog);
        }
      } catch (error) {
        console.error(color.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
        process.exit(1);
      }
    });
};
