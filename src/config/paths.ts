import { homedir } from "node:os";
import path from "node:path";

export const getCometDirectoryPath = (): string => path.join(homedir(), ".comet");

export const getGlobalConfigPath = (): string =>
  path.join(getCometDirectoryPath(), "config.env");

export const projectConfigCandidates = [".comet.env", ".cometrc", ".cometrc.json"];
