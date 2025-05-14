import { WEATHER_CATEGORY } from "@/components/MarketForm/index.tsx";
import { marketFactoryAbi, marketFactoryAddress } from "@/hooks/contracts/generated.ts";
import { getCreateMarketParams } from "@/hooks/useCreateMarket.ts";
import { SupportedChain } from "@/lib/chains.ts";
import { MarketTypes } from "@/lib/market.ts";
import { Config } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import { simulateContract, writeContract } from "@wagmi/core";
import { PrivateKeyAccount, zeroAddress } from "viem";
import { Address, privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { config as wagmiConfig } from "./utils/config.ts";
import { Database } from "./utils/supabase.ts";

const supabase = createClient<Database>(process.env.VITE_SUPABASE_PROJECT_URL!, process.env.VITE_SUPABASE_API_KEY!);

export const WEATHER_CITIES = {
  London: "LON",
  // Lisbon: "LIS",
  // "Buenos Aires": "BUE",
  // Bangalore: "BLR"
} as const;

type City = keyof typeof WEATHER_CITIES;

function getFormattedDate(date: Date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return { year, month, day };
}

function getTokenName(city: City, date: Date, upOrDown: "UP" | "DOWN") {
  const { year, month, day } = getFormattedDate(date);
  const dateStr = `${year.toString().slice(2)}${month}${day}`;

  // Get the 3 letter city code
  const cityCode = WEATHER_CITIES[city];

  // Determine U or D based on UP or DOWN
  const direction = upOrDown[0]; // Just take the first letter

  // Return the formatted token name
  return `W${dateStr}${cityCode}${direction}`;
}

async function createMarketForCity(
  account: PrivateKeyAccount,
  city: City,
  openingDate: Date,
  chainId: SupportedChain,
): Promise<`0x${string}`> {
  const lowerBound = 15; // TODO
  const upperBound = 25; // TODO

  const { year, month, day } = getFormattedDate(openingDate);
  const outcomes = ["DOWN", "UP"];
  const tokenNames = [getTokenName(city, openingDate, "DOWN"), getTokenName(city, openingDate, "UP")];

  const openingTime = Math.round(openingDate.getTime() / 1000);

  const simulation = await simulateContract(wagmiConfig, {
    account,
    address: marketFactoryAddress[chainId],
    functionName: "createScalarMarket",
    chainId,
    abi: marketFactoryAbi,
    args: [
      getCreateMarketParams({
        marketType: MarketTypes.SCALAR,
        marketName: `What will be WeatherXM's median highest temperature in ${city} on ${year}-${month}-${day}?`,
        outcomes,
        tokenNames,
        parentMarket: zeroAddress,
        parentOutcome: BigInt(0),
        lowerBound,
        upperBound,
        unit: "°C",
        category: WEATHER_CATEGORY,
        openingTime,
        chainId,
      }),
    ],
  });

  const txHash = await writeContract(wagmiConfig, simulation.request);

  const { error: insertError } = await supabase.from("weather_markets").insert({
    date: `${year}-${month}-${day}`,
    tx_hash: txHash,
    city,
    chain_id: chainId,
  });

  if (insertError) {
    console.error(`Error storing weather market data for ${city}:`, insertError);
  }

  return txHash;
}

export default async () => {
  const chainId = sepolia.id;

  const privateKey = process.env.LIQUIDITY_ACCOUNT_PRIVATE_KEY!;
  const account = privateKeyToAccount((privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`) as Address);

  // TODO: this is just for testing
  const tenDaysBefore = new Date();
  tenDaysBefore.setUTCDate(tenDaysBefore.getUTCDate() - 9);
  tenDaysBefore.setUTCHours(0, 0, 0, 0);

  // TODO: Set resolution window to open at midnight local time (Include adjustments for daylight savings time)
  // Calculate opening time: 4 days from now at 00:00 UTC
  //const openingDate = new Date();
  const openingDate = tenDaysBefore;
  openingDate.setUTCDate(openingDate.getUTCDate() + 4);
  openingDate.setUTCHours(0, 0, 0, 0);

  for (const city of Object.keys(WEATHER_CITIES)) {
    try {
      console.log(`Creating weather market for ${city}`);
      const txHash = await createMarketForCity(account, city as City, openingDate, chainId);
      console.log(`Market created, tx hash: ${txHash}`);
    } catch (error) {
      console.error(`Error creating market for ${city}:`, error);
    }

    // Wait 1 second between market creations to avoid rate limits
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
};

export const config: Config = {
  schedule: "0 0 * * *",
};
