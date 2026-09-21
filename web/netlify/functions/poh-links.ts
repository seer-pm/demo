import { SUPPORTED_CHAINS } from "@/lib/chains";
import { createClient } from "@supabase/supabase-js";
import { isAddress } from "viem";
import { pohSeerFromShare, projectedSeerFromShare } from "./utils/airdropAllocation";
import { isPohRegistered } from "./utils/airdropCalculation/getPOHVerifiedUsers";
import { verifyTokenWithChain } from "./utils/auth";
import { CORS_HEADERS } from "./utils/common";
import type { Database } from "./utils/supabase";

const supabase = createClient<Database>(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);

const jsonHeaders = { "Content-Type": "application/json", ...CORS_HEADERS };

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

/** Same set the airdrop is computed over (computeDailyAirdrop.ts AIRDROP_CHAINS), without its import graph. */
const AIRDROP_CHAIN_IDS = new Set(Object.keys(SUPPORTED_CHAINS).map(Number));

export type PohLinksResponse = {
  /** The caller's links, one per chain they were made on. A link applies to every chain without its own. */
  links: { chainId: number; pohAddress: string; createdAt: string }[];
  /** The caller is itself registered on PoH, so its share is its own and it cannot link. */
  selfVerified: boolean;
  /**
   * Estimated SEER from the PoH pool if the caller linked a profile: to date, and over the next 30
   * days at the latest snapshot. Null when not applicable (verified or already linked).
   */
  potential: { toDate: number; monthly: number } | null;
};

/**
 * The caller's own PoH links. Private: every query is filtered on the JWT address, and nothing here
 * is reachable for another wallet. get-airdrop-data-by-user is public and deliberately returns no
 * link data.
 *
 * A link says "the PoH share of my holdings goes to this PoH profile". It needs no consent from the
 * profile (it can only give that profile tokens), so the wallet's SIWE signature is the only
 * proof. The token must carry the chain it was signed on, and a link is only accepted for that
 * chain: a Safe at the same address can have different owners on another network.
 *
 * The effect is not immediate: the nightly refresh recomputes the whole PoH pool, all history
 * included, from the current links (supabase/sql/poh_links.sql).
 */
export default async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const auth = verifyTokenWithChain(req.headers.get("Authorization"));
  if (!auth) {
    return json({ error: "Unauthorized", code: "SIGN_IN_REQUIRED" }, 401);
  }
  const { address, chainId: tokenChainId } = auth;

  try {
    if (req.method === "GET") {
      return json(await getState(address), 200);
    }

    if (req.method === "POST") {
      const body = await req.json().catch(() => undefined);
      const chainId = Number(body?.chainId);
      const pohAddress = String(body?.pohAddress ?? "").toLowerCase();

      if (!AIRDROP_CHAIN_IDS.has(chainId)) {
        return json({ error: "Unsupported chain" }, 400);
      }
      if (chainId !== tokenChainId) {
        return json({ error: "Sign in on this chain to link it", code: "WRONG_CHAIN" }, 403);
      }
      if (!isAddress(pohAddress)) {
        return json({ error: "Invalid PoH address" }, 400);
      }
      if (pohAddress === address) {
        return json({ error: "A wallet cannot link to itself" }, 400);
      }
      const [selfVerified, targetVerified] = await Promise.all([isPohRegistered(address), isPohRegistered(pohAddress)]);
      if (selfVerified) {
        return json({ error: "This wallet is verified on Proof of Humanity and earns its own share" }, 400);
      }
      if (!targetVerified) {
        return json({ error: "This address has no active Proof of Humanity registration" }, 400);
      }

      const { error } = await supabase
        .from("poh_links")
        .upsert(
          { address, chain_id: chainId, poh_address: pohAddress, created_at: new Date().toISOString() },
          { onConflict: "address,chain_id" },
        );
      if (error) throw error;
      return json(await getState(address), 200);
    }

    if (req.method === "DELETE") {
      const body = await req.json().catch(() => undefined);
      const chainId = Number(body?.chainId);
      if (!AIRDROP_CHAIN_IDS.has(chainId)) {
        return json({ error: "Unsupported chain" }, 400);
      }
      // Removing needs no per-chain proof: it only ever returns the share to the caller's own wallet.
      const { error } = await supabase.from("poh_links").delete().eq("address", address).eq("chain_id", chainId);
      if (error) throw error;
      return json(await getState(address), 200);
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (error) {
    // biome-ignore lint/suspicious/noExplicitAny: error shape varies (PostgREST / fetch)
    const err = error as any;
    console.error("poh-links failed", { address, method: req.method, code: err?.code, message: err?.message });
    return json({ error: "Could not update Proof of Humanity link. Please try again." }, 500);
  }
};

async function getState(address: string): Promise<PohLinksResponse> {
  const [linksResult, selfVerified] = await Promise.all([
    supabase
      .from("poh_links")
      .select("chain_id,poh_address,created_at")
      .eq("address", address)
      .order("created_at", { ascending: false }),
    isPohRegistered(address),
  ]);
  if (linksResult.error) throw linksResult.error;
  const links = (linksResult.data ?? []).map((row) => ({
    chainId: row.chain_id,
    pohAddress: row.poh_address,
    createdAt: row.created_at,
  }));

  let potential: PohLinksResponse["potential"] = null;
  if (!selfVerified && links.length === 0) {
    const { data, error } = await supabase.rpc("get_poh_potential", { p_address: address }).single();
    if (error) throw error;
    potential = {
      toDate: pohSeerFromShare(Number(data?.to_date) || 0),
      monthly: projectedSeerFromShare(Number(data?.latest) || 0, 30),
    };
  }

  return { links, selfVerified, potential };
}
