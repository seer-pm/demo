import { SupportedChain } from "@/lib/chains";
import { readContracts } from "@wagmi/core";
import { config } from "./config";

export async function readContractsInBatch(
  // biome-ignore lint/suspicious/noExplicitAny:
  contracts: any[],
  chainId: SupportedChain,
  groupCount: number,
  retry?: boolean,
) {
  try {
    // try to batch call
    // biome-ignore lint/suspicious/noExplicitAny:
    let total: any[] = [];
    for (let i = 0; i < Math.ceil(contracts.length / groupCount); i++) {
      const data = await readContracts(config, {
        allowFailure: false,
        contracts: contracts.slice(i * groupCount, (i + 1) * groupCount),
        batchSize: 0,
      });
      total = total.concat(data);
      // wait 200 ms to not reach max rate limit
      await new Promise((res) => setTimeout(res, 200));
    }
    return total;
  } catch (e) {
    if (retry) {
      return await readContractsInBatch(contracts, chainId, 8);
    }
    throw e;
  }
}
