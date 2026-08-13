export function getTimestamp(): string {
  return Math.round(Date.now() / 1000).toString();
}

export function shortAddress(address?: string | null): string {
  if (!address) return "-";
  return `${address.substring(0, 5)}-${address.substring(address.length - 5)}`;
}
