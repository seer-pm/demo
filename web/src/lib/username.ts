const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 50;
const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9_-]*[a-z0-9])?$/;
const RESERVED_USERNAMES = ["admin", "help", "moderator", "official", "seer", "support"] as const;
const RESERVED_USERNAME_SET = new Set<string>(RESERVED_USERNAMES);

export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}

export function validateUsername(value: string): string | null {
  if (value.length < USERNAME_MIN_LENGTH || value.length > USERNAME_MAX_LENGTH) {
    return `Username must be ${USERNAME_MIN_LENGTH}-${USERNAME_MAX_LENGTH} characters.`;
  }
  if (!USERNAME_PATTERN.test(value)) {
    return "Use lowercase letters, numbers, hyphens, or underscores; start and end with a letter or number.";
  }
  if (RESERVED_USERNAME_SET.has(value)) {
    return "This username is reserved.";
  }
  return null;
}
