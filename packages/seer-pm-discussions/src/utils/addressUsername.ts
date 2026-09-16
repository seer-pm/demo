import { adjectives, animals, uniqueNamesGenerator } from "unique-names-generator";

/**
 * Deterministic human-readable nickname derived from a wallet address.
 *
 * The seed is mandatory: an unseeded generator returns a random name, which as an identity means a
 * user whose label changes on every render.
 */
export function addressUsername(address: string): string {
  return uniqueNamesGenerator({
    dictionaries: [adjectives, adjectives, animals],
    separator: "-",
    style: "lowerCase",
    seed: address.toLowerCase(),
  });
}
