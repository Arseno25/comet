import { z } from "zod";
import { commitTypes } from "../domain/models.js";

const headersSchema = z.record(z.string(), z.string()).nullable();

export const configSchema = z.object({
  provider: z.string().min(1),
  model: z.string().min(1),
  baseUrl: z.string().url().nullable().or(z.literal("")).transform((value) => value || null),
  apiKey: z.string().nullable(),
  customHeaders: headersSchema,
  promptModule: z.string().min(1),
  language: z.string().min(2),
  description: z.boolean(),
  emoji: z.boolean(),
  oneLine: z.boolean(),
  omitScope: z.boolean(),
  why: z.boolean(),
  messageTemplate: z.string().min(1),
  maxInputTokens: z.number().int().positive(),
  maxOutputTokens: z.number().int().positive(),
  autoCommit: z.boolean(),
  gitPush: z.boolean(),
  stageAll: z.boolean(),
  redactSecrets: z.boolean(),
  privacyMode: z.enum(["standard", "strict", "local-only"]),
  excludeFiles: z.array(z.string()).default([]),
  policyAllowedTypes: z.array(z.enum(commitTypes)).default([...commitTypes]),
  policyRequireIssueKey: z.boolean().default(false),
  issueKeyPattern: z.string().min(1).default("[A-Z][A-Z0-9]+-\\d+"),
  policyScopeMap: z.record(z.string(), z.string()).nullable().default(null),
  showSafeSend: z.boolean().default(false),
  showAnalysis: z.boolean().default(false),
  showQuality: z.boolean().default(false),
  showWarnings: z.boolean().default(false),
  verbose: z.boolean().default(false),
});

export const generatedCommitSchema = z.object({
  type: z.enum(commitTypes),
  scope: z.string().trim().min(1).nullable().catch(null),
  subject: z.string().trim().min(1),
  body: z.array(z.string().trim().min(1)).default([]),
  breaking: z.boolean().default(false),
  breakingDescription: z.string().trim().min(1).nullable().catch(null),
  why: z.string().trim().min(1).nullable().catch(null),
  issueKey: z.string().trim().min(1).nullable().catch(null).default(null),
});
