import { REALITY_EVIDENCE_LIMIT, type RealityAnswerHistoryEntry, findRealityAnswer } from "@/lib/reality-evidence";
import { BASE_RPC, GNOSIS_RPC, MAINNET_RPC, OPTIMISM_RPC } from "@/lib/rpc";
import { realityAbi, realityAddress } from "@seer-pm/sdk/contracts/reality";
import { createClient } from "@supabase/supabase-js";
import { http, type Hex, createPublicClient, fallback, isAddress, isHash } from "viem";
import { verifyTokenWithChain } from "./utils/auth";
import { getChainById, getPublicClientByChainId, getRpcUrlByChainId } from "./utils/config";

const supabase = createClient(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);
type RealityChain = keyof typeof realityAddress;

// RealityETH lists these deployment blocks in packages/contracts/chains/deployments.
const realityDeploymentBlock: Record<RealityChain, bigint> = {
  1: 13_194_676n,
  10: 2_462_149n,
  100: 17_997_262n,
  8453: 26_260_675n,
  11155111: 3_044_431n,
};

// Question-filtered history needs a fallback when the primary RPC limits block ranges.
const historyFallbackRpc: Record<RealityChain, string> = {
  1: MAINNET_RPC,
  10: OPTIMISM_RPC,
  100: GNOSIS_RPC,
  8453: BASE_RPC,
  11155111: "https://sepolia.gateway.tenderly.co",
};

/** Returns a JSON error for the evidence endpoint. */
function errorResponse(error: string, status: number) {
  return Response.json({ error }, { status });
}

/** Loads a question’s Reality answers and attaches evidence by on-chain history hash. */
async function getHistory(chainId: RealityChain, questionId: Hex) {
  const address = realityAddress[chainId];
  const endpoints = new Set([getRpcUrlByChainId(chainId), historyFallbackRpc[chainId]]);
  const client = createPublicClient({
    chain: getChainById(chainId),
    transport: fallback(
      Array.from(endpoints, (url) => http(url, { timeout: 6_000 })),
      { retryCount: 1 },
    ),
  });
  const filter = {
    address,
    abi: realityAbi,
    fromBlock: realityDeploymentBlock[chainId],
    toBlock: "latest",
    args: { question_id: questionId },
    strict: true,
  } as const;
  const [answers, { data, error }] = await Promise.all([
    client.getContractEvents({ ...filter, eventName: "LogNewAnswer" }),
    supabase
      .from("reality_answer_evidence")
      .select("history_hash,body")
      .eq("chain_id", chainId)
      .eq("reality_address", address.toLowerCase())
      .eq("question_id", questionId),
  ]);
  if (error) console.error("Reality evidence lookup failed:", error.code);

  const notes = new Map((data ?? []).map((row) => [row.history_hash, row]));
  const revealed = answers.some(({ args }) => args.is_commitment)
    ? await client.getContractEvents({ ...filter, eventName: "LogAnswerReveal" })
    : [];
  const revealedByBond = new Map(revealed.map(({ args }) => [args.bond, args.answer]));

  const entries: RealityAnswerHistoryEntry[] = answers.reverse().map(({ args, transactionHash, logIndex }) => {
    const note = notes.get(args.history_hash.toLowerCase());
    return {
      id: `${transactionHash}-${logIndex}`,
      answer: args.is_commitment ? (revealedByBond.get(args.bond) ?? null) : args.answer,
      user: args.user,
      bond: args.bond.toString(),
      timestamp: Number(args.ts),
      transactionHash,
      evidence: note?.body,
    };
  });

  return Response.json({ entries, evidenceUnavailable: Boolean(error) });
}

/** Authenticates the answerer and creates an evidence note for their confirmed submission. */
async function saveEvidence(req: Request, chainId: RealityChain, questionId: Hex) {
  const auth = verifyTokenWithChain(req.headers.get("Authorization"));
  if (!auth || auth.chainId !== chainId || !isAddress(auth.address)) {
    return errorResponse("Sign in with the answer wallet on this chain.", 401);
  }

  const payload = await req.json().catch(() => null);
  const transactionHash = payload?.transactionHash;
  const answer = payload?.answer;
  const body = typeof payload?.body === "string" ? payload.body.trim() : "";
  if (!isHash(transactionHash) || !isHash(answer) || !body || body.length > REALITY_EVIDENCE_LIMIT) {
    return errorResponse("Provide a transaction, an answer, and valid evidence text.", 400);
  }

  const receipt = await getPublicClientByChainId(chainId).getTransactionReceipt({ hash: transactionHash });
  const event = findRealityAnswer(receipt, chainId, questionId, answer, auth.address);
  if (!event) return errorResponse("This transaction has no matching answer from the signed-in wallet.", 403);

  const { error } = await supabase.from("reality_answer_evidence").upsert(
    {
      chain_id: chainId,
      reality_address: event.address.toLowerCase(),
      question_id: questionId,
      history_hash: event.args.history_hash.toLowerCase(),
      body,
    },
    {
      onConflict: "chain_id,reality_address,question_id,history_hash",
      ignoreDuplicates: true,
    },
  );
  if (error) throw error;

  return new Response(null, { status: 204 });
}

/** Serves public answer history and authenticated evidence writes for a Reality question. */
export default async function realityAnswerEvidence(req: Request) {
  const params = new URL(req.url).searchParams;
  const chainId = Number(params.get("chainId")) as RealityChain;
  const questionId = params.get("questionId")?.toLowerCase();
  if (!(chainId in realityAddress) || !questionId || !isHash(questionId)) {
    return errorResponse("Provide a supported chain and Reality question ID.", 400);
  }

  try {
    if (req.method === "GET") return await getHistory(chainId, questionId);
    if (req.method === "POST") return await saveEvidence(req, chainId, questionId);
    return errorResponse("Method not allowed.", 405);
  } catch (error) {
    console.error("Reality answer evidence request failed:", {
      chainId,
      questionId,
      method: req.method,
      error: error instanceof Error ? error.name : "Storage error",
    });
    return errorResponse(req.method === "GET" ? "Couldn’t load answer history." : "Couldn’t save evidence.", 502);
  }
}
