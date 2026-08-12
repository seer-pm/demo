import { describe, expect, it } from "vitest";
import { makeUsername } from "../../netlify/functions/utils/username";
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

  it("generates a deterministic valid username from a wallet seed", () => {
    const username = makeUsername("0x1234567890abcdef1234567890abcdef12345678");

    expect(makeUsername("0x1234567890abcdef1234567890abcdef12345678")).toBe(username);
    expect(validateUsername(username)).toBeNull();
  });
});
