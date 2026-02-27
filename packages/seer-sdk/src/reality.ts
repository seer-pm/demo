export function escapeJson(txt: string): string {
  return JSON.stringify(txt).replace(/^"|"$/g, "");
}
