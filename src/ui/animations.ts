import color from "yoctocolors";

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const CLEAR_LINE = "\r" + " ".repeat(80) + "\r";

export const cometIntro = (): void => {
  if (!process.stdout.isTTY) {
    console.log(`${color.cyan("☄️")} Comet — AI commit messages.`);
    return;
  }

  console.log("");
  console.log(`  ${color.bold(color.cyan("☄️ Comet"))}`);
  console.log(`  ${color.dim("AI-powered commit messages")}`);
  console.log("");
};

export const createCometSpinner = () => {
  let frame = 0;
  let interval: NodeJS.Timeout | null = null;

  return {
    start: (message: string) => {
      if (!process.stdout.isTTY) {
        console.log(color.dim("⋯") + " " + message);
        return;
      }

      const firstFrame = SPINNER_FRAMES[0] ?? "⋯";
      process.stdout.write(`\r${color.cyan(firstFrame)} ${color.dim(message)}`);

      interval = setInterval(() => {
        frame = (frame + 1) % SPINNER_FRAMES.length;
        const currentFrame = SPINNER_FRAMES[frame] ?? "⋯";
        process.stdout.write(`${CLEAR_LINE}\r${color.cyan(currentFrame)} ${color.dim(message)}`);
      }, 80);
    },
    stop: (finalMessage: string, success = true) => {
      if (interval) clearInterval(interval);
      interval = null;

      if (!process.stdout.isTTY) {
        const icon = success ? color.green("✓") : color.red("✕");
        console.log(`${icon} ${finalMessage}`);
        return;
      }

      process.stdout.write(`${CLEAR_LINE}`);
      const icon = success ? color.green("✓") : color.red("✕");
      console.log(`${icon} ${finalMessage}`);
    },
  };
};

export const COMET_ICONS = {
  success: "✓",
  error: "✕",
  warning: "⚠",
  info: "○",
  loading: "⋯",
  analyzing: "◉",
  commit: "→",
  push: "↑",
} as const;

export const COMET_COLORS = {
  primary: (text: string) => color.cyan(text),
  secondary: (text: string) => color.blue(text),
  accent: (text: string) => color.magenta(text),
  success: (text: string) => color.green(text),
  error: (text: string) => color.red(text),
  warning: (text: string) => color.yellow(text),
  muted: (text: string) => color.dim(text),
  dim: (text: string) => color.dim(text),
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
    console.log(success ? "Done." : "Cancelled.");
    return;
  }

  if (success) {
    console.log(`${color.cyan("☄️")} ${color.bold("Done")}\n`);
  } else {
    console.log(`${color.red("✕")} ${color.bold("Cancelled")}\n`);
  }
};

