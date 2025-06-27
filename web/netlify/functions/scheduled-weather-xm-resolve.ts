import { realityAbi, realityAddress } from "@/hooks/contracts/generated-reality.ts";
import { SupportedChain } from "@/lib/chains.ts";
import { Config } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import { simulateContract, writeContract } from "@wagmi/core";
import { PrivateKeyAccount, numberToHex, parseEther } from "viem";
import { Address, privateKeyToAccount } from "viem/accounts";
import { gnosis, sepolia } from "viem/chains";
import { config as wagmiConfig } from "./utils/config.ts";
import { Database } from "./utils/supabase.ts";
import { CityCode, WEATHER_CITIES } from "./utils/weather.ts";

const supabase = createClient<Database>(process.env.VITE_SUPABASE_PROJECT_URL!, process.env.VITE_SUPABASE_API_KEY!);

async function getCityTemperature(city: string, date: string) {
  try {
    const response = await fetch(
      `https://markets-api.weatherxm.com/api/v2/resolution/${city.toLowerCase()}?date=${date}`,
    );

    if (!response.ok) {
      throw new Error(`WeatherXM API returned status ${response.status}`);
    }

    const data = await response.json();

    if (data.status === "resolved") {
      return data.temperatureCelsius;
    }

    throw new Error("WeatherXM API returned resolved=false");
  } catch (error) {
    console.error(`Error fetching temperature data for ${city} on ${date}:`, error);
    throw error;
  }
}

async function setAnswered(id: number) {
  const { error: updateError } = await supabase.from("weather_markets").update({ answered: true }).eq("id", id);

  if (updateError) {
    console.error(`Error updating market ${id} as answered:`, updateError);
  }
}

async function resolveMarketForCity(
  account: PrivateKeyAccount,
  data: Database["public"]["Tables"]["weather_markets"]["Row"],
) {
  // Get market address from the database by matching transaction hash
  const { data: marketData, error: marketError } = await supabase
    .from("markets")
    .select("id, subgraph_data")
    .eq("chain_id", data.chain_id!)
    .filter("subgraph_data->>transactionHash", "eq", data.tx_hash)
    .single();

  if (marketError) {
    console.error(`Error fetching market data for tx hash ${data.tx_hash}:`, marketError);
    return;
  }

  if (!marketData) {
    console.error(`No market found with transaction hash ${data.tx_hash}`);
    return;
  }

  // @ts-ignore
  const questionId = marketData.subgraph_data.questions[0].question.id;

  const resolvedTemp = await getCityTemperature(
    WEATHER_CITIES[data.city as CityCode].formatted,
    data.date!.split("T")[0],
  );

  const answer = numberToHex(parseEther(String(resolvedTemp)), { size: 32 });
  const maxPrevious = 0n;

  console.log(`Submitting answer for market ${marketData.id}...`);

  const simulation = await simulateContract(wagmiConfig, {
    account,
    address: realityAddress[data.chain_id as SupportedChain],
    functionName: "submitAnswer",
    chainId: data.chain_id as SupportedChain,
    abi: realityAbi,
    args: [questionId, answer, maxPrevious],
    // @ts-ignore
    value: BigInt(marketData.subgraph_data.questions[0].question.min_bond),
  });

  const txHash = await writeContract(wagmiConfig, simulation.request);

  console.log(`Submitted answer for market ${marketData.id} with tx hash ${txHash}`);

  await setAnswered(data.id);
}

export default async () => {
  const chainId = gnosis.id;

  const privateKey = process.env.LIQUIDITY_ACCOUNT_PRIVATE_KEY!;
  const account = privateKeyToAccount((privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`) as Address);

  // Get markets that need to be resolved (date is in the past and not yet answered)
  const now = new Date();

  const { data: marketsToResolve, error: fetchError } = await supabase
    .from("weather_markets")
    .select("*")
    .lt("date", now.toISOString().split("T")[0])
    .eq("answered", false)
    .eq("chain_id", chainId);

  if (fetchError) {
    console.error("Error fetching markets to resolve:", fetchError);
    return;
  }

  console.log(`Found ${marketsToResolve?.length || 0} markets to resolve`);

  if (marketsToResolve && marketsToResolve.length > 0) {
    for (const market of marketsToResolve) {
      try {
        console.log(`Resolving market for ${market.city} on ${market.date}`);

        await resolveMarketForCity(account, market);
      } catch (error) {
        if (error.message.includes("finalization deadline must not have passed")) {
          console.error(`Market for ${market.city} on ${market.date} already answered`);
          await setAnswered(market.id);
        } else {
          console.error(`Error resolving market for ${market.city} on ${market.date}:`, error.message);
        }
      }

      // Wait 1 second between resolutions to avoid rate limits
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
};

export const config: Config = {
  schedule: "0 */4 * * *",
};
