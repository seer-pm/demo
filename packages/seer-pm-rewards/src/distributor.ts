import {
  type Account,
  type Address,
  type Chain,
  type Hex,
  type PublicClient,
  type Transport,
  type WalletClient,
  decodeEventLog,
  encodeEventTopics,
  erc20Abi,
  zeroHash,
} from "viem";
import { toIsoSeconds } from "./campaigns.ts";
import { PAYOUT_CHAINS } from "./chains.ts";
import {
  IPFS_GATEWAY,
  type RewardsEstimate,
  bytes32ToCid,
  cidToBytes32,
  rewardCampaignsAbi,
  urdAbi,
} from "./claims.ts";
import { weekStart } from "./engine.ts";
import { getLogs } from "./events.ts";
import { type RawCampaign, campaignHistory, dueReleases, emittedByCampaign } from "./registry.ts";
import { type RewardsFile, computeWeek, computeWeeks, parseCutoff } from "./week.ts";

export * from "./claims.ts";

export type Ipfs = {
  /** Uploads and pins `data`, returning its CIDv0. */
  upload: (fileName: string, data: string) => Promise<string>;
  fetch: (cid: string) => Promise<string>;
};

/** The Kleros endpoint and gateway the app already uses for Curate items (`web/src/lib/ipfs-publish.ts`). */
export const klerosIpfs: Ipfs = {
  async upload(fileName, data) {
    const body = new FormData();
    body.append("file", new Blob([data]), fileName);
    const res = await fetch(
      "https://kleros-api.netlify.app/.netlify/functions/upload-to-ipfs?operation=file&pinToGraph=false",
      { method: "POST", body },
    );
    if (!res.ok) throw new Error(`IPFS upload failed: ${res.status} ${await res.text()}`);
    const { cids } = (await res.json()) as { cids?: string[] };
    if (!cids?.[0]) throw new Error("IPFS upload returned no CID");
    return cids[0].replace(/^\/ipfs\//, "");
  },
  async fetch(cid) {
    const res = await fetch(`${IPFS_GATEWAY}${cid}`, { signal: AbortSignal.timeout(60_000) });
    if (!res.ok) throw new Error(`IPFS fetch of ${cid} failed: ${res.status}`);
    return res.text();
  },
};

/** The file behind `root` on `payoutChainId`'s distributor, whose `ipfsHash` is `hash`. */
async function readRewardsFile(ipfs: Ipfs, hash: Hex, root: Hex, payoutChainId: number): Promise<RewardsFile> {
  const file: RewardsFile = JSON.parse(await ipfs.fetch(bytes32ToCid(hash)));
  if (file.root !== root || file.payoutChainId !== payoutChainId) {
    throw new Error(`IPFS file ${bytes32ToCid(hash)} is not the one behind root ${root} on chain ${payoutChainId}`);
  }
  return file;
}

/** Seconds to wait after the Monday cutoff so the blocks before it are final on every source chain. */
export const SETTLE_SECONDS = 3600;

type UpdaterWallet = WalletClient<Transport, Chain, Account>;

/**
 * One step of the weekly cycle on `payoutChainId`'s distributor. Run it often (the Netlify job runs
 * it hourly); it does at most what is due and is safe to repeat:
 *
 * 1. Accepts the pending root once its timelock is over (anyone may; the bot does it so claims open
 *    on time).
 * 2. Once a new week has settled and no root is pending, resumes from the file behind the current
 *    root and computes the week from the chain's registry campaigns as of the cutoff.
 * 3. Has the registry release to the distributor what each campaign emitted, then checks the
 *    distributor holds enough to pay every unclaimed amount.
 * 4. Uploads the file to IPFS, checks it reads back, and submits its root, which becomes claimable
 *    after the timelock.
 *
 * It never resubmits a root that was revoked, so revoking a bad root stops it until the campaigns
 * or the engine are fixed. Returns what it did, for the logs.
 */
export async function syncDistributor({
  payoutChainId,
  payoutClient,
  wallet,
  clientFor,
  ipfs = klerosIpfs,
  now = Math.floor(Date.now() / 1000),
}: {
  payoutChainId: number;
  payoutClient: PublicClient;
  wallet: UpdaterWallet;
  /** Public clients of the source chains. */
  clientFor: (chainId: number) => PublicClient;
  ipfs?: Ipfs;
  now?: number;
}): Promise<string> {
  const { distributor, registry } = PAYOUT_CHAINS[payoutChainId] ?? {};
  if (!distributor) return "no distributor configured, skipped";
  if (!registry) return "no campaign registry configured, skipped";
  const { address } = distributor;

  const read = async () => {
    const [root, ipfsHash, [pendingRoot, pendingIpfsHash, validAt]] = await Promise.all([
      payoutClient.readContract({ address, abi: urdAbi, functionName: "root" }),
      payoutClient.readContract({ address, abi: urdAbi, functionName: "ipfsHash" }),
      payoutClient.readContract({ address, abi: urdAbi, functionName: "pendingRoot" }),
    ]);
    return { root, ipfsHash, pending: { root: pendingRoot, ipfsHash: pendingIpfsHash, validAt } };
  };
  const readFile = (hash: Hex, root: Hex) => readRewardsFile(ipfs, hash, root, payoutChainId);
  const send = async (
    call:
      | { functionName: "acceptRoot" }
      | { functionName: "submitRoot"; args: readonly [Hex, Hex] }
      | { functionName: "release"; args: readonly [bigint[], bigint[], bigint] },
  ) => {
    const { functionName } = call;
    const { request } = await payoutClient.simulateContract({
      ...call,
      ...(functionName === "release"
        ? { address: registry.address, abi: rewardCampaignsAbi }
        : { address, abi: urdAbi }),
      account: wallet.account,
    } as Parameters<PublicClient["simulateContract"]>[0]);
    const hash = await wallet.writeContract(request as Parameters<UpdaterWallet["writeContract"]>[0]);
    const receipt = await payoutClient.waitForTransactionReceipt({ hash });
    if (receipt.status !== "success") throw new Error(`${functionName} reverted in ${hash}`);
    return hash;
  };

  const done: string[] = [];
  let state = await read();
  const { timestamp: chainNow } = await payoutClient.getBlock();
  if (state.pending.validAt !== 0n && chainNow >= state.pending.validAt) {
    try {
      done.push(`accepted root ${state.pending.root} in ${await send({ functionName: "acceptRoot" })}`);
    } catch (error) {
      // Anyone can accept, so someone may have done it first.
      if ((await read()).pending.validAt !== 0n) throw error;
    }
    state = await read();
  }

  const target = weekStart(now - SETTLE_SECONDS);
  if (state.pending.validAt !== 0n) {
    const pending = await readFile(state.pending.ipfsHash, state.pending.root);
    if (parseCutoff(pending.cutoff) < target) {
      // Submitting now would replace the pending root and restart its timelock.
      throw new Error(`the ${pending.cutoff} root is still pending until ${state.pending.validAt}; not submitting`);
    }
    return [...done, `waiting for the ${pending.cutoff} root to become valid at ${state.pending.validAt}`].join("; ");
  }

  const previous = state.ipfsHash === zeroHash ? undefined : await readFile(state.ipfsHash, state.root);
  if (previous && parseCutoff(previous.cutoff) >= target) {
    return [...done, `up to date at ${previous.cutoff}`].join("; ");
  }

  const file = await computeWeeks({
    payoutChainId,
    campaignsAt: await campaignHistory(payoutClient, registry, payoutChainId, target),
    cutoff: target,
    previous,
    clientFor,
  });
  if (!file) return [...done, `no campaigns by ${toIsoSeconds(target)}`].join("; ");
  const rawCampaigns = file.campaigns as RawCampaign[];

  const revoked = await revokedRoots(payoutClient, address, distributor.fromBlock);
  if (revoked.has(file.root)) {
    throw new Error(`root ${file.root} for ${file.cutoff} was revoked before; fix the campaigns or the engine first`);
  }

  // Released before the root so the distributor can pay it, and before the empty-root return below so a
  // campaign that ended without emitting anything still gets the release the rest of its refund waits for.
  const releases = await payoutClient.readContract({
    address: registry.address,
    abi: rewardCampaignsAbi,
    functionName: "getReleases",
  });
  const due = dueReleases(rawCampaigns, releases, emittedByCampaign(file.states));
  if (due.length > 0) {
    const ids = due.map(([id]) => BigInt(id));
    const tx = await send({ functionName: "release", args: [ids, due.map(([, e]) => e), BigInt(target)] });
    done.push(`released campaigns ${ids.join(", ")} up to ${file.cutoff} in ${tx}`);
  }

  if (!previous && file.root === zeroHash) {
    // An empty first root would only hold back the first real one for a whole timelock.
    return [...done, `nothing earned by ${file.cutoff} yet`].join("; ");
  }

  // The distributor pays `claimable - claimed`, so this is what it must hold for everyone to claim.
  const owed = new Map<Address, bigint>();
  const leaves = Object.entries(file.claims).flatMap(([account, tokens]) =>
    Object.entries(tokens).map(([token, { claimable }]) => ({
      account: account as Address,
      token: token as Address,
      claimable: BigInt(claimable),
    })),
  );
  for (let i = 0; i < leaves.length; i += 50) {
    const batch = leaves.slice(i, i + 50);
    const claimed = await Promise.all(
      batch.map(({ account, token }) =>
        payoutClient.readContract({ address, abi: urdAbi, functionName: "claimed", args: [account, token] }),
      ),
    );
    batch.forEach(({ token, claimable }, j) => owed.set(token, (owed.get(token) ?? 0n) + claimable - claimed[j]));
  }
  for (const [token, amount] of owed) {
    const balance = await payoutClient.readContract({
      address: token,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [address],
    });
    if (balance < amount) {
      throw new Error(`distributor holds ${balance} of ${token} but owes ${amount}: send ${amount - balance} more`);
    }
  }

  const json = JSON.stringify(file);
  const cid = await ipfs.upload(`seer-rewards-${payoutChainId}-${file.cutoff.slice(0, 10)}.json`, json);
  // Next week's run and the claim UI find the file through this CID, so it must be readable first.
  for (let attempt = 1; ; attempt++) {
    try {
      if ((await ipfs.fetch(cid)) === json) break;
      throw new Error(`IPFS returned different content for ${cid}`);
    } catch (error) {
      if (attempt === 5) throw error;
      await new Promise((resolve) => setTimeout(resolve, 10_000));
    }
  }

  const tx = await send({ functionName: "submitRoot", args: [file.root, cidToBytes32(cid)] });
  return [...done, `submitted root ${file.root} for ${file.cutoff} (ipfs ${cid}) in ${tx}`].join("; ");
}

/**
 * What every account has earned on `payoutChainId` up to the latest block. It resumes from the
 * newest published file (the pending one, else the active one), catches up any week the bot has
 * not published yet, and replays the current week up to the chain head with the registry's
 * campaigns as they are now: the same computation as the next root, read-only. A budget change
 * before the next Monday applies to the whole week in the weekly run, so the final amount can
 * still differ from the estimate. Undefined when the chain has no distributor, registry or
 * campaign yet.
 */
export async function estimateRewards({
  payoutChainId,
  payoutClient,
  clientFor,
  ipfs = klerosIpfs,
}: {
  payoutChainId: number;
  payoutClient: PublicClient;
  /** Public clients of the source chains. */
  clientFor: (chainId: number) => PublicClient;
  ipfs?: Ipfs;
}): Promise<RewardsEstimate | undefined> {
  const { distributor, registry } = PAYOUT_CHAINS[payoutChainId] ?? {};
  if (!distributor || !registry) return undefined;
  const { address } = distributor;

  const [root, ipfsHash, [pendingRoot, pendingIpfsHash, validAt]] = await Promise.all([
    payoutClient.readContract({ address, abi: urdAbi, functionName: "root" }),
    payoutClient.readContract({ address, abi: urdAbi, functionName: "ipfsHash" }),
    payoutClient.readContract({ address, abi: urdAbi, functionName: "pendingRoot" }),
  ]);
  const newest =
    validAt !== 0n
      ? await readRewardsFile(ipfs, pendingIpfsHash, pendingRoot, payoutChainId)
      : ipfsHash === zeroHash
        ? undefined
        : await readRewardsFile(ipfs, ipfsHash, root, payoutChainId);

  const now = Number((await payoutClient.getBlock()).timestamp);
  const campaignsAt = await campaignHistory(payoutClient, registry, payoutChainId, now);
  if ((await campaignsAt(now)).length === 0) return undefined;

  // Whole weeks first, each with the campaigns of its own cutoff, as the weekly run computes them.
  const lastMonday = weekStart(now);
  const weekly =
    newest && parseCutoff(newest.cutoff) >= lastMonday
      ? newest
      : await computeWeeks({ payoutChainId, campaignsAt, cutoff: lastMonday, previous: newest, clientFor });
  const file =
    weekly && parseCutoff(weekly.cutoff) >= now
      ? weekly
      : await computeWeek({
          payoutChainId,
          rawCampaigns: await campaignsAt(now),
          cutoff: now,
          previous: weekly,
          clientFor,
        });

  return {
    payoutChainId,
    asOf: file.cutoff,
    claims: Object.fromEntries(
      Object.entries(file.claims).map(([account, tokens]) => [
        account,
        Object.fromEntries(Object.entries(tokens).map(([token, { claimable }]) => [token, claimable])),
      ]),
    ) as RewardsEstimate["claims"],
    emitted: Object.fromEntries([...emittedByCampaign(file.states)].map(([id, total]) => [id, total.toString()])),
  };
}

/** Every root that was pending and then revoked on the distributor. */
async function revokedRoots(client: PublicClient, address: Address, fromBlock: bigint): Promise<Set<Hex>> {
  const topics = (["PendingRootSet", "PendingRootRevoked"] as const).map(
    (eventName) => encodeEventTopics({ abi: urdAbi, eventName })[0],
  );
  const logs = await getLogs(
    client,
    { address, topics: [topics] },
    fromBlock,
    await client.getBlockNumber(),
    1_000_000n,
  );
  const revoked = new Set<Hex>();
  let pending: Hex | undefined;
  for (const log of logs) {
    const event = decodeEventLog({ abi: urdAbi, topics: log.topics, data: log.data });
    if (event.eventName === "PendingRootSet") pending = event.args.newRoot;
    else if (pending) revoked.add(pending);
  }
  return revoked;
}
