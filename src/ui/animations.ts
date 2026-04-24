import color from "yoctocolors";

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const CLEAR_LINE = "\r" + " ".repeat(80) + "\r";
const COMET_BAR = "─".repeat(26);

const colorSpinnerFrame = (frame: string, index: number): string =>
  index % 2 === 0 ? color.cyan(frame) : color.magenta(frame);

export const cometIntro = (): void => {
  if (!process.stdout.isTTY) {
    console.log(`${color.bold(color.cyan("☄"))} ${color.bold("Comet")} ${color.dim("AI commit messages")}`);
    return;
  }

  console.log("");
  console.log(`  ${color.dim(COMET_BAR)}`);
  console.log(`  ${color.bold(color.cyan("☄"))} ${color.bold(color.white("Comet"))} ${color.dim("commit intelligence with a lighter orbit")}`);
  console.log(`  ${color.yellow("✦")} ${color.dim("analyze staged changes, shape a clean message, confirm with intent")}`);
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
} as const;

export const cometOutro = (success = true): void => {
  if (!process.stdout.isTTY) {
    console.log(success ? "✦ Done." : "✕ Cancelled.");
    return;
  }

  if (success) {
    console.log(`${color.green("✦")} ${color.bold(color.cyan("Orbit complete"))}\n`);
  } else {
    console.log(`${color.red("✕")} ${color.bold("Cancelled")}\n`);
  }
};
