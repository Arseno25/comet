import { Tiktoken } from "js-tiktoken/lite";
import o200kBase from "js-tiktoken/ranks/o200k_base";

const encoder = new Tiktoken(o200kBase);

export const estimateTokens = (value: string): number => {
  if (!value.trim()) {
    return 0;
  }

  return encoder.encode(value).length;
};
