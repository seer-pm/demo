import {
  type AbiParameter,
  type Address,
  type Hex,
  type PublicClient,
  type RpcLog,
  concat,
  encodeAbiParameters,
  encodeEventTopics,
  getAddress,
  keccak256,
  numberToHex,
  pad,
  parseAbi,
  zeroHash,
} from "viem";
import { describe, expect, it, vi } from "vitest";
import { type Campaign, assertForwardOnly, parseCampaigns } from "./campaigns.ts";
import { PAYOUT_CHAINS, SOURCE_CHAINS } from "./chains.ts";
import { CAMPAIGN_PAGE, accountRewards, readAllCampaigns, rewardCampaignsAbi, urdAbi } from "./claims.ts";
import { assertNoDecrease, buildDistributions } from "./distribution.ts";
import { revocationKey, revokedRoots, syncDistributor } from "./distributor.ts";
import { Q128, WEEK, accrueRewards, parseState, serializeState } from "./engine.ts";
import type { ChainEvent } from "./events.ts";
import { type RawCampaign, campaignHistory, campaignsFromLogs, dueReleases, emittedByCampaign } from "./registry.ts";
import { computeWeek, computeWeeks } from "./week.ts";

vi.mock(import("./chains.ts"), async (importOriginal) => {
  const chains = await importOriginal();
  const registry = { address: "0x0000000000000000000000000000000000000007" as Address, fromBlock: 1n };
  return { ...chains, PAYOUT_CHAINS: { ...chains.PAYOUT_CHAINS, 8453: { ...chains.PAYOUT_CHAINS[8453], registry } } };
});

const PM = "0x00000000000000000000000000000000000000aa" as Address;
const HOOK = "0x00000000000000000000000000000000000000bb" as Address;
const ALICE = getAddress("0x000000000000000000000000000000000000a11c");
const BOB = getAddress("0x0000000000000000000000000000000000000b0b");
const TOKEN = getAddress("0x00000000000000000000000000000000000000cc");
const POOL = `0x${"11".repeat(32)}` as Hex;
const T0 = Date.parse("2026-11-02T00:00:00Z") / 1000;

function campaign(overrides: Record<string, unknown> = {}): Campaign {
  return parseCampaigns({
    campaigns: [
      {
        id: "pool-a",
        chainId: 8453,
        poolId: POOL,
        payoutChainId: 8453,
        rewardToken: TOKEN,
        rates: [{ from: "2026-11-02T00:00:00Z", perSecond: "10" }],
        ...overrides,
      },
    ],
  })[0];
}

// Each event gets its own block unless `block` is given, so timestamps drive the intervals.
let log = 0;
const at = (t: number, block = BigInt(t)) => ({ blockNumber: block, logIndex: log++, timestamp: T0 + t });
const tick = (t: number, value: number, block?: bigint): ChainEvent => ({
  ...at(t, block),
  kind: "swap",
  poolId: POOL,
  tick: value,
});
const mint = (t: number, tokenId: bigint, owner: Address): ChainEvent => ({
  ...at(t),
  kind: "transfer",
  tokenId,
  to: owner,
});
const liquidity = (
  t: number,
  tokenId: bigint,
  delta: bigint,
  [tickLower, tickUpper] = [-60, 60],
  sender = PM,
  block?: bigint,
): ChainEvent => ({
  ...at(t, block),
  kind: "modifyLiquidity",
  poolId: POOL,
  sender,
  tickLower,
  tickUpper,
  liquidityDelta: delta,
  salt: pad(numberToHex(tokenId), { size: 32 }),
});

function earned(c: Campaign, events: ChainEvent[], cutoff: number) {
  const result: Record<string, bigint> = {};
  for (const a of accrueRewards({
    positionManager: PM,
    campaigns: [c],
    events,
    cutoff: T0 + cutoff,
  }).accrued.values()) {
    const key = `${a.tokenId}:${a.owner}`;
    result[key] = (result[key] ?? 0n) + a.amountX128 / Q128;
  }
  return result;
}

