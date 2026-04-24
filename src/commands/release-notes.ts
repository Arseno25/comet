import type { Command } from "commander";
import color from "yoctocolors";
import { execa } from "execa";
import { COMET_COLORS, COMET_ICONS } from "../ui/animations.js";
import { renderConfigPanel, renderList } from "../ui/panels.js";
import { printJson } from "../utils/output.js";

interface CommitInfo {
  hash: string;
  author: string;
  date: string;
  message: string;
}

interface ReleaseNoteData {
  version?: string;
  tag?: string;
  commits: CommitInfo[];
  stats: {
    total: number;
    byType: Record<string, number>;
    contributors: string[];
  };
}

const getCommitsInRange = async (
  from: string,
  to = "HEAD",
  cwd = process.cwd()
): Promise<CommitInfo[]> => {
  const range = `${from}..${to}`;
  const { stdout } = await execa(
    "git",
    ["log", "--pretty=%H|%an|%ad|%s", "--date=short", range],
    { cwd }
  );

  const lines = stdout.split("\n").filter(Boolean);
  const commits: CommitInfo[] = [];

  for (const line of lines) {
    const parts = line.split("|");
    const hash = parts[0]?.slice(0, 7) ?? "";
    const author = parts[1] ?? "";
    const date = parts[2] ?? "";
    const message = parts.slice(3).join("|").trim();

    commits.push({
      hash,
      author,
      date,
      message,
    });
  }

  return commits;
};

const categorizeCommit = (message: string): string => {
  const match = message.match(/^(\w+)(?:\([^)]+\))?:/);
  return match?.[1]?.toLowerCase() ?? "other";
};

const getStats = (commits: CommitInfo[]) => {
  const byType: Record<string, number> = {};
  const contributors = new Set<string>();

  for (const commit of commits) {
    const type = categorizeCommit(commit.message);
    byType[type] = (byType[type] || 0) + 1;
    contributors.add(commit.author);
  }

  return {
    total: commits.length,
    byType,
    contributors: Array.from(contributors).sort(),
  };
};

const formatReleaseNotes = (
  data: ReleaseNoteData,
  previousTag?: string
): string => {
  const panels: string[] = [];

  const { stats, commits } = data;

  panels.push(
    renderConfigPanel("Release / Summary", [
      COMET_COLORS.bold(data.version || "Release Notes"),
      ...(previousTag ? [COMET_COLORS.dim(`Range ${previousTag} → ${data.tag || "HEAD"}`)] : []),
      "",
      `${COMET_ICONS.success} ${stats.total} commits`,
      `${COMET_ICONS.info} ${stats.contributors.length} contributors`,
    ])
  );

  if (Object.keys(stats.byType).length > 0) {
    panels.push(
      renderConfigPanel(
        "Release / Types",
        renderList(
          Object.entries(stats.byType)
            .sort((a, b) => b[1] - a[1])
            .map(([type, count]) => `${type}: ${count}`),
          "accent"
        )
      )
    );
  }

  panels.push(
    renderConfigPanel(
      "Release / Contributors",
      renderList(stats.contributors.map((contributor) => COMET_COLORS.accent(contributor)), "success")
    )
  );

  const groupedByType: Record<string, CommitInfo[]> = {};
  for (const commit of commits) {
    const type = categorizeCommit(commit.message);
    if (!groupedByType[type]) groupedByType[type] = [];
    groupedByType[type].push(commit);
  }

  const typeLabels: Record<string, string> = {
    feat: `Features ${COMET_ICONS.success}`,
    fix: `Bug Fixes ${COMET_ICONS.error}`,
    docs: `Documentation ${COMET_ICONS.info}`,
    refactor: `Refactoring ${COMET_ICONS.loading}`,
    perf: `Performance ${COMET_ICONS.warning}`,
    test: "Tests",
    build: "Build",
    ci: "CI",
    chore: "Chore",
    style: "Style",
  };

  for (const [type, typeCommits] of Object.entries(groupedByType).sort(
    (a, b) => b[1].length - a[1].length
  )) {
    if (typeCommits.length === 0) continue;
    panels.push(
      renderConfigPanel(
        `Release / ${typeLabels[type] || type}`,
        renderList(
          typeCommits.map((commit) => {
            const cleanMessage = commit.message.replace(/^[\w]+(\([^)]+\))?:\s*/, "");
            return `${cleanMessage} (${COMET_COLORS.muted(commit.hash)}) - ${COMET_COLORS.dim(commit.author)}`;
          })
        )
      )
    );
  }

  return panels.join("\n");
};

export const registerReleaseNotesCommand = (program: Command): void => {
  program
    .command("release-notes")
    .description("Generate release notes from commit range")
    .argument("<from>", "Starting ref (tag, branch, or commit)")
    .option("--to <ref>", "Ending ref (default: HEAD)", "HEAD")
    .option("--version <version>", "Release version")
    .option("--tag <tag>", "Release tag")
    .option("--json", "Output as JSON")
    .action(async (from, options) => {
      try {
        const commits = await getCommitsInRange(from, options.to);
        const stats = getStats(commits);

        const data: ReleaseNoteData = {
          version: options.version,
          tag: options.tag,
          commits,
          stats,
        };

        if (options.json) {
          printJson(data);
        } else {
          const notes = formatReleaseNotes(data, from);
          console.log(notes);
        }
      } catch (error) {
        console.error(color.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
        process.exit(1);
      }
    });
};
