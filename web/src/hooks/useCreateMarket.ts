import { getConfigNumber } from "@/lib/config";
import type { CreateMarketProps } from "@seer-pm/sdk";

/** Props for create market/proposal without minBond (injected from config in the hook). */
export type CreateMarketPropsBase = Omit<CreateMarketProps, "minBond">;
import { toastifyTx } from "@/lib/toastify";
import { config } from "@/wagmi";
import { getCreateMarketExecution, getCreateProposalExecution } from "@seer-pm/sdk";
import { useMutation } from "@tanstack/react-query";
import { sendTransaction } from "@wagmi/core";
import { TransactionReceipt } from "viem";

async function createMarket(props: CreateMarketPropsBase): Promise<TransactionReceipt> {
  const execution = getCreateMarketExecution({
    ...props,
    minBond: getConfigNumber("MIN_BOND", props.chainId),
  });

  const result = await toastifyTx(() => sendTransaction(config, execution), {
    txSent: { title: "Creating market..." },
    txSuccess: { title: "Market created!" },
  });

  if (!result.status) {
    throw result.error;
  }

  return result.receipt;
}

async function createProposal(props: CreateMarketPropsBase): Promise<TransactionReceipt> {
  const execution = getCreateProposalExecution({
    ...props,
    minBond: getConfigNumber("MIN_BOND", props.chainId),
  });

  const result = await toastifyTx(() => sendTransaction(config, execution), {
    txSent: { title: "Creating proposal..." },
    txSuccess: { title: "Proposal created!" },
  });

  if (!result.status) {
    throw result.error;
  }

  return result.receipt;
}

export const useCreateMarket = (isFutarchyMarket: boolean, onSuccess: (data: TransactionReceipt) => void) => {
  return useMutation({
    mutationFn: (props: CreateMarketPropsBase) => (isFutarchyMarket ? createProposal(props) : createMarket(props)),
    onSuccess,
  });
};
