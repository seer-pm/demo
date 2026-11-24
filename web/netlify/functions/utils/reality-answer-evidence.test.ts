import { realityAbi, realityAddress } from "@seer-pm/sdk/contracts/reality";
import { type Hex, type TransactionReceipt, encodeAbiParameters, encodeEventTopics, numberToHex } from "viem";
import { gnosis } from "viem/chains";
import { beforeEach, describe, expect, it, vi } from "vitest";
import handler from "../reality-answer-evidence.mts";

const mocks = vi.hoisted(() => ({
  verifyTokenWithChain: vi.fn(),
  getTransactionReceipt: vi.fn(),
  getContractEvents: vi.fn(),
  select: vi.fn(),
  upsert: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ from: () => ({ select: mocks.select, upsert: mocks.upsert }) }),
}));
vi.mock("./auth", () => ({ verifyTokenWithChain: mocks.verifyTokenWithChain }));
vi.mock("./config", () => ({
  getChainById: () => gnosis,
  getRpcUrlByChainId: () => gnosis.rpcUrls.default.http[0],
  getPublicClientByChainId: () => ({ getTransactionReceipt: mocks.getTransactionReceipt }),
}));
vi.mock("viem", async (importOriginal) => ({
  ...(await importOriginal<typeof import("viem")>()),
  createPublicClient: () => ({ getContractEvents: mocks.getContractEvents }),
}));

const author = "0x1234567890000000000000000000000000000000";
const questionId = numberToHex(1, { size: 32 });
const answer = numberToHex(0, { size: 32 });
const transactionHash = numberToHex(2, { size: 32 });
const historyHash = numberToHex(3, { size: 32 });
const url = `https://seer.test/.netlify/functions/reality-answer-evidence?chainId=${gnosis.id}&questionId=${questionId}`;

/** Creates a strict ABI-encoded receipt log with configurable Reality event fields. */
function answerLog({
  address = realityAddress[gnosis.id],
  bond = 1n,
  commitment = false,
}: { address?: Hex; bond?: bigint; commitment?: boolean } = {}): TransactionReceipt["logs"][number] {
  return {
    address,
    blockHash: numberToHex(4, { size: 32 }),
    blockNumber: 17_997_263n,
    logIndex: 0,
    transactionIndex: 0,
    transactionHash,
    removed: false,
    topics: encodeEventTopics({
      abi: realityAbi,
      eventName: "LogNewAnswer",
      args: { question_id: questionId, user: author },
    }) as TransactionReceipt["logs"][number]["topics"],
    data: encodeAbiParameters(
      [{ type: "bytes32" }, { type: "bytes32" }, { type: "uint256" }, { type: "uint256" }, { type: "bool" }],
      [answer, historyHash, bond, 1n, commitment],
    ),
  };
}

/** Sends the same evidence payload a Seer user can retry after confirmation. */
function saveRequest() {
  return new Request(url, { method: "POST", body: JSON.stringify({ answer, transactionHash, body: "Source link" }) });
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.verifyTokenWithChain.mockReturnValue({ address: author, chainId: gnosis.id });
  mocks.getTransactionReceipt.mockResolvedValue({ status: "success", transactionHash, logs: [answerLog()] });
  mocks.upsert.mockResolvedValue({ error: null });
});

describe("Reality answer evidence", () => {
  it("stores the event hash from the receipt and treats a repeated save as an insert-only upsert", async () => {
    expect((await handler(saveRequest())).status).toBe(204);
    expect((await handler(saveRequest())).status).toBe(204);
    expect(mocks.upsert).toHaveBeenCalledTimes(2);
    expect(mocks.upsert).toHaveBeenLastCalledWith(
      {
        chain_id: gnosis.id,
        reality_address: realityAddress[gnosis.id].toLowerCase(),
        question_id: questionId,
        history_hash: historyHash,
        body: "Source link",
      },
      { onConflict: "chain_id,reality_address,question_id,history_hash", ignoreDuplicates: true },
    );
  });

  it("rejects a session from a different chain before reading a receipt", async () => {
    mocks.verifyTokenWithChain.mockReturnValue({ address: author, chainId: 1 });
    expect((await handler(saveRequest())).status).toBe(401);
    expect(mocks.getTransactionReceipt).not.toHaveBeenCalled();
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it.each([
    { status: "reverted", logs: [answerLog()] },
    { status: "success", logs: [answerLog({ address: author })] },
    { status: "success", logs: [answerLog({ bond: 0n })] },
    { status: "success", logs: [answerLog({ commitment: true })] },
  ])("rejects a receipt without a successful paid Reality answer", async (receipt) => {
    mocks.getTransactionReceipt.mockResolvedValue(receipt);
    expect((await handler(saveRequest())).status).toBe(403);
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("matches evidence to the exact history hash when two submissions have the same answer", async () => {
    const secondHash = numberToHex(5, { size: 32 });
    const log = {
      transactionHash,
      logIndex: 0,
      args: { answer, history_hash: historyHash, user: author, ts: 1n, bond: 1n, is_commitment: false },
    };
    mocks.getContractEvents.mockResolvedValue([
      log,
      {
        transactionHash: secondHash,
        logIndex: 0,
        args: { ...log.args, history_hash: secondHash, ts: 2n, bond: 2n },
      },
    ]);
    const lastFilter = vi.fn().mockResolvedValue({ data: [{ history_hash: historyHash, body: "Source link" }] });
    mocks.select.mockReturnValue({ eq: () => ({ eq: () => ({ eq: lastFilter }) }) });

    const response = await handler(new Request(url));
    expect(response.status).toBe(200);
    expect((await response.json()).entries).toMatchObject([
      { transactionHash: secondHash, answer, bond: "2" },
      { transactionHash, answer, bond: "1", evidence: "Source link" },
    ]);
    expect(lastFilter).toHaveBeenCalledWith("question_id", questionId);
  });
});
