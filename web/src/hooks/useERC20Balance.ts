import { NATIVE_TOKEN } from "@/lib/utils";
import { config } from "@/wagmi";
import { useQuery } from "@tanstack/react-query";
import { getBalance } from "@wagmi/core";
import { Address } from "viem";

export async function fetchERC20Balance(token: Address, owner: Address) {
  return (
    await getBalance(config, {
      address: owner,
      token: token === NATIVE_TOKEN ? undefined : token,
    })
  ).value;
}

export const useERC20Balance = (owner?: Address, token?: Address) => {
  return useQuery<bigint | undefined, Error>({
    enabled: !!owner && !!token,
    queryKey: ["useERC20Balance", owner, token],
    queryFn: async () => {
      return await fetchERC20Balance(token!, owner!);
    },
  });
};
