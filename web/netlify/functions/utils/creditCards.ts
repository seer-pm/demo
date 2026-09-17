import { seerCreditsAddress } from "@seer-pm/sdk/contracts/trading-credits";
import { createClient } from "@supabase/supabase-js";
import {
  type Address,
  type Hex,
  TransactionReceiptNotFoundError,
  encodeFunctionData,
  erc20Abi,
  formatEther,
  keccak256,
  parseEther,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  estimateFeesPerGas,
  estimateGas,
  getBalance,
  getTransactionCount,
  getTransactionReceipt,
  prepareTransactionRequest,
  readContract,
  sendRawTransaction,
} from "viem/actions";
import { APP_URL, getPublicClientByChainId, getWalletClientForNetwork, gnosis } from "./config";
import { convertToSDAI } from "./sdai";

export const CREDIT_CARDS_CHAIN_ID = gnosis.id;

export const supabase = createClient(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);

export const GAS_DRIP_WEI = parseEther(process.env.CREDIT_CARDS_GAS_DRIP_XDAI || "0.02");
export const GAS_DRIP_THRESHOLD_WEI = parseEther(process.env.CREDIT_CARDS_GAS_DRIP_THRESHOLD_XDAI || "0.005");

// A broadcast tx with no receipt after this long is presumed dropped or replaced and gets resent.
const STALE_TX_MS = 3 * 60 * 1000;

export type CardStatus = "unclaimed" | "pending" | "sent" | "confirmed" | "failed";
export type DripStatus = "none" | "pending" | "sent" | "confirmed" | "failed" | "skipped";

export type CreditCardRow = {
  id: string;
  campaign_id: string;
  serial: string;
  code: string;
  amount_usd: number;
  status: CardStatus;
  claimed_by: string | null;
  claimed_at: string | null;
  credits_wei: string | null;
  tx_hash: string | null;
  tx_hashes: string[];
  tx_nonce: number | null;
  tx_sent_at: string | null;
  drip_status: DripStatus;
  drip_wei: string | null;
  drip_tx_hash: string | null;
  drip_tx_hashes: string[];
  drip_tx_nonce: number | null;
  drip_sent_at: string | null;
  error: string | null;
  updated_at: string;
};

export function claimUrl(code: string) {
  return `${APP_URL.replace(/\/$/, "")}/claim/${code}`;
}

/** Cards always pay out SEER_CREDITS, whatever credits profile the frontend runs with. */
export function getCreditsTokenAddress(): Address {
  return seerCreditsAddress[CREDIT_CARDS_CHAIN_ID];
}

