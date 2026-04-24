import type { CometConfig, GenerateCommitInput, GeneratedCommit } from "../domain/models.js";
import { OpenAICompatibleProvider } from "./openai-compatible.js";

export interface AIProvider {
  generateCommitMessage(input: GenerateCommitInput): Promise<GeneratedCommit>;
}

export const createProvider = (config: CometConfig): AIProvider => {
  if (config.provider === "openai" || config.provider === "openai-compatible") {
    return new OpenAICompatibleProvider();
  }

  throw new Error(`Unsupported provider "${config.provider}" in MVP.`);
};