describe("accrueRewards", () => {
  it("splits each second pro rata among in-range liquidity only, with tickUpper exclusive", () => {
    const events = [
      { ...at(0), kind: "initialize", poolId: POOL, tick: 0 } as ChainEvent,
      mint(0, 1n, ALICE),
      mint(0, 2n, BOB),
      liquidity(0, 1n, 300n, [-60, 60]),
      liquidity(0, 2n, 100n, [0, 120]),
      // At tick 60 Alice's [-60, 60) is out of range; Bob's [0, 120) still is.
      tick(100, 60),
    ];
    // 0..100: 1000 split 3:1; 100..200: all 1000 to Bob.
    expect(earned(campaign(), events, 200)).toEqual({ [`1:${ALICE}`]: 750n, [`2:${BOB}`]: 1250n });
  });

  it("keeps the budget while nothing is in range and stops at the cap", () => {
    const c = campaign({ budget: "1500" });
    const events = [
      tick(0, 500), // out of range of [-60, 60)
      mint(0, 1n, ALICE),
      liquidity(0, 1n, 1n),
      tick(100, 0),
    ];
    // 0..100 emits nothing; from 100 on 10/s until the 1500 budget runs out at 250.
    expect(earned(c, events, 1000)).toEqual({ [`1:${ALICE}`]: 1500n });
  });

  it("credits each interval to the owner at that time", () => {
    const events = [tick(0, 0), mint(0, 1n, ALICE), liquidity(0, 1n, 5n), mint(40, 1n, BOB)];
    expect(earned(campaign(), events, 100)).toEqual({ [`1:${ALICE}`]: 400n, [`1:${BOB}`]: 600n });
  });

  it("gives nothing to liquidity added and removed within one block, nor to hook liquidity", () => {
    const c = campaign();
    const events = [
      tick(0, 0),
      mint(0, 1n, ALICE),
      mint(0, 2n, BOB),
      liquidity(0, 1n, 100n),
      liquidity(0, 9n, 10_000n, [-60, 60], HOOK),
      // Bob joins and leaves inside block 50 with 100x Alice's liquidity.
      liquidity(50, 2n, 10_000n, [-60, 60], PM, 50n),
      liquidity(50, 2n, -10_000n, [-60, 60], PM, 50n),
    ];
    expect(earned(c, events, 100)).toEqual({ [`1:${ALICE}`]: 1000n });
  });

  it("applies rate tiers and ignores events at or after the cutoff", () => {
    const c = campaign({
      rates: [
        { from: "2026-11-02T00:00:00Z", perSecond: "10" },
        { from: "2026-11-02T00:01:40Z", perSecond: "0" }, // T0 + 100
        { from: "2026-11-02T00:03:20Z", perSecond: "3" }, // T0 + 200
      ],
    });
    const events = [tick(0, 0), mint(0, 1n, ALICE), liquidity(0, 1n, 1n), liquidity(300, 1n, -1n)];
    expect(earned(c, events, 300)).toEqual({ [`1:${ALICE}`]: 1000n + 300n });
  });
});

describe("resuming from a weekly state", () => {
  // Uneven liquidity so every interval rounds, a budget that runs out in week 2, and events on both
  // sides of the boundary, including a transfer that does not touch liquidity.
  const c = campaign({
    rates: [{ from: "2026-11-02T00:00:00Z", perSecond: "7" }],
    budget: String(7 * WEEK + 1_000_003),
  });
  const events = () => [
    tick(0, 0),
    mint(0, 1n, ALICE),
    mint(0, 2n, BOB),
    liquidity(0, 1n, 3n),
    liquidity(0, 2n, 7n, [0, 120]),
    tick(1_000, -30),
    tick(WEEK - 13, 30),
    tick(WEEK + 51, 90),
    mint(WEEK + 80, 1n, BOB),
    liquidity(WEEK + 100, 1n, 11n),
    tick(WEEK + 200_000, 0),
  ];
  const all = (state: ReturnType<typeof accrueRewards>) =>
    Object.fromEntries([...state.accrued.values()].map((a) => [`${a.tokenId}:${a.owner}`, a.amountX128]));

  it("gives exactly the result of one replay from the start, through a JSON round trip", () => {
    const evs = events();
    const once = accrueRewards({ positionManager: PM, campaigns: [c], events: evs, cutoff: T0 + 2 * WEEK });
    const week1 = accrueRewards({ positionManager: PM, campaigns: [c], events: evs, cutoff: T0 + WEEK });
    const state = parseState(JSON.parse(JSON.stringify(serializeState(week1))));
    const week2 = accrueRewards({
      positionManager: PM,
      campaigns: [c],
      events: evs.filter((e) => e.timestamp >= T0 + WEEK),
      cutoff: T0 + 2 * WEEK,
      state,
    });
    expect(all(week2)).toEqual(all(once));
    expect(week2.budgetUsed.get(c.id)).toBe(c.budget);
    // The state passed in is not mutated.
    expect(all(accrueRewards({ positionManager: PM, campaigns: [c], events: [], cutoff: T0 + WEEK, state }))).toEqual(
      all(week1),
    );
  });

  it("rejects events of tracked pools from before the state's cutoff", () => {
    const evs = events();
    const state = accrueRewards({ positionManager: PM, campaigns: [c], events: evs, cutoff: T0 + WEEK });
    expect(() =>
      accrueRewards({ positionManager: PM, campaigns: [c], events: evs, cutoff: T0 + 2 * WEEK, state }),
    ).toThrow(/already applied/);
  });
});

