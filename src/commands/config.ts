import type { Command } from "commander";
import { ensureGlobalConfigFile, maskConfigValue, readGlobalConfig, setGlobalConfigValue, unsetGlobalConfigValue } from "../config/loader.js";
import { configKeys, resolveConfigKeyName } from "../config/parser.js";
import { renderConfigPanel } from "../ui/panels.js";

export const registerConfigCommand = (program: Command): void => {
  const configCommand = program.command("config").description("Manage global Comet configuration");

  configCommand
    .command("set")
    .argument("<key>", "Config key")
    .argument("<value>", "Config value")
    .description("Set a global config value")
    .action(async (keyInput: string, value: string) => {
      const key = resolveConfigKeyName(keyInput);
      if (!key) {
        throw new Error(`Unknown config key "${keyInput}".`);
      }

      const filePath = await setGlobalConfigValue(key, value);
      console.log(`Updated ${key} in ${filePath}`);
    });

  configCommand
    .command("get")
    .argument("[key]", "Specific config key")
    .description("Get all config or a single config value")
    .action(async (keyInput?: string) => {
      const config = await readGlobalConfig();

      if (!keyInput) {
        const lines = configKeys.map((key) => `${key}: ${maskConfigValue(key, config[key])}`);
        console.log(renderConfigPanel("Global Config", lines));
        return;
      }

      const key = resolveConfigKeyName(keyInput);
      if (!key) {
        throw new Error(`Unknown config key "${keyInput}".`);
      }

      console.log(maskConfigValue(key, config[key]));
    });

  configCommand
    .command("unset")
    .argument("<key>", "Config key")
    .description("Remove a config value from the global config")
    .action(async (keyInput: string) => {
      const key = resolveConfigKeyName(keyInput);
      if (!key) {
        throw new Error(`Unknown config key "${keyInput}".`);
      }

      const filePath = await unsetGlobalConfigValue(key);
      console.log(`Removed ${key} from ${filePath}`);
    });

  configCommand
    .command("path")
    .description("Print the global config path")
    .action(async () => {
      console.log(await ensureGlobalConfigFile());
    });
};
