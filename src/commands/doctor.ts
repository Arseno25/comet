import type { Command } from "commander";
import { existsSync } from "node:fs";
import path from "node:path";
import { loadConfig } from "../config/loader.js";
import { getGlobalConfigPath } from "../config/paths.js";
import { getStagedFiles, isGitRepository } from "../git/status.js";
import { renderConfigPanel, renderStatusRow } from "../ui/panels.js";
import { printJson } from "../utils/output.js";

const maskValue = (value: string | null): string => (value ? "[configured]" : "[empty]");

const getProjectConfigPath = (): string | null => {
  for (const fileName of [".comet.env", ".cometrc", ".cometrc.json"]) {
    const candidate = path.join(process.cwd(), fileName);
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
};

export const registerDoctorCommand = (program: Command): void => {
  const doctorCommand = program
    .command("doctor")
    .description("Inspect Comet config, runtime environment, and Git readiness")
    .option("--json", "Print machine-readable JSON output");

  doctorCommand.action(async () => {
      const options = {
        json: process.argv.includes("--json"),
      };
      const config = await loadConfig();
      const inGitRepository = await isGitRepository();
      const stagedFiles = inGitRepository ? await getStagedFiles() : [];
      const hasApiKey = config.privacyMode === "local-only" || Boolean(config.apiKey);
      const hasBaseUrl =
        config.provider === "openai" ? true : Boolean(config.baseUrl);
      const globalConfigPath = getGlobalConfigPath();
      const projectConfigPath = getProjectConfigPath();
      const stageAllReady = !inGitRepository ? false : stagedFiles.length > 0 || config.stageAll;

      const configLines = [
        renderStatusRow("ok", "global config", globalConfigPath),
        renderStatusRow(projectConfigPath ? "ok" : "info", "project config", projectConfigPath ?? "[none]"),
        renderStatusRow("ok", "provider", config.provider),
        renderStatusRow("ok", "model", config.model),
        renderStatusRow(hasBaseUrl ? "ok" : "fail", "baseUrl", config.baseUrl ?? "[default]"),
        renderStatusRow(hasApiKey ? "ok" : "fail", "apiKey", maskValue(config.apiKey)),
        renderStatusRow("ok", "privacyMode", config.privacyMode),
        renderStatusRow("ok", "language", config.language),
      ];

      const gitLines = [
        renderStatusRow(inGitRepository ? "ok" : "fail", "git repository", inGitRepository ? "yes" : "no"),
        renderStatusRow(
          !inGitRepository ? "info" : stagedFiles.length > 0 ? "ok" : "warn",
          "staged files",
          inGitRepository ? String(stagedFiles.length) : "[n/a]"
        ),
        renderStatusRow(stageAllReady ? "ok" : "warn", "stageAll", config.stageAll ? "enabled" : "disabled"),
      ];

      const overrideKeys = [
        "provider",
        "model",
        "baseUrl",
        "apiKey",
        "language",
        "emoji",
        "description",
        "oneLine",
        "omitScope",
        "why",
        "gitPush",
        "privacyMode",
      ] as const;

      const overrideLines = overrideKeys.map((keyName) => {
        const envKey = `COMET_${keyName.replace(/[A-Z]/g, (char) => `_${char}`).toUpperCase()}`;
        const rawValue = process.env[envKey];

        if (envKey === "COMET_API_KEY") {
          return renderStatusRow(rawValue ? "ok" : "info", envKey, rawValue ? "[configured]" : "[not set]");
        }

        return renderStatusRow(rawValue ? "ok" : "info", envKey, rawValue ?? "[not set]");
      });

      if (options.json) {
        printJson({
          config: {
            globalConfigPath,
            projectConfigPath,
            provider: config.provider,
            model: config.model,
            baseUrl: config.baseUrl,
            apiKeyConfigured: hasApiKey,
            privacyMode: config.privacyMode,
            language: config.language,
          },
          git: {
            inGitRepository,
            stagedFiles,
            stageAllReady,
          },
          overrides: overrideKeys.reduce<Record<string, string | null>>((result, keyName) => {
            const envKey = `COMET_${keyName.replace(/[A-Z]/g, (char) => `_${char}`).toUpperCase()}`;
            result[envKey] = envKey === "COMET_API_KEY" ? (process.env[envKey] ? "[configured]" : null) : process.env[envKey] ?? null;
            return result;
          }, {}),
        });
        return;
      }

      console.log(renderConfigPanel("Doctor / Config", configLines));
      console.log(renderConfigPanel("Doctor / Git", gitLines));
      console.log(renderConfigPanel("Doctor / Env Override", overrideLines));
    });
};