describe("assertForwardOnly", () => {
  const cutoff = Date.parse("2026-11-09T00:00:00Z") / 1000;
  const published = [campaign()];

  it("accepts a new tier and a new campaign from the cutoff on", () => {
    const next = [
      campaign({
        rates: [
          { from: "2026-11-02T00:00:00Z", perSecond: "10" },
          { from: "2026-11-09T00:00:00Z", perSecond: "0" },
        ],
      }),
      { ...campaign({ rates: [{ from: "2026-11-10T12:00:00Z", perSecond: "5" }] }), id: "pool-b" },
    ];
    expect(() => assertForwardOnly(published, next, cutoff)).not.toThrow();
  });

  it("rejects tiers before the cutoff, early new campaigns and removed campaigns", () => {
    const retroTier = campaign({
      rates: [
        { from: "2026-11-02T00:00:00Z", perSecond: "10" },
        { from: "2026-11-08T23:59:59Z", perSecond: "0" },
      ],
    });
    expect(() => assertForwardOnly(published, [retroTier], cutoff)).toThrow(/rate tiers before/);
    const early = { ...campaign({ rates: [{ from: "2026-11-08T00:00:00Z", perSecond: "1" }] }), id: "pool-b" };
    expect(() => assertForwardOnly(published, [...published, early], cutoff)).toThrow(/cannot start before/);
    expect(() => assertForwardOnly(published, [], cutoff)).toThrow(/cannot be removed/);
    const wider = campaign({ minWidthTicks: 60 });
    expect(() => assertForwardOnly(published, [wider], cutoff)).toThrow(/minWidthTicks cannot change/);
  });
});

