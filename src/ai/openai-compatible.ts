import OpenAI from "openai";
import pRetry, { AbortError } from "p-retry";
import { generatedCommitSchema } from "../config/schema.js";
import type { GenerateCommitInput, GeneratedCommit } from "../domain/models.js";
import { extractJsonObject } from "../utils/json.js";

const MAX_RETRIES = 2;

const resolveTemperature = (regenerationAttempt = 0): number =>
  regenerationAttempt <= 0 ? 0.12 : Math.min(0.32, 0.12 + regenerationAttempt * 0.08);

const isRetriableProviderError = (error: unknown): boolean => {
  const status =
    typeof error === "object" && error !== null && "status" in error && typeof error.status === "number"
      ? error.status
      : null;

  if (status !== null) {
    return status === 408 || status === 429 || status >= 500;
  }

  const message = error instanceof Error ? error.message : String(error);
  return /timeout|temporar|rate limit|network|socket|ECONNRESET/i.test(message);
};

export class OpenAICompatibleProvider {
  async generateCommitMessage(input: GenerateCommitInput): Promise<GeneratedCommit> {
    if (!input.apiKey) {
      throw new Error("Missing API key. Configure COMET_API_KEY or use privacy mode local-only.");
    }

    if (input.baseUrl) {
      const parsed = (() => {
        try {
          return new URL(input.baseUrl);
        } catch {
          throw new Error(`Invalid baseUrl: "${input.baseUrl}".`);
        }
      })();

      const isLocal =
        parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1" || parsed.hostname === "::1";

      if (parsed.protocol !== "https:" && !isLocal) {
        throw new Error(
          `Refusing to send API key over insecure baseUrl "${input.baseUrl}". Use https or a loopback host.`
        );
      }
    }

    const client = new OpenAI({
      apiKey: input.apiKey,
      baseURL: input.baseUrl ?? undefined,
      defaultHeaders: input.customHeaders ?? undefined,
    });

    return pRetry(
      async () => {
        try {
        const response = await client.chat.completions.create({
          model: input.model,
          temperature: resolveTemperature(input.regenerationAttempt),
          max_completion_tokens: input.maxOutputTokens,
          messages: [
            {
              role: "system",
              content: input.prompt,
            },
            {
              role: "user",
              content: input.diff,
            },
          ],
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
          throw new AbortError("The provider returned an empty response.");
        }

        return generatedCommitSchema.parse(JSON.parse(extractJsonObject(content)));
      } catch (error) {
          if (!isRetriableProviderError(error)) {
            throw new AbortError(error instanceof Error ? error.message : String(error));
          }

          throw error;
        }
      },
      {
        retries: MAX_RETRIES,
        factor: 2,
        minTimeout: 250,
        maxTimeout: 1500,
      }
    );
  }
}
