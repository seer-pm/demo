import { SupportedChain, gnosis } from "@/lib/chains";
import { NATIVE_TOKEN } from "@/lib/utils";
import { WXDAI } from "@swapr/sdk";
import { Address } from "viem";
import { useTokenBalance } from "./useTokenBalance";

export function useWrappedToken(account: Address | undefined, chainId: SupportedChain) {
  const { data: wxDAIBalance = BigInt(0) } = useTokenBalance(
    account,
    WXDAI[chainId]?.address as `0x${string}`,
    chainId,
  );
  const { data: xDAIBalance = BigInt(0) } = useTokenBalance(account, NATIVE_TOKEN, chainId);
  return wxDAIBalance > xDAIBalance && chainId === gnosis.id;
}
