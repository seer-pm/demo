import { adjectives, animals } from "unique-names-generator";

const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 50;
const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9_-]*[a-z0-9])?$/;
const RESERVED_USERNAMES = ["admin", "help", "moderator", "official", "seer", "support"] as const;
const RESERVED_USERNAME_SET = new Set<string>(RESERVED_USERNAMES);

/**
 * The dictionaries `addressUsername()` draws from.
 *
 * Every wallet without a username is already displayed as an `adjective-adjective-animal` nickname
 * derived from its address, so those strings name real people on the leaderboard and beside their
 * comments. Leaving them claimable lets anyone take the label the app shows for someone else's
 * wallet, where the only things telling the two apart are the `@` sigil and a grey.
 *
 * These sets are read from `unique-names-generator` rather than copied, so the rule cannot drift
 * from the generator; `username.test.ts` pins that agreement by feeding real generated names back
 * through `validateUsername`.
 */
const GENERATOR_ADJECTIVES = new Set<string>(adjectives);
const GENERATOR_ANIMALS = new Set<string>(animals);

/**
 * True when `value` is a name `addressUsername()` could have produced for some wallet.
 *
 * The whole namespace is blocked, not just names that map to a wallet seen so far: a combination
 * nobody holds yet is still indistinguishable from a generated label to the person reading it.
 */
function isGeneratedNickname(value: string): boolean {
  const parts = value.split("-");
  return (
    parts.length === 3 &&
    GENERATOR_ADJECTIVES.has(parts[0]) &&
    GENERATOR_ADJECTIVES.has(parts[1]) &&
    GENERATOR_ANIMALS.has(parts[2])
  );
}

/** Converts user input to the canonical stored username form. */
export function normalizeUsername(value: string): string {
  return value.trim().replace(/^@/, "").toLowerCase();
}

/** Returns a user-facing validation error, or null for a valid canonical username. */
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
  if (isGeneratedNickname(value)) {
    return "Seer already uses names like this for wallets without a username. Choose a different one.";
  }
  return null;
}
