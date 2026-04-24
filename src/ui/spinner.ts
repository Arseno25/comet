import * as p from "@clack/prompts";
import { logger } from "./logger.js";

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

  const spinner = p.spinner();
  return {
    start: (message: string) => spinner.start(message),
    stop: (message: string) => spinner.stop(message),
  };
};
