import { QuestionsQueryQuery, getSdk as getRealitySdk } from "@/hooks/queries/gql-generated-reality";
import { SupportedChain } from "@/lib/chains";
import { realityGraphQLClient } from "@/lib/subgraph";
import { Address } from "viem";

type ClaimQuestion = QuestionsQueryQuery["questions"][0];

interface ClaimableItem {
  total: bigint;
  question_ids: `0x${string}`[];
  answer_lengths: bigint[];
  answers: `0x${string}`[];
  answerers: Address[];
  bonds: bigint[];
  history_hashes: `0x${string}`[];
}

export async function getRealityClaimArgs(account: `0x${string}`, chainId: SupportedChain) {
  const sdk = getRealitySdk(realityGraphQLClient(chainId)!);
  // TODO: paginate claims if the user has more than 1000 claims

  // get claims already made
  const { claims } = await sdk.ClaimsQuery({ user: account.toLowerCase() as `0x${string}` });

  const questionIds = claims.map((claim) => claim.question.id);

  if (questionIds.length === 0) {
    // we need to add an empty element, otherwise `question_not_in: []` returns nothing instead of returning all the questions
    questionIds.push("");
  }

  // get questionsIds not claimed
  const { userActions } = await sdk.UserActionsQuery({ user: account.toLowerCase() as `0x${string}`, questionIds });

  const unclaimedQuestionIds = userActions.map((data) => data.question!.questionId);

  // get questions
  const now = Math.floor(Date.now() / 1000);

  const { questions } = await sdk.QuestionsQuery({
    questionIds: unclaimedQuestionIds,
    answerFinalizedTimestamp: String(now),
  });

  const claimableItems = questions
    .map((q) => possibleClaimableItems(q, account))
    .filter((qi): qi is ClaimableItem => qi !== false);

  return mergeClaimableItems(claimableItems);
}

function mergeClaimableItems(claimableItems: ClaimableItem[]): ClaimableItem {
  const combined: ClaimableItem = {
    total: 0n,
    question_ids: [],
    answer_lengths: [],
    answers: [],
    answerers: [],
    bonds: [],
    history_hashes: [],
  };

  for (const item of claimableItems) {
    combined["total"] = combined["total"] + item.total;
    combined["question_ids"].push(...item.question_ids);
    combined["answer_lengths"].push(...item.answer_lengths);
    combined["answers"].push(...item.answers);
    combined["answerers"].push(...item.answerers);
    combined["bonds"].push(...item.bonds);
    combined["history_hashes"].push(...item.history_hashes);
  }

  return combined;
}

function possibleClaimableItems(question_detail: ClaimQuestion, account: string): ClaimableItem | false {
  let ttl = 0n;

  const question_ids: `0x${string}`[] = [];
  const answer_lengths: bigint[] = [];
  const claimable_bonds = [];
  const claimable_answers: `0x${string}`[] = [];
  const claimable_answerers: Address[] = [];
  const claimable_history_hashes: `0x${string}`[] = [];

  let is_first = true;
  let is_yours = false;

  const final_answer = question_detail.currentAnswer;

  const history = [...(question_detail.responses || [])].sort((a, b) => (BigInt(a.bond) > BigInt(b.bond) ? 1 : -1));

  for (let i = history.length - 1; i >= 0; i--) {
    let answer: `0x${string}`;

    // Only set on reveal, otherwise the answer field still holds the commitment ID for commitments
    if (history[i].commitmentId) {
      answer = history[i].commitmentId!;
    } else {
      answer = history[i].answer!;
    }
    const answerer = history[i].user;
    const bond = BigInt(history[i].bond);
    const history_hash = history[i].historyHash;

    const is_answerer_you = account && answerer.toLowerCase() === account.toLowerCase();
    if (is_yours) {
      // Somebody takes over your answer
      if (!is_answerer_you && final_answer === answer) {
        is_yours = false;
        ttl = ttl + bond; // pay them their bond
      } else {
        ttl = ttl + bond; // take their bond
      }
    } else {
      // You take over someone else's answer
      if (is_answerer_you && final_answer === answer) {
        is_yours = true;
        ttl = ttl + bond; // your bond back
      }
    }
    if (is_first && is_yours) {
      ttl = ttl + BigInt(question_detail.bounty);
    }

    claimable_bonds.push(bond);
    claimable_answers.push(answer);
    claimable_answerers.push(answerer);
    claimable_history_hashes.push(history_hash);

    is_first = false;
  }

  // Nothing for you to claim, so return nothing
  if (ttl <= 0) {
    return false;
  }

  question_ids.push(question_detail.questionId);
  answer_lengths.push(BigInt(claimable_bonds.length));

  // For the history hash, each time we need to provide the previous hash in the history
  // So delete the first item, and add 0x0 to the end.
  claimable_history_hashes.shift();
  claimable_history_hashes.push("0x0000000000000000000000000000000000000000000000000000000000000000");

  return {
    total: ttl,
    question_ids: question_ids,
    answer_lengths: answer_lengths,
    answers: claimable_answers,
    answerers: claimable_answerers,
    bonds: claimable_bonds,
    history_hashes: claimable_history_hashes,
  };
}
