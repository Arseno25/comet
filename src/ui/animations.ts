import gradient from "gradient-string";
import logUpdate from "log-update";
import ora, { type Ora } from "ora";
import color from "yoctocolors";

const COMET_GRADIENT_STOPS = ["#06b6d4", "#8b5cf6", "#f472b6"];
const OUTRO_DELAY_MS = 38;
const OUTRO_STEPS = 16;

const cometGradient = gradient(COMET_GRADIENT_STOPS);

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const getTerminalWidth = (): number =>
  Math.max(40, Math.min(process.stdout.columns ?? 80, 120));

export const cometIntro = (): void => {
  if (!process.stdout.isTTY) {
    console.log(`${color.cyan("☄")} ${color.bold("Comet")}`);
    return;
  }

  const corner = color.dim("┌");
  const pipe = color.dim("│");
  const title = cometGradient("☄ Comet");

  console.log("");
  console.log(`${corner} ${color.bold(title)}`);
  console.log(pipe);
};

export interface CometSpinner {
  start(message: string): void;
  update(message: string): void;
  succeed(message: string): void;
  fail(message: string): void;
  stop(message?: string, success?: boolean): void;
}

export const createCometSpinner = (): CometSpinner => {
  let instance: Ora | null = null;

  const ensure = (message: string): Ora => {
    instance ??= ora({
      text: color.bold(cometGradient(message)),
      spinner: "dots",
      color: "cyan",
      hideCursor: true,
    });
    return instance;
  };

  const finalize = (message: string, success: boolean): void => {
    const symbol = success ? color.green("✦") : color.red("✕");
    const text = message ? color.bold(message) : "";

    if (!instance) {
      if (message) console.log(`${symbol} ${text}`);
      return;
    }

    instance.stopAndPersist({ symbol, text });
    instance = null;
  };

  return {
    start: (message) => {
      if (!process.stdout.isTTY) {
        console.log(`${color.cyan("•")} ${color.dim(message)}`);
        return;
      }
      ensure(message).start();
    },
    update: (message) => {
      if (instance) instance.text = color.bold(cometGradient(message));
    },
    succeed: (message) => {
      if (!process.stdout.isTTY) {
        console.log(`${color.green("✦")} ${message}`);
        instance = null;
        return;
      }
      finalize(message, true);
    },
    fail: (message) => {
      if (!process.stdout.isTTY) {
        console.log(`${color.red("✕")} ${message}`);
        instance = null;
        return;
      }
      finalize(message, false);
    },
    stop: (message = "", success = true) => {
      finalize(message, success);
    },
  };
};

const renderCometTrail = (step: number): string => {
  const width = Math.min(getTerminalWidth() - 4, OUTRO_STEPS + 8);
  const track = Array.from({ length: width }, () => " ");
  const head = Math.min(step, width - 1);

  const segments: Array<{ offset: number; char: string }> = [
    { offset: -4, char: color.dim("·") },
    { offset: -3, char: color.blue("·") },
    { offset: -2, char: cometGradient("✦") },
    { offset: -1, char: color.yellow("✧") },
  ];

  for (const segment of segments) {
    const index = head + segment.offset;
    if (index >= 0 && index < track.length) {
      track[index] = segment.char;
    }
  }

  track[head] = color.bold(cometGradient("☄"));
  return track.join("");
};

export type CometTreeTone = "success" | "error" | "info";

const toneIcon = (tone: CometTreeTone): string => {
  switch (tone) {
    case "error":
      return color.red("✕");
    case "info":
      return color.cyan("◇");
    default:
      return color.green("✦");
  }
};

export const printTreeTail = (message: string, tone: CometTreeTone = "success"): void => {
  const pipe = color.dim("│");
  const elbow = color.dim("└");
  const icon = toneIcon(tone);

  if (!process.stdout.isTTY) {
    console.log(`${icon} ${message}`);
    return;
  }

  console.log(pipe);
  console.log(`${elbow} ${icon} ${color.bold(message)}`);
  console.log("");
};

export const cometOutro = async (success = true): Promise<void> => {
  if (!process.stdout.isTTY) {
    console.log(success ? "✦ Done." : "✕ Cancelled.");
    return;
  }

  if (!success) {
    printTreeTail("Cancelled", "error");
    return;
  }

  for (let step = 0; step < OUTRO_STEPS; step += 1) {
    logUpdate(renderCometTrail(step));
    await sleep(OUTRO_DELAY_MS);
  }

  logUpdate.clear();
  logUpdate.done();
  printTreeTail(cometGradient("Orbit complete"), "success");
};

export const COMET_ICONS = {
  success: "✦",
  error: "✕",
  warning: "⚠",
  info: "◇",
  loading: "•",
  analyzing: "✦",
  commit: "→",
  push: "↑",
} as const;

export const COMET_COLORS = {
  primary: (text: string) => color.bold(color.cyan(text)),
  secondary: (text: string) => color.blue(text),
  accent: (text: string) => color.yellow(text),
  violet: (text: string) => color.magenta(text),
  success: (text: string) => color.green(text),
  error: (text: string) => color.red(text),
  warning: (text: string) => color.yellow(text),
  muted: (text: string) => color.dim(text),
  dim: (text: string) => color.dim(color.white(text)),
  bold: (text: string) => color.bold(text),
  gradient: (text: string) => cometGradient(text),
} as const;

export const COMET_PANEL_STYLES = {
  preview: { border: "cyan", title: "Commit Preview" },
  safeSend: { border: "blue", title: "Safe Send" },
  analysis: { border: "magenta", title: "Analysis" },
  quality: { border: "yellow", title: "Quality" },
  warning: { border: "red", title: "Warnings" },
  config: { border: "blue", title: "Config" },
  git: { border: "cyan", title: "Git Status" },
  release: { border: "green", title: "Release" },
} as const;

export type CometStatusTone = "ok" | "warn" | "fail" | "info";

export const renderStatusBadge = (status: CometStatusTone): string => {
  switch (status) {
    case "ok":
      return COMET_COLORS.success("●  OK  ");
    case "warn":
      return COMET_COLORS.warning("●  WARN");
    case "fail":
      return COMET_COLORS.error("●  FAIL");
    default:
      return COMET_COLORS.secondary("●  INFO");
  }
};

export const renderBullet = (
  tone: "default" | "accent" | "success" | "warning" = "default"
): string => {
  switch (tone) {
    case "accent":
      return COMET_COLORS.accent("✦");
    case "success":
      return COMET_COLORS.success("✦");
    case "warning":
      return COMET_COLORS.warning("◇");
    default:
      return COMET_COLORS.muted("◇");
  }
};
