import { COMET_COLORS, COMET_ICONS } from "./animations.js";

const write = (
  method: "log" | "warn" | "error",
  label: string,
  message: string,
  colorize: (text: string) => string
): void => {
  console[method](`${colorize(label)} ${message}`);
};

export const logger = {
  info: (message: string): void =>
    write("log", COMET_ICONS.info, message, COMET_COLORS.secondary),
  step: (message: string): void =>
    write("log", COMET_ICONS.loading, message, COMET_COLORS.primary),
  success: (message: string): void =>
    write("log", COMET_ICONS.success, message, COMET_COLORS.success),
  warn: (message: string): void =>
    write("warn", COMET_ICONS.warning, message, COMET_COLORS.warning),
  error: (message: string): void =>
    write("error", COMET_ICONS.error, message, COMET_COLORS.error),
  muted: (message: string): string => COMET_COLORS.muted(message),
  accent: (message: string): string => COMET_COLORS.primary(message),
  danger: (message: string): string => COMET_COLORS.error(message),
};
