import { logger } from "./logger.js";
import { createCometSpinner } from "./animations.js";

export interface SpinnerLike {
  start(message: string): void;
  stop(message: string): void;
}

export const isInteractiveTerminal = (): boolean =>
  Boolean(process.stdout.isTTY && process.stdin.isTTY);

export const createSpinner = (): SpinnerLike => {
  if (!isInteractiveTerminal()) {
    return {
      start: (message: string) => logger.step(message),
      stop: (message: string) => logger.step(message),
    };
  }

  const cometSpinner = createCometSpinner();
  return {
    start: (message: string) => cometSpinner.start(message),
    stop: (message: string) => cometSpinner.stop(message, true),
  };
};
