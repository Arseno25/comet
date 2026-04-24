import type { Command } from "commander";
import { existsSync } from "node:fs";
import path from "node:path";
import { loadConfig } from "../config/loader.js";
import { getGlobalConfigPath } from "../config/paths.js";
import { getStagedFiles, isGitRepository } from "../git/status.js";
import { renderConfigPanel } from "../ui/panels.js";

const statusIcon = (status: "ok" | "warn" | "info" | "fail"): string =>
  ({
    ok: "OK",
    warn: "WARN",
    info: "INFO",
    fail: "FAIL",
  })[status];

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
  program
    .command("doctor")
    .description("Inspect Comet config, runtime environment, and Git readiness")
    .action(async () => {
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
        `${statusIcon("ok")} global config: ${globalConfigPath}`,
        `${statusIcon(projectConfigPath ? "ok" : "info")} project config: ${projectConfigPath ?? "[none]"}`,
        `${statusIcon("ok")} provider: ${config.provider}`,
        `${statusIcon("ok")} model: ${config.model}`,
        `${statusIcon(hasBaseUrl ? "ok" : "fail")} baseUrl: ${config.baseUrl ?? "[default]"}`,
        `${statusIcon(hasApiKey ? "ok" : "fail")} apiKey: ${maskValue(config.apiKey)}`,
        `${statusIcon("ok")} privacyMode: ${config.privacyMode}`,
        `${statusIcon("ok")} language: ${config.language}`,
      ];

      const gitLines = [
        `${statusIcon(inGitRepository ? "ok" : "fail")} git repository: ${inGitRepository ? "yes" : "no"}`,
        `${statusIcon(!inGitRepository ? "info" : stagedFiles.length > 0 ? "ok" : "warn")} staged files: ${inGitRepository ? String(stagedFiles.length) : "[n/a]"}`,
        `${statusIcon(stageAllReady ? "ok" : "warn")} stageAll readiness: ${config.stageAll ? "enabled" : "disabled"}`,
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
          return `${statusIcon(rawValue ? "ok" : "info")} ${envKey}: ${rawValue ? "[configured]" : "[not set]"}`;
        }

        return `${statusIcon(rawValue ? "ok" : "info")} ${envKey}: ${rawValue ?? "[not set]"}`;
      });

      console.log(renderConfigPanel("Doctor / Config", configLines));
      console.log(renderConfigPanel("Doctor / Git", gitLines));
      console.log(renderConfigPanel("Doctor / Env Override", overrideLines));
    });
};
