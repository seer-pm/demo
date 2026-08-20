import {
  SEER_APP_ALL_ID,
  childScopes,
  isSeerAppFilterId,
  leaderboardJobsFromApps,
  marketScopeFilterId,
  marketsForAppFilter,
  materializedAppIdsForFilter,
  parseAppFilter,
} from "@/lib/apps";
import { gnosis, optimism } from "viem/chains";
import { describe, expect, it } from "vitest";

describe("apps registry / leaderboard scopes", () => {
  it("accepts all, app ids, and split market scopes", () => {
    expect(isSeerAppFilterId("all")).toBe(true);
    expect(isSeerAppFilterId("deepfund")).toBe(true);
    expect(isSeerAppFilterId("deepfund:octant")).toBe(true);
    expect(isSeerAppFilterId("opportunity:opportunity-1")).toBe(false);
    expect(isSeerAppFilterId("deepfund:missing")).toBe(false);
  });

  it("parses market scopes only for splitLeaderboard apps", () => {
    expect(parseAppFilter("deepfund:octant")).toMatchObject({
      kind: "market",
      appId: "deepfund",
      market: { id: "octant" },
    });
    expect(parseAppFilter("opportunity:opportunity-1")).toBeNull();
  });

  it("materializes split apps as market-scope ids and opportunity as a single app id", () => {
    expect(materializedAppIdsForFilter(SEER_APP_ALL_ID)).toEqual(["all"]);
    expect(materializedAppIdsForFilter("opportunity")).toEqual(["opportunity"]);
    expect(materializedAppIdsForFilter("deepfund")).toEqual([
      "deepfund:round2-l1",
      "deepfund:round2-l2",
      "deepfund:round2",
      "deepfund:round1",
      "deepfund:octant",
    ]);
    expect(materializedAppIdsForFilter("deepfund:octant")).toEqual(["deepfund:octant"]);
    expect(materializedAppIdsForFilter("foresight")).toEqual([
      "foresight:foresight-1",
      "foresight:foresight-2",
      "foresight:foresight-3",
    ]);
  });

  it("emits per-market jobs for split apps and one union job for opportunity", () => {
    const jobs = leaderboardJobsFromApps();
    const appIds = jobs.map((j) => j.appId);

    expect(appIds).toContain("deepfund:octant");
    expect(appIds).toContain("foresight:foresight-1");
    expect(appIds).toContain("opportunity");
    expect(appIds).not.toContain("deepfund");
    expect(appIds).not.toContain("foresight");
    expect(appIds.some((id) => id.startsWith("opportunity:"))).toBe(false);

    const opportunity = jobs.find((j) => j.appId === "opportunity");
    expect(opportunity?.chainId).toBe(gnosis.id);
    expect(opportunity?.marketIds).toHaveLength(2);

    const octant = jobs.find((j) => j.appId === "deepfund:octant");
    expect(octant?.chainId).toBe(optimism.id);
    expect(octant?.marketIds).toEqual(["0xe85ada7cd6d33cb41ac596fb4749e3f94d836ece"]);
  });

  it("exposes nested chips only for split apps", () => {
    expect(childScopes("deepfund").map((m) => m.id)).toContain("octant");
    expect(childScopes("foresight")).toHaveLength(3);
    expect(childScopes("opportunity")).toEqual([]);
  });

  it("resolves root markets for filters", () => {
    expect(marketsForAppFilter("all", optimism.id)).toBeNull();
    expect(marketsForAppFilter("deepfund:octant", optimism.id)).toEqual(["0xe85ada7cd6d33cb41ac596fb4749e3f94d836ece"]);
    expect(marketsForAppFilter("deepfund", optimism.id)).toHaveLength(5);
    expect(marketsForAppFilter(marketScopeFilterId("foresight", "foresight-1"), gnosis.id)).toHaveLength(1);
  });
});
