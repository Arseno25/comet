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

      const privacyMode = provider === "local-only" ? "local-only" : "standard";

      await setManyGlobalConfigValues([
        { key: "provider", value: provider === "local-only" ? "openai" : provider },
        { key: "model", value: model },
        { key: "baseUrl", value: baseUrl },
        { key: "apiKey", value: apiKey },
        { key: "language", value: language },
        { key: "emoji", value: String(emoji) },
        { key: "description", value: String(description) },
        { key: "privacyMode", value: privacyMode },
      ]);

      logger.success("Global config initialized.");
    });
};
