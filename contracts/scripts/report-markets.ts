import hre, { viem } from "hardhat";
import { gnosis } from "viem/chains";

const SUBGRAPH_URL = "https://api.thegraph.com/subgraphs/name/xyzseer/seer-pm";

const getQqlQuery = (finalizeTs: number) => `{
  markets(where: {payoutReported: false, finalizeTs_lt: ${finalizeTs}}) {
    id
    marketName
    finalizeTs
  }
}`;

async function main() {
  const [signer] = await hre.viem.getWalletClients();

  if (signer.chain.id !== gnosis.id) {
    throw new Error("Script available only for gnosis chain");
  }

  const response = await fetch(SUBGRAPH_URL, {
    method: "POST",
    body: JSON.stringify({
      query: getQqlQuery(Math.round(new Date().getTime() / 1000)),
    }),
  });
  const {
    data: { markets },
  } = await response.json();

  if (!markets) {
    console.log("No results found");
    return;
  }

  (
    await Promise.allSettled(
      markets.map(async (market) => {
        const marketContract = await viem.getContractAt("Market", market.id);
        return marketContract.write.resolve();
      })
    )
  ).map((result, i) => {
    if (result.status === "fulfilled") {
      console.log(
        `Market "${markets[i].marketName}" (${markets[i].id}) resolved`
      );
    } else {
      if (result.reason.message.includes("payout denominator already set")) {
        console.log(
          `Market "${markets[i].marketName}" (${markets[i].id}) already resolved`
        );
      } else {
        console.error(
          `Error resolving market ${markets[i].marketName} (${markets[i].id}): ${result.reason.message}`
        );
      }
    }
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
