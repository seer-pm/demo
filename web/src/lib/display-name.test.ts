import { resolveDisplayName } from "@seer-pm/discussions";
import { describe, expect, it } from "vitest";

const ADDRESS = "0x1234567890abcdef1234567890abcdef12345678";

describe("resolveDisplayName", () => {
  it("prefers a chosen Seer username over everything else", () => {
    expect(resolveDisplayName({ address: ADDRESS, username: "alice", ensName: "alice.eth" })).toEqual({
      label: "alice",
      source: "username",
    });
  });

  it("falls back to a verified ENS primary name", () => {
    expect(resolveDisplayName({ address: ADDRESS, username: null, ensName: "alice.eth" })).toEqual({
      label: "alice.eth",
      source: "ens",
    });
  });

  it("falls back to a generated nickname when neither exists", () => {
    const resolved = resolveDisplayName({ address: ADDRESS });

    expect(resolved.source).toBe("generated");
    expect(resolved.label).toMatch(/^[a-z]+-[a-z]+-[a-z]+$/);
  });

  it("returns the generated name while an ENS lookup is still pending", () => {
    // An in-flight reverse lookup yields `undefined`, which must not blank the label.
    expect(resolveDisplayName({ address: ADDRESS, ensName: undefined }).source).toBe("generated");
  });

  it("degrades without throwing when there is no address", () => {
    expect(resolveDisplayName({})).toEqual({ label: "-", source: "generated" });
  });
});
