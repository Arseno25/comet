import * as p from "@clack/prompts";
import color from "yoctocolors";

const canUseClack = (): boolean => Boolean(process.stdout.isTTY && !process.env.CI);

const writeFallback = (method: "log" | "warn" | "error", label: string, message: string): void => {
  console[method](`${label} ${message}`);
};

export const logger = {
  info: (message: string): void =>
    canUseClack() ? p.log.info(message) : writeFallback("log", "[info]", message),
  step: (message: string): void =>
    canUseClack() ? p.log.step(message) : writeFallback("log", "[step]", message),
  success: (message: string): void =>
    canUseClack() ? p.log.success(message) : writeFallback("log", "[ok]", message),
  warn: (message: string): void =>
    canUseClack() ? p.log.warn(message) : writeFallback("warn", "[warn]", message),
  error: (message: string): void =>
    canUseClack() ? p.log.error(message) : writeFallback("error", "[error]", message),
  muted: (message: string): string => color.gray(message),
  accent: (message: string): string => color.cyan(message),
  danger: (message: string): string => color.red(message),
};
