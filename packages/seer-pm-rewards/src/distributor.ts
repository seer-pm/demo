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
  getAddress,
  zeroHash,
} from "viem";
import { toIsoSeconds } from "./campaigns.ts";
import { PAYOUT_CHAINS } from "./chains.ts";
import {
  IPFS_GATEWAY,
  type RewardsEstimate,
  bytes32ToCid,
  cidToBytes32,
  readAllCampaigns,
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

/** Every campaign of the registry at `address` as of the latest block, read in pages on that one block. */
async function readRegistry(client: PublicClient, address: Address) {
  const blockNumber = await client.getBlockNumber();
  const call = { address, abi: rewardCampaignsAbi, blockNumber } as const;
  return readAllCampaigns(
    () => client.readContract({ ...call, functionName: "campaignCount" }),
    (from, to) => client.readContract({ ...call, functionName: "getCampaigns", args: [from, to] }),
  );
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
 * 2. Has the registry release to the distributor what each campaign emitted according to the
 *    accepted root, whose release leaves prove it, then settles the refunds that root proves, even
 *    while another root is pending.
 * 3. Once a new week has settled and no root is pending, resumes from the file behind the current
 *    root and computes the week from the chain's registry campaigns as of the cutoff.
 * 4. Checks the distributor will hold enough to pay every unclaimed amount once that file's
 *    releases are paid, uploads the file to IPFS, checks it reads back, and submits its root, which
 *    becomes claimable, and its releases payable, after the timelock.
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
      | { functionName: "settleRefund"; args: readonly [bigint, bigint, Hex[]] }
      | { functionName: "release"; args: readonly [bigint[], bigint[], bigint, Hex[][]] },
  ) => {
    const { functionName } = call;
    const { request } = await payoutClient.simulateContract({
      ...call,
      ...(functionName === "release" || functionName === "settleRefund"
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
  const previous = state.ipfsHash === zeroHash ? undefined : await readFile(state.ipfsHash, state.root);
  const readCampaigns = () => readRegistry(payoutClient, registry.address);
  let onchain = await readCampaigns();
  // Paid right after the root is accepted, as its claims need these tokens, and before the settlements, which only
  // refund once the final total is released. Both come before the pending check: another updater (the Safe, or a
  // second run of this bot) may already have proposed the next root, and the accepted one still needs paying.
  const unpaid = Object.entries(previous?.releases ?? {}).filter(
    ([id, { emitted }]) => BigInt(emitted) > onchain[Number(id)].released,
  );
  if (previous && unpaid.length > 0) {
    const ids = unpaid.map(([id]) => BigInt(id));
    const tx = await send({
      functionName: "release",
      args: [
        ids,
        unpaid.map(([, { emitted }]) => BigInt(emitted)),
        BigInt(parseCutoff(previous.cutoff)),
        unpaid.map(([, { proof }]) => proof),
      ],
    });
    done.push(`released campaigns ${ids.join(", ")} up to ${previous.cutoff} in ${tx}`);
    onchain = await readCampaigns();
  }
  let refunded = false;
  for (const [id, settlement] of Object.entries(previous?.settlements ?? {})) {
    const { budget, released } = onchain[Number(id)];
    if (budget > released) {
      try {
        const tx = await send({
          functionName: "settleRefund",
          args: [BigInt(id), BigInt(settlement.emitted), settlement.proof],
        });
        done.push(`refunded campaign ${id} in ${tx}`);
        refunded = true;
      } catch (error) {
        // A token refusing the funder's transfer must not block publication for the other campaigns.
        done.push(`refund for campaign ${id} deferred: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }
  // A refund lowers the budget to what was released, and `dueReleases` must check the next root against that budget:
  // a release leaf above it would revert the whole batch once that root is accepted.
  if (refunded) onchain = await readCampaigns();
  if (state.pending.validAt !== 0n) {
    const pending = await readFile(state.pending.ipfsHash, state.pending.root);
    if (parseCutoff(pending.cutoff) < target) {
      // Submitting now would replace the pending root and restart its timelock.
      throw new Error(`the ${pending.cutoff} root is still pending until ${state.pending.validAt}; not submitting`);
    }
    return [...done, `waiting for the ${pending.cutoff} root to become valid at ${state.pending.validAt}`].join("; ");
  }

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

  // Checked before the root is proposed, since `release` reverts the whole batch once it is accepted.
  const { due, stuck } = dueReleases(rawCampaigns, onchain, emittedByCampaign(file.states), target);
  if (stuck.length > 0) {
    done.push(`campaigns ${stuck.join(", ")} emitted less than was already released to the distributor`);
  }

  if (!previous && file.root === zeroHash) {
    return [...done, `nothing earned or awaiting settlement by ${file.cutoff} yet`].join("; ");
  }

  // The distributor pays `claimable - claimed`, so this is what it must hold for everyone to claim, less what
  // this file's releases will send it once its root is accepted.
  const owed = new Map<Address, bigint>();
  for (const [id, total] of due) {
    const token = getAddress(rawCampaigns.find((c) => c.id === id)!.rewardToken);
    owed.set(token, (owed.get(token) ?? 0n) - (total - onchain[Number(id)].released));
  }
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
    if (amount <= 0n) continue;
    const balance = await payoutClient.readContract({
      address: token,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [address],
    });
    if (balance < amount) {
      throw new Error(
        `distributor holds ${balance} of ${token} but owes ${amount} beyond this week's releases: send ${amount - balance} more`,
      );
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

  const ipfsHash = cidToBytes32(cid);
  if (revoked.has(revocationKey(file.root, ipfsHash))) {
    throw new Error(`empty root for ${file.cutoff} (ipfs ${cid}) was revoked before; fix the campaigns or the engine`);
  }
  const tx = await send({ functionName: "submitRoot", args: [file.root, ipfsHash] });
  return [...done, `submitted root ${file.root} for ${file.cutoff} (ipfs ${cid}) in ${tx}`].join("; ");
}

/**
 * How long after a weekly cutoff, or after a pending root became valid, `watchDistributor` waits for the hourly bot
 * before it reports the week as stuck. A few runs fit in it, so a retried RPC or IPFS failure does not alert.
 */
export const WATCH_GRACE_SECONDS = 6 * 3600;

/**
 * Checks `payoutChainId`'s distributor against an independent recomputation, read-only. The 48 h timelock and the
 * Safe's veto are what stand between a wrong root, from a stolen updater key or a bot gone wrong, and the escrow, so
 * this is what tells the Safe to use them. Returns one alert per problem, each saying what to do, and none when all
 * is well:
 *
 * - A pending root that is not the root this code computes for its cutoff from the accepted file, or whose
 *   releases the registry would refuse once it is accepted. The Safe revokes it before it becomes valid.
 * - A pending root left unaccepted, or no root at all, well after it was due: the bot is failing.
 * - Releases of the accepted root still unpaid, which leaves its claims without funds.
 *
 * It replays the same engine as the bot, so it catches a root the bot did not compute but not a bug the engine
 * makes in both. Throws when it cannot check, which is worth an alert too.
 */
export async function watchDistributor({
  payoutChainId,
  payoutClient,
  clientFor,
  ipfs = klerosIpfs,
  now = Math.floor(Date.now() / 1000),
}: {
  payoutChainId: number;
  payoutClient: PublicClient;
  /** Public clients of the source chains. */
  clientFor: (chainId: number) => PublicClient;
  ipfs?: Ipfs;
  now?: number;
}): Promise<{ status: string; alerts: string[] }> {
  const { distributor, registry } = PAYOUT_CHAINS[payoutChainId] ?? {};
  if (!distributor || !registry) {
    return { status: "no distributor or campaign registry configured, skipped", alerts: [] };
  }
  const { address } = distributor;
  const [root, ipfsHash, [pendingRoot, pendingIpfsHash, validAt]] = await Promise.all([
    payoutClient.readContract({ address, abi: urdAbi, functionName: "root" }),
    payoutClient.readContract({ address, abi: urdAbi, functionName: "ipfsHash" }),
    payoutClient.readContract({ address, abi: urdAbi, functionName: "pendingRoot" }),
  ]);
  const active = ipfsHash === zeroHash ? undefined : await readRewardsFile(ipfs, ipfsHash, root, payoutChainId);
  const onchain = await readRegistry(payoutClient, registry.address);
  const alerts: string[] = [];
  const at = (t: bigint | number) => toIsoSeconds(Number(t));
  const expected = async (cutoff: number) =>
    computeWeeks({
      payoutChainId,
      campaignsAt: await campaignHistory(payoutClient, registry, payoutChainId, cutoff),
      cutoff,
      previous: active,
      clientFor,
    });

  const unpaid = Object.entries(active?.releases ?? {})
    .filter(([id, { emitted }]) => BigInt(emitted) > onchain[Number(id)].released)
    .map(([id]) => id);
  if (active && unpaid.length > 0) {
    const campaigns = unpaid.join(", ");
    alerts.push(
      `the accepted ${active.cutoff} root has unpaid releases for campaigns ${campaigns}, so their claims lack funds: check the rewards-distribution log, or call release with the file's proofs`,
    );
  }

  if (validAt !== 0n) {
    const pending = await readRewardsFile(ipfs, pendingIpfsHash, pendingRoot, payoutChainId);
    const cutoff = parseCutoff(pending.cutoff);
    const revoke = `revoke it from the Safe with revokePendingRoot before ${at(validAt)}`;
    if (active && cutoff <= parseCutoff(active.cutoff)) {
      alerts.push(
        `pending root ${pendingRoot} is for ${pending.cutoff}, not after the accepted ${active.cutoff}: ${revoke}`,
      );
    } else {
      const file = await expected(cutoff);
      if (file?.root !== pendingRoot) {
        const recomputed = file?.root ?? "nothing (no campaigns)";
        alerts.push(`pending root ${pendingRoot} for ${pending.cutoff} is not the recomputed ${recomputed}: ${revoke}`);
      } else {
        try {
          dueReleases(file.campaigns as RawCampaign[], onchain, emittedByCampaign(file.states), cutoff);
        } catch (error) {
          const reason = error instanceof Error ? error.message : String(error);
          alerts.push(
            `pending root ${pendingRoot} for ${pending.cutoff} would revert its release (${reason}): ${revoke}`,
          );
        }
      }
    }
    if (BigInt(now) >= validAt + BigInt(WATCH_GRACE_SECONDS)) {
      alerts.push(`pending root ${pendingRoot} is valid since ${at(validAt)} but not accepted: the bot is failing`);
    }
    return { status: `checked the pending ${pending.cutoff} root`, alerts };
  }

  const target = weekStart(now - SETTLE_SECONDS);
  if ((!active || parseCutoff(active.cutoff) < target) && now >= target + WATCH_GRACE_SECONDS) {
    // Before its first root, the bot proposes nothing while no campaign emitted or ended.
    const file = active ? undefined : await expected(target);
    if (active || (file && file.root !== zeroHash)) {
      alerts.push(`no root proposed for the ${at(target)} cutoff: the bot is failing`);
    }
  }
  return { status: active ? `accepted root is for ${active.cutoff}` : "no root yet", alerts };
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

/**
 * How `revokedRoots` names a revoked root: by the root, which a fixed file changes, except for the empty root, which
 * every file without claims shares. That one is named with its IPFS hash, which the cutoff in the file changes, so a
 * revoked empty file does not stop the empty files of later weeks.
 */
export const revocationKey = (root: Hex, ipfsHash: Hex): string => (root === zeroHash ? `${root}:${ipfsHash}` : root);

/** Every root that was pending and then revoked on the distributor, by `revocationKey`. */
export async function revokedRoots(client: PublicClient, address: Address, fromBlock: bigint): Promise<Set<string>> {
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
  const revoked = new Set<string>();
  let pending: string | undefined;
  for (const log of logs) {
    const event = decodeEventLog({ abi: urdAbi, topics: log.topics, data: log.data });
    if (event.eventName === "PendingRootSet") pending = revocationKey(event.args.newRoot, event.args.newIpfsHash);
    else if (pending) revoked.add(pending);
  }
  return revoked;
}
