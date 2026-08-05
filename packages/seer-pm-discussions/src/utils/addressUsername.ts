import { adjectives, animals, uniqueNamesGenerator } from "unique-names-generator";

/** Deterministic human-readable nickname from a wallet address. */
export function addressUsername(address: string): string {
  return uniqueNamesGenerator({
    dictionaries: [adjectives, adjectives, animals],
    separator: "-",
    style: "lowerCase",
    seed: address.toLowerCase(),
  });
}