describe("buildDistributions", () => {
  it("sums an account across positions before flooring and emits URD-compatible proofs", () => {
    const c = campaign({ id: "3" });
    const events = [
      tick(0, 0),
      mint(0, 1n, ALICE),
      mint(0, 2n, ALICE),
      mint(0, 3n, ALICE),
      mint(0, 4n, BOB),
      liquidity(0, 1n, 1n),
      liquidity(0, 2n, 1n),
      liquidity(0, 3n, 1n),
      liquidity(0, 4n, 1n),
    ];
    // 10 units split four ways: 2.5 each. Flooring per position would give Alice 6; summing first gives 7.
    const accruals = [
      ...accrueRewards({ positionManager: PM, campaigns: [c], events, cutoff: T0 + 1 }).accrued.values(),
    ];
    const ended = { ...c, id: "7", rates: [...c.rates, { from: T0 + 1, perSecond: 0n }] };
    const [d] = buildDistributions({
      campaigns: [c, ended],
      emitted: new Map([
        ["3", 10n],
        ["7", 0n],
      ]),
      accruals,
      cutoff: T0 + 1,
      sourceBlocks: { 8453: 1n },
    });
    expect(d.settlements[7].emitted).toBe("0");
    let settlement = keccak256(
      keccak256(
        encodeAbiParameters(
          [{ type: "uint256" }, { type: "address" }, { type: "uint256" }, { type: "uint64" }, { type: "uint256" }],
          [8453n, PAYOUT_CHAINS[8453].registry!.address, 7n, BigInt(T0 + 1), 0n],
        ),
      ),
    );
    for (const sibling of d.settlements[7].proof) {
      settlement = keccak256(concat([settlement, sibling].sort()));
    }
    expect(settlement).toBe(d.root);
    // Same check as RewardCampaigns.release, for each campaign that emitted anything.
    expect(Object.keys(d.releases)).toEqual(["3"]);
    let release = keccak256(
      keccak256(
        encodeAbiParameters(
          [
            { type: "string" },
            { type: "uint256" },
            { type: "address" },
            { type: "uint256" },
            { type: "uint64" },
            { type: "uint256" },
          ],
          ["release", 8453n, PAYOUT_CHAINS[8453].registry!.address, 3n, BigInt(T0 + 1), 10n],
        ),
      ),
    );
    for (const sibling of d.releases[3].proof) {
      release = keccak256(concat([release, sibling].sort()));
    }
    expect(release).toBe(d.root);

    expect(d.claims[ALICE][TOKEN].claimable).toBe("7");
    expect(d.claims[BOB][TOKEN].claimable).toBe("2");
    expect(d.totals[TOKEN]).toBe("9");

    // Same check as UniversalRewardsDistributor.claim: double-hashed abi.encode leaf, sorted pairs.
    for (const [account, claimable] of [
      [ALICE, 7n],
      [BOB, 2n],
    ] as const) {
      let node = keccak256(
        keccak256(
          encodeAbiParameters(
            [{ type: "address" }, { type: "address" }, { type: "uint256" }],
            [account, TOKEN, claimable],
          ),
        ),
      );
      for (const sibling of d.claims[account][TOKEN].proof) {
        node = keccak256(node < sibling ? concat([node, sibling]) : concat([sibling, node]));
      }
      expect(node).toBe(d.root);
    }
  });

  it("rejects a distribution that lowers a published cumulative amount", () => {
    const c = campaign();
    const events = [tick(0, 0), mint(0, 1n, ALICE), liquidity(0, 1n, 1n)];
    const build = (cutoff: number) =>
      buildDistributions({
        emitted: new Map(),
        campaigns: [c],
        accruals: [
          ...accrueRewards({ positionManager: PM, campaigns: [c], events, cutoff: T0 + cutoff }).accrued.values(),
        ],
        cutoff: T0 + cutoff,
        sourceBlocks: { 8453: 1n },
      })[0];
    expect(() => assertNoDecrease(build(10), build(20))).not.toThrow();
    expect(() => assertNoDecrease(build(20), build(10))).toThrow(/dropped from 200 to 100/);
  });
});

describe("accountRewards", () => {
  const OTHER = getAddress("0x00000000000000000000000000000000000000dd");
  const CAROL = getAddress("0xabcdefabcdefabcdefabcdefabcdefabcdefabcd");
  const file = (amounts: Record<string, Record<string, string>>) =>
    ({
      claims: Object.fromEntries(
        Object.entries(amounts).map(([account, tokens]) => [
          account,
          Object.fromEntries(
            Object.entries(tokens).map(([token, claimable]) => [token, { claimable, proof: [`0x${"ab".repeat(32)}`] }]),
          ),
        ]),
      ),
    }) as unknown as Parameters<typeof accountRewards>[0]["active"];

  it("claims the cumulative leaf amount and reports what is left, what the pending root adds and what accrues after it", () => {
    const active = file({ [CAROL]: { [TOKEN]: "100" } });
    const pending = file({ [CAROL]: { [TOKEN]: "150", [OTHER]: "7" } });
    const NEW = getAddress("0x00000000000000000000000000000000000000ee");
    // The estimate builds on the pending root, so TOKEN accrues 170 - 150, not 170 - 100.
    const estimate = {
      payoutChainId: 8453,
      asOf: "",
      claims: { [CAROL]: { [TOKEN]: "170", [NEW]: "9" } },
      emitted: {},
    };
    // Lowercase input: the file is keyed by checksummed addresses.
    const rewards = accountRewards({
      account: CAROL.toLowerCase() as Address,
      active,
      pending,
      claimed: new Map([[TOKEN, 40n]]),
      estimate,
    });
    expect(rewards).toEqual([
      {
        token: TOKEN,
        earned: 100n,
        proof: [`0x${"ab".repeat(32)}`],
        claimed: 40n,
        claimable: 60n,
        upcoming: 50n,
        accruing: 20n,
      },
      { token: OTHER, earned: 0n, proof: [], claimed: 0n, claimable: 0n, upcoming: 7n, accruing: 0n },
      { token: NEW, earned: 0n, proof: [], claimed: 0n, claimable: 0n, upcoming: 0n, accruing: 9n },
    ]);
  });
});

