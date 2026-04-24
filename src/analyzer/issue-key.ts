export const extractIssueKey = (branch: string, pattern: string): string | null => {
  try {
    const regex = new RegExp(pattern, "i");
    const match = branch.match(regex);
    return match?.[0]?.toUpperCase() ?? null;
  } catch {
    return null;
  }
};
