import { logger } from "./logger.js";
import { createCometSpinner, type CometSpinner } from "./animations.js";

export interface SpinnerLike {
  start(message: string): void;
  update(message: string): void;
  stop(message: string, success?: boolean): void;
}

export const isInteractiveTerminal = (): boolean =>
  Boolean(process.stdout.isTTY && process.stdin.isTTY);

export const createSpinner = (): SpinnerLike => {
  if (!isInteractiveTerminal()) {
    return {
      start: (message) => logger.step(message),
      update: (message) => logger.step(message),
      stop: (message, success = true) =>
        success ? logger.success(message) : logger.error(message),
    };
  }

  const cometSpinner: CometSpinner = createCometSpinner();
  return {
    start: (message) => cometSpinner.start(message),
    update: (message) => cometSpinner.update(message),
    stop: (message, success = true) => cometSpinner.stop(message, success),
  };
};