describe("campaignsFromLogs", () => {
  // The campaign is the only non-indexed input.
  const event = rewardCampaignsAbi.find((item) => item.type === "event" && item.name === "CampaignSet")!;
  const campaignSet = (id: bigint, campaign: Record<string, unknown>) =>
    ({
      topics: encodeEventTopics({ abi: rewardCampaignsAbi, eventName: "CampaignSet", args: { id } }),
      data: encodeAbiParameters(event.inputs.slice(1), [
        {
          poolId: POOL,
          rewardToken: TOKEN,
          budget: 1000n,
          minWidthTicks: 0,
          funder: ALICE,
          released: 0n,
          rates: [{ from: BigInt(T0), perSecond: 10n }],
          ...campaign,
        },
      ]),
    }) as unknown as RpcLog;

  it("keeps each campaign's last change and puts its pool and payout on the registry's chain", () => {
    const ended = [
      { from: BigInt(T0), perSecond: 10n },
      { from: BigInt(T0 + WEEK), perSecond: 0n },
    ];
    const raw = campaignsFromLogs(
      [
        campaignSet(0n, {}),
        campaignSet(1n, {}),
        campaignSet(0n, { rates: ended, budget: 500n, minWidthTicks: 7 }),
        campaignSet(2n, {}),
      ],
      10,
    );

    expect(raw.map((c) => c.id)).toEqual(["0", "1", "2"]);
    expect(raw[0]).toMatchObject({
      chainId: 10,
      payoutChainId: 10,
      rates: [
        { from: "2026-11-02T00:00:00Z", perSecond: "10" },
        { from: "2026-11-09T00:00:00Z", perSecond: "0" },
      ],
      budget: "500",
      minWidthTicks: 7,
    });
    const [parsed] = parseCampaigns({ campaigns: raw });
    expect(parsed.budget).toBe(500n);
    expect([parsed.chainId, parsed.payoutChainId]).toEqual([10, 10]);
  });

  it("keeps payout accounting out of the weekly replay inputs", () => {
    const replay = (released: bigint) => campaignsFromLogs([campaignSet(0n, { released })], 10);
    expect(replay(450n)).toEqual(replay(0n));
  });

  it("gives the campaigns as of the last block before each cutoff from one read of the registry", async () => {
    // One block a day, block n at T0 + n days. Block 7 is at the first cutoff, so its change belongs to week two.
    const DAY = 86_400;
    const registry = { address: "0x00000000000000000000000000000000000000dd" as Address, fromBlock: 1n };
    const atBlock = (block: bigint, log: RpcLog) =>
      ({ ...log, address: registry.address, blockNumber: numberToHex(block) }) as unknown as RpcLog;
    const logs = [
      atBlock(2n, campaignSet(0n, { budget: 10n })),
      atBlock(6n, campaignSet(1n, {})),
      atBlock(7n, campaignSet(0n, { budget: 20n })),
      atBlock(13n, campaignSet(2n, {})),
      atBlock(14n, campaignSet(0n, { budget: 30n })),
    ];
    const client = {
      chain: { id: 10 },
      getBlock: async ({ blockNumber = 20n } = {}) => ({
        number: blockNumber,
        timestamp: BigInt(T0 + Number(blockNumber) * DAY),
      }),
      request: async ({ params: [filter] }: { params: [{ fromBlock: Hex; toBlock: Hex }] }) =>
        logs.filter(
          (l) => BigInt(l.blockNumber!) >= BigInt(filter.fromBlock) && BigInt(l.blockNumber!) <= BigInt(filter.toBlock),
        ),
    } as unknown as PublicClient;

    const campaignsAt = await campaignHistory(client, registry, 10, T0 + 2 * WEEK);
    const budgets = async (cutoff: number) => (await campaignsAt(cutoff)).map((c) => [c.id, c.budget]);

    expect(await budgets(T0 + WEEK)).toEqual([
      ["0", "10"],
      ["1", "1000"],
    ]);
    expect(await budgets(T0 + 2 * WEEK)).toEqual([
      ["0", "20"],
      ["1", "1000"],
      ["2", "1000"],
    ]);
    expect(() => campaignsAt(T0 + 3 * WEEK)).toThrow();
  });
});

