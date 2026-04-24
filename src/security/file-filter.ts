import picomatch from "picomatch";

export interface FilterResult {
  includedFiles: string[];
  skippedFiles: string[];
}

export const filterFiles = (files: string[], excludePatterns: string[]): FilterResult => {
  const matchers = excludePatterns.map((pattern) =>
    picomatch(pattern, {
      dot: true,
      bash: true,
    })
  );

  const includedFiles: string[] = [];
  const skippedFiles: string[] = [];

  for (const file of files) {
    const shouldSkip = matchers.some((matcher) => matcher(file));
    if (shouldSkip) {
      skippedFiles.push(file);
      continue;
    }

    includedFiles.push(file);
  }

  return {
    includedFiles,
    skippedFiles,
  };
};
