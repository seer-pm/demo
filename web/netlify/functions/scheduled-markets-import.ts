import { lightGeneralizedTcrAddress } from "@/hooks/contracts/generated.ts";
import { VerificationResult } from "@/hooks/useMarket.ts";
import { SupportedChain } from "@/lib/chains.ts";
import { isUndefined } from "@/lib/utils.ts";
import { Config } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import { Address } from "viem";
import { Status, getSdk as getCurateSdk } from "../../src/hooks/queries/gql-generated-curate";
import { chainIds } from "./utils/config.ts";
import { curateGraphQLClient, getSubgraphUrl } from "./utils/subgraph.ts";

const supabase = createClient(process.env.VITE_SUPABASE_PROJECT_URL!, process.env.VITE_SUPABASE_API_KEY!);

async function getVerificationStatusList(
  chainId: SupportedChain,
): Promise<Record<Address, VerificationResult | undefined>> {
  const client = curateGraphQLClient(chainId);

  const registryAddress = lightGeneralizedTcrAddress[chainId];
  if (client && !isUndefined(registryAddress)) {
    const { litems } = await getCurateSdk(client).GetImages({
      where: {
        registryAddress,
      },
    });
    return litems.reduce(
      (obj, item) => {
        const marketId = item.metadata?.props?.find((prop) => prop.label === "Market")?.value?.toLowerCase();
        if (!marketId) {
          return obj;
        }
        const isVerifiedBeforeClearing =
          item.status === Status.ClearingRequested &&
          item.requests.find((request) => request.requestType === Status.RegistrationRequested)?.resolved;
        if (item.status === Status.Registered || isVerifiedBeforeClearing) {
          obj[marketId] = { status: "verified", itemID: item.itemID };
          return obj;
        }
        if (item.status === Status.RegistrationRequested) {
          if (item.disputed) {
            obj[marketId] = { status: "challenged", itemID: item.itemID };
          } else {
            obj[marketId] = { status: "verifying", itemID: item.itemID };
          }
          return obj;
        }
        obj[marketId] = { status: "not_verified" };
        return obj;
      },
      {} as { [key: string]: VerificationResult },
    );
  }

  return {};
}

async function processChain(chainId: SupportedChain) {
  const response = await fetch(getSubgraphUrl("seer", chainId), {
    method: "POST",
    body: JSON.stringify({
      query: `{
        markets(first: 1000) {
          id
          type
          marketName
          outcomes
          wrappedTokens
          collateralToken
          collateralToken1
          collateralToken2
          parentMarket {
            id
            payoutReported
            conditionId
            payoutNumerators
          }
          parentOutcome
          parentCollectionId
          conditionId
          questionId
          templateId
          hasAnswers
          questionsInArbitration
          questions {
            question {
              id
              arbitrator
              opening_ts
              timeout
              finalize_ts
              is_pending_arbitration
              best_answer
              bond
              min_bond
            }
          }
          openingTs
          finalizeTs
          encodedQuestions
          lowerBound
          upperBound
          payoutReported
          payoutNumerators
          factory
          creator
          outcomesSupply
          blockTimestamp
        }
      }`,
    }),
  });
  const {
    data: { markets },
  } = await response.json();

  if (markets.length === 0) {
    return;
  }

  const verificationStatusList = await getVerificationStatusList(chainId);

  await supabase.from("markets").upsert(
    // biome-ignore lint/suspicious/noExplicitAny:
    markets.map((market: any) => ({
      id: market.id,
      chain_id: chainId,
      subgraph_data: market,
      verification: verificationStatusList[market.id] ?? {
        status: "not_verified",
      },
    })),
  );
}

export default async () => {
  for (const chainId of chainIds) {
    await processChain(chainId);
  }
};

export const config: Config = {
  schedule: "*/5 * * * *",
};
