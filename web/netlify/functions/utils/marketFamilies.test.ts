import { describe, expect, it } from "vitest";
import { resolveFamilyRoots, rootMarketId } from "./marketFamilies";

const ROOT = "0xr00t000000000000000000000000000000000001";
const CHILD = "0xc41d000000000000000000000000000000000002";
const GRANDCHILD = "0x64c4000000000000000000000000000000000003";
const OTHER = "0x0e40000000000000000000000000000000000004";

describe("resolveFamilyRoots", () => {
  it("maps a child to its parent and leaves the root unmapped", () => {
    const roots = resolveFamilyRoots(new Map([[CHILD, ROOT]]));
    expect(roots.get(CHILD)).toBe(ROOT);
    expect(roots.has(ROOT)).toBe(false);
  });

  it("walks past an intermediate parent to the root", () => {
    // Depth 2 exists on gnosis today, so the immediate parent is not the family.
    const roots = resolveFamilyRoots(
      new Map([
        [GRANDCHILD, CHILD],
        [CHILD, ROOT],
      ]),
    );
    expect(roots.get(GRANDCHILD)).toBe(ROOT);
    expect(roots.get(CHILD)).toBe(ROOT);
  });

  it("resolves the same root whichever end of the chain it starts from", () => {
    const descending = resolveFamilyRoots(
      new Map([
        [CHILD, ROOT],
        [GRANDCHILD, CHILD],
      ]),
    );
    const ascending = resolveFamilyRoots(
      new Map([
        [GRANDCHILD, CHILD],
        [CHILD, ROOT],
      ]),
    );
    expect(descending).toEqual(ascending);
  });

  it("keeps separate families apart", () => {
    const roots = resolveFamilyRoots(
      new Map([
        [CHILD, ROOT],
        [OTHER, OTHER.replace("0x0e40", "0x0e41")],
      ]),
    );
    expect(roots.get(CHILD)).toBe(ROOT);
    expect(roots.get(OTHER)).not.toBe(ROOT);
  });

  it("leaves a cycle unmapped instead of spinning", () => {
    const roots = resolveFamilyRoots(
      new Map([
        [CHILD, GRANDCHILD],
        [GRANDCHILD, CHILD],
      ]),
    );
    expect(roots.has(CHILD)).toBe(false);
    expect(roots.has(GRANDCHILD)).toBe(false);
  });

  it("still resolves a family hanging off a cycle-free branch when another chain cycles", () => {
    const roots = resolveFamilyRoots(
      new Map([
        [CHILD, ROOT],
        [OTHER, GRANDCHILD],
        [GRANDCHILD, OTHER],
      ]),
    );
    expect(roots.get(CHILD)).toBe(ROOT);
    expect(roots.has(OTHER)).toBe(false);
  });
});

describe("rootMarketId", () => {
  it("reads a miss as the market being its own root", () => {
    const roots = resolveFamilyRoots(new Map([[CHILD, ROOT]]));
    expect(rootMarketId(roots, ROOT)).toBe(ROOT);
    expect(rootMarketId(roots, CHILD)).toBe(ROOT);
  });

  it("is the identity when no map is known", () => {
    expect(rootMarketId(undefined, CHILD)).toBe(CHILD);
  });

  it("lowercases the lookup", () => {
    const roots = resolveFamilyRoots(new Map([[CHILD, ROOT]]));
    expect(rootMarketId(roots, CHILD.toUpperCase())).toBe(ROOT);
  });
});