describe("emittedByCampaign", () => {
  it("is what the engine charged to each campaign's budget, across the source chains", () => {
    // In range for 100 seconds at 10/s would emit 1000, capped at the 700 budget; "b" on another chain emits nothing.
    const state = accrueRewards({
      positionManager: PM,
      campaigns: [campaign({ id: "a", budget: "700" })],
      events: [
        { ...at(0), kind: "initialize", poolId: POOL, tick: 0 } as ChainEvent,
        mint(0, 1n, ALICE),
        liquidity(0, 1n, 100n),
        tick(100, 500),
      ],
      cutoff: T0 + 200,
    });
    const emitted = emittedByCampaign({
      "8453": serializeState(state),
      "10": { ...serializeState(state), budgetUsed: { b: "0" } },
    });
    expect(emitted).toEqual(
      new Map([
        ["a", 700n],
        ["b", 0n],
      ]),
    );
  });
});

describe("dueReleases", () => {
  const raw = (id: string, rates: { from: string; perSecond: string }[]): RawCampaign => ({
    id,
    chainId: 8453,
    payoutChainId: 8453,
    poolId: POOL,
    rewardToken: TOKEN,
    budget: "1000",
    rates,
    minWidthTicks: 0,
  });
  const target = T0 + WEEK;

  it("releases only what has something new to pay", () => {
    const running = [{ from: "2026-11-02T00:00:00Z", perSecond: "1" }];
    const ended = [...running, { from: "2026-11-05T00:00:00Z", perSecond: "0" }];
    const campaigns = [running, running, running, ended, ended].map((rates, id) => raw(String(id), rates));
    const onchain = [300n, 1000n, 0n, 0n, 200n].map((released) => ({ released, budget: 1000n }));
    const emitted = new Map([
      ["0", 450n],
      ["1", 1000n],
      ["2", 0n],
      ["3", 0n],
      ["4", 150n],
    ]);
    expect(dueReleases(campaigns, onchain, emitted, target)).toEqual({
      due: [["0", 450n]],
      stuck: ["4"],
    });
  });

  it("names what blocks a total over the cumulative rates or the budget a refund left", () => {
    const c = raw("1", [
      { from: "2026-11-02T00:00:00Z", perSecond: "2" },
      { from: "2026-11-08T23:59:55Z", perSecond: "3" },
    ]);
    // The final five seconds pay 3 per second; the rest of the week pays 2.
    const cap = 2n * BigInt(WEEK - 5) + 3n * 5n;
    const due = (total: bigint, budget = cap + 2n) =>
      dueReleases(
        [c],
        [
          { released: 0n, budget: 0n },
          { released: 300n, budget },
        ],
        new Map([["1", total]]),
        target,
      );
    expect(due(cap).due).toEqual([["1", cap]]);
    expect(() => due(cap + 1n)).toThrow(`campaign 1 emitted ${cap + 1n}, 1 over the cumulative rate cap`);
    expect(() => due(cap, cap - 2n)).toThrow(`campaign 1 emitted ${cap}, 2 over the budget a refund left it`);
  });
});

describe("revokedRoots", () => {
  it("names a revoked empty root by its file, so the empty files of later weeks still go through", async () => {
    const urd = "0x00000000000000000000000000000000000000ee" as Address;
    const hash = (n: number) => pad(numberToHex(n), { size: 32 });
    const root = hash(0xabc);
    const caller = ALICE;
    const set = (newRoot: Hex, newIpfsHash: Hex) =>
      encodeEventTopics({ abi: urdAbi, eventName: "PendingRootSet", args: { caller, newRoot, newIpfsHash } });
    const revoke = encodeEventTopics({ abi: urdAbi, eventName: "PendingRootRevoked", args: { caller } });
    // An empty root revoked, a real root revoked, and an empty root still pending.
    const logs = [set(zeroHash, hash(1)), revoke, set(root, hash(2)), revoke, set(zeroHash, hash(3))].map((topics) => ({
      address: urd,
      topics,
      data: "0x",
    }));
    const client = { getBlockNumber: async () => 100n, request: async () => logs } as unknown as PublicClient;

    const revoked = await revokedRoots(client, urd, 1n);
    expect(revoked).toEqual(new Set([revocationKey(zeroHash, hash(1)), root]));
    expect(revoked.has(revocationKey(zeroHash, hash(4)))).toBe(false);
    // A real root stays revoked under any file.
    expect(revoked.has(revocationKey(root, hash(5)))).toBe(true);
  });
});

