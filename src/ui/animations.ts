import color from "yoctocolors";

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const CLEAR_LINE = "\r" + " ".repeat(80) + "\r";
const COMET_BAR = "─".repeat(26);
const OUTRO_DELAY_MS = 42;
const OUTRO_STEPS = 14;

const colorSpinnerFrame = (frame: string, index: number): string =>
  index % 2 === 0 ? color.cyan(frame) : color.magenta(frame);

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const centerInBanner = (plainText: string, renderedText: string, width: number): string => {
  if (plainText.length >= width) {
    return renderedText;
  }

  const leftPadding = Math.floor((width - plainText.length) / 2);
  return `${" ".repeat(leftPadding)}${renderedText}`;
};

const renderCometTrailFrame = (step: number): string => {
  const track = Array.from({ length: OUTRO_STEPS + 6 }, () => " ");
  const headIndex = Math.min(step, track.length - 1);
  const trail = [
    { offset: -3, char: color.dim("·") },
    { offset: -2, char: color.blue("·") },
    { offset: -1, char: color.yellow("✦") },
  ];

  for (const segment of trail) {
    const index = headIndex + segment.offset;
    if (index >= 0 && index < track.length) {
      track[index] = segment.char;
    }
  }

  track[headIndex] = color.bold(color.cyan("☄"));
  return track.join("");
};

export const cometIntro = (): void => {
  if (!process.stdout.isTTY) {
    console.log(`${color.bold(color.cyan("☄"))} ${color.bold("Comet")}`);
    return;
  }

  const titleText = "☄ Comet";
  const renderedTitle = `${color.bold(color.cyan("☄"))} ${color.bold(color.white("Comet"))}`;

  console.log("");
  console.log(`  ${color.dim(COMET_BAR)}`);
  console.log(`  ${centerInBanner(titleText, renderedTitle, COMET_BAR.length)}`);
  console.log(`  ${color.dim(COMET_BAR)}`);
  console.log("");
};

export const createCometSpinner = () => {
  let frame = 0;
  let interval: NodeJS.Timeout | null = null;

  return {
    start: (message: string) => {
      if (!process.stdout.isTTY) {
        console.log(`${color.cyan("•")} ${color.dim(message)}`);
        return;
      }

      const firstFrame = SPINNER_FRAMES[0] ?? "•";
      process.stdout.write(`\r${colorSpinnerFrame(firstFrame, 0)} ${color.bold(color.cyan(message))}`);

      interval = setInterval(() => {
        frame = (frame + 1) % SPINNER_FRAMES.length;
        const currentFrame = SPINNER_FRAMES[frame] ?? "•";
        process.stdout.write(
          `${CLEAR_LINE}\r${colorSpinnerFrame(currentFrame, frame)} ${color.bold(color.cyan(message))}`
        );
      }, 95);
    },
    stop: (finalMessage: string, success = true) => {
      if (interval) clearInterval(interval);
      interval = null;

      if (!process.stdout.isTTY) {
        const icon = success ? color.green("✦") : color.red("✕");
        console.log(`${icon} ${finalMessage}`);
        return;
      }

      process.stdout.write(`${CLEAR_LINE}`);
      const icon = success ? color.green("✦") : color.red("✕");
      console.log(`${icon} ${finalMessage}`);
    },
  };
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
      return COMET_COLORS.success("OK");
    case "warn":
      return COMET_COLORS.warning("WARN");
    case "fail":
      return COMET_COLORS.error("FAIL");
    default:
      return COMET_COLORS.secondary("INFO");
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

export const cometOutro = async (success = true): Promise<void> => {
  if (!process.stdout.isTTY) {
    console.log(success ? "✦ Done." : "✕ Cancelled.");
    return;
  }

  if (success) {
    for (let step = 0; step < OUTRO_STEPS; step += 1) {
      process.stdout.write(`${CLEAR_LINE}\r${renderCometTrailFrame(step)}`);
      await sleep(OUTRO_DELAY_MS);
    }

    process.stdout.write(`${CLEAR_LINE}`);
    console.log(`${color.green("✦")} ${color.bold(color.cyan("Orbit complete"))}\n`);
  } else {
    console.log(`${color.red("✕")} ${color.bold("Cancelled")}\n`);
  }
};
