import * as p from "@clack/prompts";
import { COMET_COLORS } from "./animations.js";

const canUseClack = (): boolean => Boolean(process.stdout.isTTY && !process.env.CI);

const writeFallback = (method: "log" | "warn" | "error", label: string, message: string): void => {
  console[method](`${label} ${message}`);
};

export const logger = {
  info: (message: string): void =>
    canUseClack() ? p.log.info(message) : writeFallback("log", "○", message),
  step: (message: string): void =>
    canUseClack() ? p.log.step(message) : writeFallback("log", "⋯", message),
  success: (message: string): void =>
    canUseClack() ? p.log.success(message) : writeFallback("log", "✓", message),
  warn: (message: string): void =>
    canUseClack() ? p.log.warn(message) : writeFallback("warn", "⚠", message),
  error: (message: string): void =>
    canUseClack() ? p.log.error(message) : writeFallback("error", "✕", message),
  muted: (message: string): string => COMET_COLORS.muted(message),
  accent: (message: string): string => COMET_COLORS.primary(message),
  danger: (message: string): string => COMET_COLORS.error(message),
};
