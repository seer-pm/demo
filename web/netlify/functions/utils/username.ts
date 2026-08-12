import { adjectives, animals, uniqueNamesGenerator } from "unique-names-generator";

/** Returns an adjective-adjective-animal username, optionally deterministic from a seed. */
export function makeUsername(seed?: string): string {
  return uniqueNamesGenerator({
    dictionaries: [adjectives, adjectives, animals],
    separator: "-",
    style: "lowerCase",
    seed,
  });
}
