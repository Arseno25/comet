export const applyMessageTemplate = (template: string, message: string): string =>
  template.includes("$msg") ? template.replaceAll("$msg", message) : `${template}${message}`;