describe("readAllCampaigns", () => {
  it("reads every campaign once across page boundaries", async () => {
    const ids = Array.from({ length: Number(CAMPAIGN_PAGE) * 2 + 50 }, (_, i) => i);
    const ranges: [bigint, bigint][] = [];
    const all = await readAllCampaigns(
      async () => BigInt(ids.length),
      async (from, to) => {
        ranges.push([from, to]);
        return ids.slice(Number(from), Number(to));
      },
    );
    expect(all).toEqual(ids);
    expect(ranges).toEqual([
      [0n, CAMPAIGN_PAGE],
      [CAMPAIGN_PAGE, 2n * CAMPAIGN_PAGE],
      [2n * CAMPAIGN_PAGE, 3n * CAMPAIGN_PAGE],
    ]);
    expect(
      await readAllCampaigns(
        async () => 0n,
        async () => [1],
      ),
    ).toEqual([]);
  });
});

describe("syncDistributor", () => {
  // A pending root, as when the Safe or a second run already proposed the next one, does not hold up the accepted root.
  it.each([false, true])(
    "pays the accepted root's releases, then settles the refunds that need them (pending: %s)",
    async (pendingNext) => {
      const root = pad("0xabc", { size: 32 });
      const cutoff = "2026-11-09T00:00:00Z";
      const proof = (n: number) => [pad(numberToHex(n), { size: 32 })];
      const file = {
        payoutChainId: 8453,
        cutoff,
        root,
        releases: {
          0: { emitted: "40", proof: proof(1) }, // Already paid.
          1: { emitted: "70", proof: proof(2) }, // Ended: its refund needs this release first.
          2: { emitted: "15", proof: proof(3) },
        },
        settlements: {
          1: { emitted: "70", proof: proof(4) },
          3: { emitted: "0", proof: proof(5) }, // Ended without emitting and already refunded.
        },
      };
      const onchain = [
        { budget: 1000n, released: 40n },
        { budget: 100n, released: 60n },
        { budget: 1000n, released: 0n },
        { budget: 0n, released: 0n },
      ];
      const calls: { functionName: string; args?: readonly unknown[] }[] = [];
      const payoutClient = {
        getBlock: async () => ({ timestamp: BigInt(Date.parse(cutoff) / 1000 + 7200) }),
        getBlockNumber: async () => 100n,
        readContract: async ({ functionName, args }: { functionName: string; args?: readonly bigint[] }) =>
          ({
            root,
            ipfsHash: pad("0x1234", { size: 32 }),
            campaignCount: BigInt(onchain.length),
            pendingRoot: pendingNext
              ? [root, pad("0x5678", { size: 32 }), BigInt(Date.parse(cutoff) / 1000 + 2 * 86400)]
              : [zeroHash, zeroHash, 0n],
            getCampaigns: args && onchain.slice(Number(args[0]), Number(args[1])).map((c) => ({ ...c })),
          })[functionName],
        simulateContract: async (request: unknown) => ({ request }),
        waitForTransactionReceipt: async () => ({ status: "success" }),
      } as unknown as PublicClient;
      const wallet = {
        account: { address: ALICE },
        writeContract: async (call: { functionName: string; args: readonly bigint[][] }) => {
          calls.push(call);
          // The registry's own accounting, as far as this cycle reads it.
          if (call.functionName === "release") {
            call.args[0].forEach((id, i) => {
              onchain[Number(id)].released = call.args[1][i];
            });
          }
          return "0xfeed";
        },
      } as unknown as Parameters<typeof syncDistributor>[0]["wallet"];

      const status = await syncDistributor({
        payoutChainId: 8453,
        payoutClient,
        wallet,
        clientFor: () => payoutClient,
        ipfs: { upload: async () => "", fetch: async () => JSON.stringify(file) },
        now: Date.parse(cutoff) / 1000 + 7200,
      });

      expect(calls.map(({ functionName, args }) => [functionName, args])).toEqual([
        ["release", [[1n, 2n], [70n, 15n], BigInt(Date.parse(cutoff) / 1000), [proof(2), proof(3)]]],
        ["settleRefund", [1n, 70n, proof(4)]],
      ]);
      expect(status).toMatch(pendingNext ? /waiting for the .* root to become valid/ : /up to date at/);
    },
  );
});

