import { addressUsername } from "@seer-pm/discussions";
import { describe, expect, it } from "vitest";
import { normalizeUsername, validateUsername } from "./username";

describe("username", () => {
  it("normalizes surrounding whitespace and case", () => {
    expect(normalizeUsername("  Curious_Otter  ")).toBe("curious_otter");
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
});

describe("addressUsername", () => {
  it("is deterministic and case-insensitive", () => {
    const lower = addressUsername("0x1234567890abcdef1234567890abcdef12345678");

    expect(addressUsername("0x1234567890abcdef1234567890abcdef12345678")).toBe(lower);
    expect(addressUsername("0x1234567890ABCDEF1234567890ABCDEF12345678")).toBe(lower);
  });

  it.each([
    "0x1234567890abcdef1234567890abcdef12345678",
    "0x0000000000000000000000000000000000000000",
    "0xffffffffffffffffffffffffffffffffffffffff",
    "0xde0b295669a9fd93d5f28d9ec85e40f4cb697bae",
  ])("generates a name that would pass username validation for %s", (address) => {
    expect(validateUsername(addressUsername(address))).toBeNull();
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
