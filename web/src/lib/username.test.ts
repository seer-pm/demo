import { addressUsername } from "@seer-pm/discussions";
import { describe, expect, it } from "vitest";
import { normalizeUsername, validateUsername } from "./username";

describe("username", () => {
  it("normalizes surrounding whitespace and case", () => {
    expect(normalizeUsername("  Curious_Otter  ")).toBe("curious_otter");
  });

  it("strips a leading @, so pasting a handle works in any field", () => {
    expect(normalizeUsername("@Alice")).toBe("alice");
  });

  it("accepts canonical usernames", () => {
    expect(validateUsername("curious-otter_7")).toBeNull();
  });

  it.each(["ab", "-alice", "alice-", "alice.eth", "alice smith"])("rejects %s", (username) => {
    expect(validateUsername(username)).not.toBeNull();
  });

  it.each(["admin", "official", "seer", "support"])("reserves the platform username %s", (username) => {
    expect(validateUsername(username)).toBe("This username is reserved.");
  });

  /**
   * Only the generator's own namespace is blocked. A three-word name built from words the
   * dictionaries do not contain is an ordinary username and must stay claimable, or the rule would
   * quietly confiscate names like this one from the people who want them.
   */
  it.each(["muy-buen-trader", "one-two-three", "alpha-beta-zeta"])("still accepts %s", (username) => {
    expect(validateUsername(username)).toBeNull();
  });
});

describe("addressUsername", () => {
  it("is deterministic and case-insensitive", () => {
    const lower = addressUsername("0x1234567890abcdef1234567890abcdef12345678");

    expect(addressUsername("0x1234567890abcdef1234567890abcdef12345678")).toBe(lower);
    expect(addressUsername("0x1234567890ABCDEF1234567890ABCDEF12345678")).toBe(lower);
  });

  /**
   * The impersonation guard, and the cross-check that keeps `username.ts` in sync with the
   * generator: every name the generator can produce already labels a wallet, so none of them may
   * be claimable. If `unique-names-generator` ever changes its dictionaries, this fails.
   */
  it.each([
    "0x1234567890abcdef1234567890abcdef12345678",
    "0x0000000000000000000000000000000000000000",
    "0xffffffffffffffffffffffffffffffffffffffff",
    "0xde0b295669a9fd93d5f28d9ec85e40f4cb697bae",
  ])("refuses to let anyone claim the generated name for %s", (address) => {
    expect(validateUsername(addressUsername(address))).toBe(
      "Seer already uses names like this for wallets without a username. Choose a different one.",
    );
  });

  /**
   * Generated names are a user's visible identity, so the dictionaries must not move underneath
   * them. `unique-names-generator` is pinned exactly; this fails loudly if that pin is relaxed.
   */
  it("pins generated names against a dependency bump", () => {
    expect({
      zero: addressUsername("0x0000000000000000000000000000000000000000"),
      max: addressUsername("0xffffffffffffffffffffffffffffffffffffffff"),
      sample: addressUsername("0xde0b295669a9fd93d5f28d9ec85e40f4cb697bae"),
    }).toEqual({
      zero: "royal-uniform-guan",
      max: "usual-compatible-caterpillar",
      sample: "brainy-crowded-marten",
    });
  });
});