describe("computeWeeks", () => {
  // One Base position of width 120, in range from T0 on. The fake chain has one block per Monday from the hook
  // deployment block, which holds every event, and its head two weeks later.
  const source = SOURCE_CHAINS[8453];
  const first = source.fromBlock;
  const abi = parseAbi([
    "event Initialize(bytes32 indexed id, address indexed currency0, address indexed currency1, uint24 fee, int24 tickSpacing, address hooks, uint160 sqrtPriceX96, int24 tick)",
    "event ModifyLiquidity(bytes32 indexed id, address indexed sender, int24 tickLower, int24 tickUpper, int256 liquidityDelta, bytes32 salt)",
    "event Transfer(address indexed from, address indexed to, uint256 indexed id)",
  ]);
  const event = (
    address: Address,
    eventName: (typeof abi)[number]["name"],
    args: Record<string, unknown>,
    i: number,
  ) => {
    const inputs = (
      abi.find((item) => item.name === eventName)!.inputs as readonly (AbiParameter & { indexed?: boolean })[]
    ).filter((input) => !input.indexed);
    return {
      address,
      topics: encodeEventTopics({ abi, eventName, args } as Parameters<typeof encodeEventTopics>[0]),
      data: encodeAbiParameters(inputs, inputs.map((input) => args[input.name!]) as never),
      blockNumber: numberToHex(first),
      logIndex: numberToHex(i),
      blockTimestamp: numberToHex(T0),
    };
  };
  const { poolManager, positionManager } = source;
  const logs = [
    event(
      poolManager,
      "Initialize",
      {
        id: POOL,
        currency0: ALICE,
        currency1: TOKEN,
        fee: 3000,
        tickSpacing: 60,
        hooks: HOOK,
        sqrtPriceX96: 2n ** 96n,
        tick: 0,
      },
      0,
    ),
    event(positionManager, "Transfer", { from: ALICE, to: ALICE, id: 1n }, 1),
    event(
      poolManager,
      "ModifyLiquidity",
      { id: POOL, sender: positionManager, tickLower: -60, tickUpper: 60, liquidityDelta: 100n, salt: pad("0x1") },
      2,
    ),
  ];
  const client = {
    chain: { id: 8453 },
    getBlock: async ({ blockNumber = first + 2n } = {}) => ({
      number: blockNumber,
      timestamp: BigInt(T0 + Number(blockNumber - first) * WEEK),
    }),
    request: async ({ params: [filter] }: { params: [{ address: string; fromBlock: Hex; toBlock: Hex }] }) =>
      logs.filter(
        (l) =>
          l.address === filter.address &&
          BigInt(l.blockNumber) >= BigInt(filter.fromBlock) &&
          BigInt(l.blockNumber) <= BigInt(filter.toBlock),
      ),
  } as unknown as PublicClient;

  it("computes each missed week with the campaigns at its own cutoff", async () => {
    const weekOne: RawCampaign = {
      id: "0",
      chainId: 8453,
      payoutChainId: 8453,
      poolId: POOL,
      rewardToken: TOKEN,
      budget: "2000000",
      rates: [{ from: "2026-11-02T00:00:00Z", perSecond: "1" }],
      minWidthTicks: 0,
    };
    // The campaign ends a day into week two.
    const weekTwo = {
      ...weekOne,
      rates: [...weekOne.rates, { from: "2026-11-10T00:00:00Z", perSecond: "0" }],
    };
    const base = { payoutChainId: 8453, clientFor: () => client };
    const campaignsAt = async (cutoff: number) => (cutoff <= T0 + WEEK ? [weekOne] : [weekTwo]);

    const published = await computeWeek({ ...base, cutoff: T0 + WEEK, rawCampaigns: [weekOne] });
    const weekly = await computeWeek({ ...base, cutoff: T0 + 2 * WEEK, rawCampaigns: [weekTwo], previous: published });
    const caughtUp = await computeWeeks({ ...base, cutoff: T0 + 2 * WEEK, campaignsAt });

    expect(weekly.claims[ALICE][TOKEN].claimable).toBe(String(WEEK + 86_400));
    expect(caughtUp?.root).toBe(weekly.root);
    expect(await computeWeeks({ ...base, cutoff: T0, campaignsAt })).toBeUndefined();
  });
});
