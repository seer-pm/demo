import { getNewCurateItem, getSubmissionDeposit } from "@/lib/curate";
import { toastifyTx } from "@/lib/toastify";
import { config } from "@/wagmi";
import { useMutation } from "@tanstack/react-query";
import { TransactionReceipt } from "viem";
import { writeLightGeneralizedTcrAddItem } from "./contracts/generated";

interface VerifyMarketProps {
  marketId: `0x${string}`;
  marketImage: File;
  outcomesImages: File[];
}

async function verifyMarket(props: VerifyMarketProps): Promise<TransactionReceipt> {
  const item = await getNewCurateItem(props.marketId, props.marketImage, props.outcomesImages);
  const submissionDeposit = await getSubmissionDeposit();

  const result = await toastifyTx(
    async () =>
      writeLightGeneralizedTcrAddItem(config, {
        args: [item],
        value: submissionDeposit,
      }),
    {
      txSent: { title: "Submitting market to Kleros Curate..." },
      txSuccess: { title: "Market submitted for verification!" },
    },
  );

  if (!result.status) {
    throw result.error;
  }

  return result.receipt;
}

export const useVerifyMarket = () => {
  return useMutation({
    mutationFn: verifyMarket,
  });
};
