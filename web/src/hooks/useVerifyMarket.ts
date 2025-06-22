import { getNewCurateItem } from "@/lib/curate";
import { queryClient } from "@/lib/query-client";
import { toastifyTx } from "@/lib/toastify";
import { config } from "@/wagmi";
import { useMutation } from "@tanstack/react-query";
import { TransactionReceipt } from "viem";
import { writeLightGeneralizedTcrAddItem } from "./contracts/generated-curate";

interface VerifyMarketProps {
  marketId: `0x${string}`;
  marketImage: File;
  outcomesImages: File[];
  submissionDeposit: bigint;
}

async function verifyMarket(props: VerifyMarketProps): Promise<TransactionReceipt> {
  const item = await getNewCurateItem(props.marketId, props.marketImage, props.outcomesImages);

  const result = await toastifyTx(
    async () =>
      writeLightGeneralizedTcrAddItem(config, {
        args: [item],
        value: props.submissionDeposit,
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

export const useVerifyMarket = (onSuccess?: (data: TransactionReceipt) => unknown) => {
  return useMutation({
    mutationFn: verifyMarket,
    onSuccess: (data: TransactionReceipt) => {
      queryClient.invalidateQueries({ queryKey: ["useMarket"] });
      queryClient.invalidateQueries({ queryKey: ["useVerificationStatus"] });
      onSuccess?.(data);
    },
  });
};
