import { base58 } from "@scure/base";
import {
  type Account,
  type Address,
  type Chain,
  type Hex,
  type PublicClient,
  type Transport,
  type WalletClient,
  concat,
  decodeEventLog,
  encodeEventTopics,
  erc20Abi,
  hexToBytes,
  parseAbi,
  toHex,
  zeroHash,
} from "viem";
import { PAYOUT_CHAINS } from "./chains.ts";
import { weekStart } from "./engine.ts";
import { getLogs } from "./events.ts";
import { type RewardsFile, computeWeek, parseCutoff } from "./week.ts";

export { PAYOUT_CHAINS } from "./chains.ts";
export type { RewardsFile } from "./week.ts";

/** The parts of the Morpho Universal Rewards Distributor the bot uses. */
export const urdAbi = parseAbi([
  "function root() view returns (bytes32)",
  "function ipfsHash() view returns (bytes32)",
  "function pendingRoot() view returns (bytes32 root, bytes32 ipfsHash, uint256 validAt)",
  "function claimed(address account, address reward) view returns (uint256)",
  "function submitRoot(bytes32 newRoot, bytes32 newIpfsHash)",
  "function acceptRoot()",
  "event PendingRootSet(address indexed caller, bytes32 indexed newRoot, bytes32 indexed newIpfsHash)",
  "event PendingRootRevoked(address indexed caller)",
]);

/**
 * The distributor's `ipfsHash` is the sha256 digest of the file's CIDv0, so anyone can find the
 * file behind a root: CID = base58(0x1220 ‖ ipfsHash).
 */
export function bytes32ToCid(hash: Hex): string {
  return base58.encode(hexToBytes(concat(["0x1220", hash])));
}

export function cidToBytes32(cid: string): Hex {
  const bytes = base58.decode(cid.replace(/^\/ipfs\//, ""));
  if (bytes.length !== 34 || bytes[0] !== 0x12 || bytes[1] !== 0x20) throw new Error(`${cid} is not a CIDv0`);
  return toHex(bytes.slice(2));
}

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
    const res = await fetch(`https://cdn.kleros.link/ipfs/${cid}`, { signal: AbortSignal.timeout(60_000) });
    if (!res.ok) throw new Error(`IPFS fetch of ${cid} failed: ${res.status}`);
    return res.text();
  },
};

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
 *    root, computes the week and checks the distributor holds enough to pay every unclaimed amount.
 * 3. Uploads the file to IPFS, checks it reads back, and submits its root, which becomes claimable
 *    after the timelock.
 *
 * It never resubmits a root that was revoked, so revoking a bad root stops it until the campaigns
 * or the engine are fixed. Returns what it did, for the logs.
 */
export async function syncDistributor({
  payoutChainId,
  rawCampaigns,
  payoutClient,
  wallet,
  clientFor,
  ipfs = klerosIpfs,
  now = Math.floor(Date.now() / 1000),
}: {
  payoutChainId: number;
  rawCampaigns: { payoutChainId?: unknown; chainId?: unknown }[];
  payoutClient: PublicClient;
  wallet: UpdaterWallet;
  /** Public clients of the source chains. */
  clientFor: (chainId: number) => PublicClient;
  ipfs?: Ipfs;
  now?: number;
}): Promise<string> {
  const distributor = PAYOUT_CHAINS[payoutChainId]?.distributor;
  if (!distributor) return "no distributor configured, skipped";
  const { address } = distributor;

  const read = async () => {
    const [root, ipfsHash, [pendingRoot, pendingIpfsHash, validAt]] = await Promise.all([
      payoutClient.readContract({ address, abi: urdAbi, functionName: "root" }),
      payoutClient.readContract({ address, abi: urdAbi, functionName: "ipfsHash" }),
      payoutClient.readContract({ address, abi: urdAbi, functionName: "pendingRoot" }),
    ]);
    return { root, ipfsHash, pending: { root: pendingRoot, ipfsHash: pendingIpfsHash, validAt } };
  };
  const readFile = async (hash: Hex, root: Hex): Promise<RewardsFile> => {
    const file: RewardsFile = JSON.parse(await ipfs.fetch(bytes32ToCid(hash)));
    if (file.root !== root || file.payoutChainId !== payoutChainId) {
      throw new Error(`IPFS file ${bytes32ToCid(hash)} is not the one behind root ${root} on chain ${payoutChainId}`);
    }
    return file;
  };
  const send = async (functionName: "acceptRoot" | "submitRoot", args?: readonly [Hex, Hex]) => {
    const { request } = await payoutClient.simulateContract({
      address,
      abi: urdAbi,
      functionName,
      args,
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
      done.push(`accepted root ${state.pending.root} in ${await send("acceptRoot")}`);
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

  const file = await computeWeek({ payoutChainId, rawCampaigns, cutoff: target, previous, clientFor });
  if (!previous && file.root === zeroHash) {
    // An empty first root would only hold back the first real one for a whole timelock.
    return [...done, `nothing earned by ${file.cutoff} yet`].join("; ");
  }

  const revoked = await revokedRoots(payoutClient, address, distributor.fromBlock);
  if (revoked.has(file.root)) {
    throw new Error(`root ${file.root} for ${file.cutoff} was revoked before; fix the campaigns or the engine first`);
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

  const tx = await send("submitRoot", [file.root, cidToBytes32(cid)]);
  return [...done, `submitted root ${file.root} for ${file.cutoff} (ipfs ${cid}) in ${tx}`].join("; ");
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
