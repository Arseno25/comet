import * as p from "@clack/prompts";
import type { Command } from "commander";
import { ensureGlobalConfigFile, setManyGlobalConfigValues } from "../config/loader.js";
import { logger } from "../ui/logger.js";

export const registerInitCommand = (program: Command): void => {
  program
    .command("init")
    .description("Create the global Comet config with interactive prompts")
    .action(async () => {
      await ensureGlobalConfigFile();

      const provider = await p.select({
        message: "Select provider",
        options: [
          { value: "openai", label: "openai" },
          { value: "openai-compatible", label: "openai-compatible" },
          { value: "local-only", label: "local-only" },
        ],
      });
      if (p.isCancel(provider)) {
        p.cancel("Init cancelled.");
        process.exit(0);
      }

      const model = await p.text({
        message: "Model",
        initialValue: provider === "local-only" ? "local-fallback" : "gpt-4o-mini",
      });
      if (p.isCancel(model)) {
        p.cancel("Init cancelled.");
        process.exit(0);
      }

      const baseUrl = await p.text({
        message: "Base URL",
        placeholder: "https://api.openai.com/v1",
      });
      if (p.isCancel(baseUrl)) {
        p.cancel("Init cancelled.");
        process.exit(0);
      }

      const apiKey = await p.password({
        message: "API key",
        mask: "*",
      });
      if (p.isCancel(apiKey)) {
        p.cancel("Init cancelled.");
        process.exit(0);
      }

      const language = await p.text({
        message: "Language",
        initialValue: "en",
      });
      if (p.isCancel(language)) {
        p.cancel("Init cancelled.");
        process.exit(0);
      }

      const emoji = await p.confirm({
        message: "Use emoji?",
        initialValue: false,
      });
      if (p.isCancel(emoji)) {
        p.cancel("Init cancelled.");
        process.exit(0);
      }

      const description = await p.confirm({
        message: "Use description/body?",
        initialValue: true,
      });
      if (p.isCancel(description)) {
        p.cancel("Init cancelled.");
        process.exit(0);
      }

      const gitPush = await p.confirm({
        message: "Enable git push by default?",
        initialValue: false,
      });
      if (p.isCancel(gitPush)) {
        p.cancel("Init cancelled.");
        process.exit(0);
      }

      const uiMode = await p.select({
        message: "Default UI mode",
        options: [
          { value: "minimal", label: "minimal", hint: "fast default flow" },
          { value: "standard", label: "standard", hint: "show copilot insights" },
          { value: "full", label: "full", hint: "show all panels" },
        ],
        initialValue: "minimal",
      });
      if (p.isCancel(uiMode)) {
        p.cancel("Init cancelled.");
        process.exit(0);
      }

      const showCopilot = await p.confirm({
        message: "Always show Copilot panel?",
        initialValue: uiMode !== "minimal",
      });
      if (p.isCancel(showCopilot)) {
        p.cancel("Init cancelled.");
        process.exit(0);
      }

      const showSplitPlan = await p.confirm({
        message: "Always show Split Plan when available?",
        initialValue: uiMode !== "minimal",
      });
      if (p.isCancel(showSplitPlan)) {
        p.cancel("Init cancelled.");
        process.exit(0);
      }

      const allowSplitSuggestions = await p.confirm({
        message: "Enable split suggestions?",
        initialValue: true,
      });
      if (p.isCancel(allowSplitSuggestions)) {
        p.cancel("Init cancelled.");
        process.exit(0);
      }

      const allowSplitExecution = await p.confirm({
        message: "Enable interactive split execution?",
        initialValue: true,
      });
      if (p.isCancel(allowSplitExecution)) {
        p.cancel("Init cancelled.");
        process.exit(0);
      }

      const showSafeSend = await p.confirm({
        message: "Show Safe Send panel by default?",
        initialValue: uiMode === "full",
      });
      if (p.isCancel(showSafeSend)) {
        p.cancel("Init cancelled.");
        process.exit(0);
      }

      const showAnalysis = await p.confirm({
        message: "Show Analysis panel by default?",
        initialValue: uiMode === "full",
      });
      if (p.isCancel(showAnalysis)) {
        p.cancel("Init cancelled.");
        process.exit(0);
      }

      const showQuality = await p.confirm({
        message: "Show Quality panel by default?",
        initialValue: uiMode === "full",
      });
      if (p.isCancel(showQuality)) {
        p.cancel("Init cancelled.");
        process.exit(0);
      }

      const showWarnings = await p.confirm({
        message: "Show Warnings panel by default?",
        initialValue: uiMode === "full",
      });
      if (p.isCancel(showWarnings)) {
        p.cancel("Init cancelled.");
        process.exit(0);
      }

      const privacyMode = provider === "local-only" ? "local-only" : "standard";

      await setManyGlobalConfigValues([
        { key: "provider", value: provider === "local-only" ? "openai" : provider },
        { key: "model", value: model },
        { key: "baseUrl", value: baseUrl },
        { key: "apiKey", value: apiKey },
        { key: "language", value: language },
        { key: "uiMode", value: uiMode },
        { key: "emoji", value: String(emoji) },
        { key: "description", value: String(description) },
        { key: "gitPush", value: String(gitPush) },
        { key: "privacyMode", value: privacyMode },
        { key: "showCopilot", value: String(showCopilot) },
        { key: "showSplitPlan", value: String(showSplitPlan) },
        { key: "showSafeSend", value: String(showSafeSend) },
        { key: "showAnalysis", value: String(showAnalysis) },
        { key: "showQuality", value: String(showQuality) },
        { key: "showWarnings", value: String(showWarnings) },
        { key: "allowSplitSuggestions", value: String(allowSplitSuggestions) },
        { key: "allowSplitExecution", value: String(allowSplitExecution) },
      ]);

      logger.success("Global config initialized.");
    });
};