export function getDistributorAccount() {
  const privateKey = process.env.CREDIT_CARDS_DISTRIBUTOR_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("Missing CREDIT_CARDS_DISTRIBUTOR_PRIVATE_KEY");
  }
  return privateKeyToAccount((privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`) as Hex);
}

/** 1 credit is backed by 1 sDAI, so a USD amount becomes the sDAI shares it buys today. */
export function usdToCreditsWei(usd: number) {
  return convertToSDAI(CREDIT_CARDS_CHAIN_ID, parseEther(String(usd)));
}

export async function getCreditsBalance(address: Address) {
  return readContract(getPublicClientByChainId(CREDIT_CARDS_CHAIN_ID), {
    address: getCreditsTokenAddress(),
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address],
  });
}

export async function getXdaiBalance(address: Address) {
  return getBalance(getPublicClientByChainId(CREDIT_CARDS_CHAIN_ID), { address });
}

/** Credits owed to claimed cards whose transfer has not confirmed, so they are not in anyone's balance yet. */
export async function getInFlightCreditsWei() {
  const { data, error } = await supabase.rpc("credit_cards_in_flight_wei");
  if (error) {
    throw error;
  }
  return BigInt(data ?? "0");
}

type Leg = "credits" | "drip";

// Unused gas is refunded, so a generous floor costs nothing and covers a first transfer to a fresh address.
const MIN_GAS: Record<Leg, bigint> = { credits: 80_000n, drip: 21_000n };

const LEG_COLUMNS = {
  credits: { status: "status", hash: "tx_hash", hashes: "tx_hashes", nonce: "tx_nonce", sentAt: "tx_sent_at" },
  drip: {
    status: "drip_status",
    hash: "drip_tx_hash",
    hashes: "drip_tx_hashes",
    nonce: "drip_tx_nonce",
    sentAt: "drip_sent_at",
  },
} as const;

function legState(card: CreditCardRow, leg: Leg) {
  return leg === "credits"
    ? {
        status: card.status,
        hash: card.tx_hash,
        hashes: card.tx_hashes,
        nonce: card.tx_nonce,
        sentAt: card.tx_sent_at,
      }
    : {
        status: card.drip_status,
        hash: card.drip_tx_hash,
        hashes: card.drip_tx_hashes,
        nonce: card.drip_tx_nonce,
        sentAt: card.drip_sent_at,
      };
}

/**
 * Moves one leg of a card from its current state to `updates`, only if no other process changed it first.
 * Every send goes through here, so a claim and the sweeper can never both broadcast the same card.
 */
async function transitionLeg(
  card: CreditCardRow,
  leg: Leg,
  updates: Record<string, string | string[] | number | null>,
) {
  const columns = LEG_COLUMNS[leg];
  const state = legState(card, leg);
  let query = supabase
    .from("credit_cards")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", card.id)
    .eq(columns.status, state.status);
  query = state.hash === null ? query.is(columns.hash, null) : query.eq(columns.hash, state.hash);
  const { data, error } = await query.select().maybeSingle();
  if (error) {
    throw error;
  }
  return (data as CreditCardRow | null) ?? null;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

async function recordError(card: CreditCardRow, error: unknown) {
  await supabase
    .from("credit_cards")
    .update({ error: errorMessage(error), updated_at: new Date().toISOString() })
    .eq("id", card.id);
}

// The node refused the tx outright, so it was never broadcast.
const REJECTED_TX = /nonce too low|nonce has already been used|underpriced/i;
const ALREADY_KNOWN_TX = /already known|known transaction/i;

async function buildLegTransaction(card: CreditCardRow, leg: Leg, nonce: number, bumpFees: boolean) {
  const account = getDistributorAccount();
  const publicClient = getPublicClientByChainId(CREDIT_CARDS_CHAIN_ID);
  const walletClient = getWalletClientForNetwork(account, CREDIT_CARDS_CHAIN_ID);
  const to = card.claimed_by as Address;

  let fees = {};
  if (bumpFees) {
    // Replacing a tx at the same nonce needs at least +10% on both fees.
    const estimated = await estimateFeesPerGas(publicClient);
    fees = {
      maxFeePerGas: (estimated.maxFeePerGas * 13n) / 10n,
      maxPriorityFeePerGas: (estimated.maxPriorityFeePerGas * 13n) / 10n,
    };
  }

  const call =
    leg === "credits"
      ? {
          to: getCreditsTokenAddress(),
          data: encodeFunctionData({ abi: erc20Abi, functionName: "transfer", args: [to, BigInt(card.credits_wei!)] }),
        }
      : { to, value: BigInt(card.drip_wei!) };
  // Estimated against `latest`, without the nonce. In the pending state a replacement's nonce is already taken
  // (some nodes reject the estimate for that alone) and the tx it replaces has already funded the recipient,
  // which makes a first transfer look cheaper than it is and the replacement runs out of gas.
  // A plain address: with a local account viem fills in the pending nonce, which `latest` then rejects.
  const estimated = await estimateGas(publicClient, { account: account.address, blockTag: "latest", ...call });
  const gas = [(estimated * 13n) / 10n, MIN_GAS[leg]].reduce((a, b) => (a > b ? a : b));

  const request = await prepareTransactionRequest(walletClient, {
    account,
    chain: walletClient.chain,
    nonce,
    gas,
    ...fees,
    ...call,
  });
  const serialized = await walletClient.signTransaction(request);
  return { serialized, hash: keccak256(serialized) };
}

/**
 * Signs, records and broadcasts one leg. The hash is stored as `sent` before broadcasting, so a crash or an
 * ambiguous RPC error can never lead to a second transfer: `reconcileLeg` decides later whether it landed.
 *
 * `replaceNonce` resends at the leg's current nonce (the previous tx may still be in a mempool, so exactly
 * one of them can land). Otherwise the leg has no live tx and takes the account's next nonce.
 */
async function sendLeg(card: CreditCardRow, leg: Leg, replaceNonce = false) {
  const account = getDistributorAccount();
  const publicClient = getPublicClientByChainId(CREDIT_CARDS_CHAIN_ID);
  const columns = LEG_COLUMNS[leg];
  let current = card;

  for (let attempt = 0; attempt < 3; attempt++) {
    const state = legState(current, leg);
    const nonce =
      replaceNonce && state.nonce !== null
        ? state.nonce
        : await getTransactionCount(publicClient, { address: account.address, blockTag: "pending" });

    let built: Awaited<ReturnType<typeof buildLegTransaction>>;
    try {
      built = await buildLegTransaction(current, leg, nonce, replaceNonce);
    } catch (error) {
      // Nothing was signed (gas estimation fails when the distributor lacks funds); retried on the next sweep.
      await recordError(current, error);
      return current;
    }

    const sent = await transitionLeg(current, leg, {
      [columns.status]: "sent",
      [columns.hash]: built.hash,
      [columns.hashes]: [...state.hashes, built.hash],
      [columns.nonce]: nonce,
      [columns.sentAt]: new Date().toISOString(),
      error: null,
    });
    if (!sent) {
      // Another process moved this card first.
      return current;
    }
    current = sent;

    try {
      await sendRawTransaction(publicClient, { serializedTransaction: built.serialized });
      return current;
    } catch (error) {
      const message = errorMessage(error);
      if (ALREADY_KNOWN_TX.test(message)) {
        return current;
      }
      if (replaceNonce || !REJECTED_TX.test(message)) {
        // Either the tx may be out there (timeout, RPC hiccup) or the one it tried to replace still is.
        // Stay `sent` and let reconciliation look at every recorded hash again later.
        await recordError(current, error);
        return current;
      }
      // A fresh nonce collided with a concurrent send: nothing of ours holds this nonce, so rebuild.
      const reverted = await transitionLeg(current, leg, {
        [columns.status]: "pending",
        [columns.hash]: null,
        [columns.sentAt]: null,
        error: message,
      });
      if (!reverted) {
        return current;
      }
      current = reverted;
    }
  }

  return current;
}

async function findReceipt(hash: Hex) {
  try {
    return await getTransactionReceipt(getPublicClientByChainId(CREDIT_CARDS_CHAIN_ID), { hash });
  } catch (error) {
    if (error instanceof TransactionReceiptNotFoundError) {
      return null;
    }
    throw error;
  }
}

/**
 * Settles a `sent` leg from the receipt of any tx signed for it. With `allowResend`, a leg left unmined past
 * `STALE_TX_MS` is resent: at a fresh nonce when its nonce was already consumed by a tx that is not ours (so
 * none of ours can land anymore), or as a replacement at the same nonce otherwise.
 */
async function reconcileLeg(card: CreditCardRow, leg: Leg, allowResend: boolean) {
  const state = legState(card, leg);
  if (state.status !== "sent" || !state.hash) {
    return card;
  }
  const columns = LEG_COLUMNS[leg];

  // Read the nonce before the receipts: a tx mined in between shows up as a receipt, never as a lost nonce.
  const confirmedNonce = allowResend
    ? await getTransactionCount(getPublicClientByChainId(CREDIT_CARDS_CHAIN_ID), {
        address: getDistributorAccount().address,
        blockTag: "latest",
      })
    : null;

  for (const hash of [...state.hashes].reverse()) {
    const receipt = await findReceipt(hash as Hex);
    if (receipt) {
      const success = receipt.status === "success";
      const settled = await transitionLeg(card, leg, {
        [columns.status]: success ? "confirmed" : "failed",
        [columns.hash]: hash,
        error: success ? null : "Transaction reverted",
      });
      return settled ?? card;
    }
  }

  if (confirmedNonce === null || !state.sentAt || Date.now() - new Date(state.sentAt).getTime() < STALE_TX_MS) {
    return card;
  }

  return sendLeg(card, leg, state.nonce !== null && confirmedNonce <= state.nonce);
}

/** Confirms whatever already landed, without sending anything. Cheap enough for the public status endpoint. */
export async function refreshCardReceipts(card: CreditCardRow) {
  let current = await reconcileLeg(card, "credits", false);
  current = await reconcileLeg(current, "drip", false);
  return current;
}

/** Sends a freshly claimed card: the credits first, then the gas drip if one was reserved. */
export async function deliverClaimedCard(card: CreditCardRow) {
  let current = await sendLeg(card, "credits");
  if (current.drip_status === "pending") {
    current = await sendLeg(current, "drip");
  }
  return current;
}

/** One sweeper pass over a card: settle or resend `sent` legs, send `pending` ones. */
export async function advanceCard(card: CreditCardRow) {
  let current = card;

  if (current.status === "sent") {
    current = await reconcileLeg(current, "credits", true);
  } else if (current.status === "pending") {
    current = await sendLeg(current, "credits");
  }

  if (current.drip_status === "sent") {
    current = await reconcileLeg(current, "drip", true);
  } else if (current.drip_status === "pending") {
    const recipientBalance = await getXdaiBalance(current.claimed_by as Address);
    if (recipientBalance >= GAS_DRIP_THRESHOLD_WEI) {
      current = (await transitionLeg(current, "drip", { drip_status: "skipped" })) ?? current;
    } else {
      current = await sendLeg(current, "drip");
    }
  }

  return current;
}

/** Clears a failed leg so the sweeper sends it again. A reverted tx is final, so its hashes can be dropped. */
export async function retryFailedCard(card: CreditCardRow) {
  const updates: Record<string, string | string[] | number | null> = {};
  if (card.status === "failed") {
    Object.assign(updates, { status: "pending", tx_hash: null, tx_hashes: [], tx_nonce: null, tx_sent_at: null });
  }
  if (card.drip_status === "failed") {
    Object.assign(updates, {
      drip_status: "pending",
      drip_tx_hash: null,
      drip_tx_hashes: [],
      drip_tx_nonce: null,
      drip_sent_at: null,
    });
  }
  if (Object.keys(updates).length === 0) {
    return null;
  }
  const { data, error } = await supabase
    .from("credit_cards")
    .update({ ...updates, error: null, updated_at: new Date().toISOString() })
    .eq("id", card.id)
    .select()
    .single();
  if (error) {
    throw error;
  }
  return data as CreditCardRow;
}

/** What the holder of a card's code may see about it. */
export function serializeClaimedCard(card: CreditCardRow) {
  return {
    serial: card.serial,
    amountUsd: card.amount_usd,
    credits: card.credits_wei ? formatEther(BigInt(card.credits_wei)) : null,
    status: card.status,
    txHash: card.tx_hash,
    dripStatus: card.drip_status,
    dripTxHash: card.drip_tx_hash,
    claimedBy: card.claimed_by,
    claimedAt: card.claimed_at,
  };
}
