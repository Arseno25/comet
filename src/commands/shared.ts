import { Option } from "commander";
import type { Command } from "commander";
import { commitTypes, type RuntimeOverrides } from "../domain/models.js";
import { normalizeCommitType } from "../core/generate-commit.js";
import { omitUndefined } from "../utils/object.js";

export const addRuntimeOptions = (command: Command): Command =>
  command
    .addOption(new Option("--provider <provider>", "LLM provider"))
    .addOption(new Option("--model <model>", "LLM model"))
    .addOption(new Option("--base-url <url>", "OpenAI-compatible base URL"))
    .addOption(new Option("--lang <language>", "Output language"))
    .addOption(new Option("--intent <text>", "Explicitly describe the change intent"))
    .addOption(new Option("--type <type>", "Force commit type").choices([...commitTypes]))
    .addOption(new Option("--scope <scope>", "Force commit scope"))
    .addOption(new Option("--privacy-mode <mode>", "Privacy mode").choices(["standard", "strict", "local-only"]))
    .option("--emoji", "Enable emoji output")
    .option("--no-emoji", "Disable emoji output")
    .option("--description", "Enable commit body")
    .option("--no-description", "Disable commit body")
    .option("--one-line", "Force one-line commit")
    .option("--no-one-line", "Disable one-line commit")
    .option("--omit-scope", "Remove scope from output")
    .option("--no-omit-scope", "Keep scope in output")
    .option("--why", "Include why section")
    .option("--no-why", "Disable why section")
    .option("--push", "Push after commit")
    .option("--no-push", "Do not push after commit")
    .option("--preview", "Preview only")
    .option("--json", "Print machine-readable JSON output")
    .option("-y, --yes", "Accept generated message without prompt");

const pickValue = <T>(command: Command, key: string): T | undefined =>
  command.getOptionValueSource(key) ? (command.optsWithGlobals()[key] as T | undefined) : undefined;

export const collectRuntimeOverrides = (command: Command): RuntimeOverrides => {
  const typeValue = pickValue<string>(command, "type");

  return omitUndefined({
    provider: pickValue(command, "provider"),
    model: pickValue(command, "model"),
    baseUrl: pickValue(command, "baseUrl"),
    language: pickValue(command, "lang"),
    intent: pickValue(command, "intent"),
    emoji: pickValue(command, "emoji"),
    description: pickValue(command, "description"),
    oneLine: pickValue(command, "oneLine"),
    omitScope: pickValue(command, "omitScope"),
    why: pickValue(command, "why"),
    gitPush: pickValue(command, "push"),
    previewOnly: pickValue(command, "preview"),
    json: pickValue(command, "json"),
    autoAccept: pickValue(command, "yes"),
    forcedType: typeValue ? normalizeCommitType(typeValue) : undefined,
    forcedScope: pickValue(command, "scope"),
    privacyMode: pickValue(command, "privacyMode"),
  }) as RuntimeOverrides;
};
