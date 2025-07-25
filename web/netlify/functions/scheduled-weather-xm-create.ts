import { WEATHER_CATEGORY } from "@/components/MarketForm/index.tsx";
import { marketFactoryAbi, marketFactoryAddress } from "@/hooks/contracts/generated-market-factory.ts";
import { getCreateMarketParams } from "@/hooks/useCreateMarket.ts";
import { SupportedChain } from "@/lib/chains.ts";
import { MarketTypes } from "@/lib/market.ts";
import { Config } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import { simulateContract, writeContract } from "@wagmi/core";
import { PrivateKeyAccount, parseEther, zeroAddress } from "viem";
import { Address, privateKeyToAccount } from "viem/accounts";
import { gnosis, sepolia } from "viem/chains";
import { config as wagmiConfig } from "./utils/config.ts";
import { Database } from "./utils/supabase.ts";
import { CityCode, DateParts, WEATHER_CITIES, celciusToKelvin, getOpeningDate } from "./utils/weather.ts";

const supabase = createClient<Database>(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_API_KEY!);

function getTokenName(cityCode: CityCode, marketDate: DateParts, upOrDown: "UP" | "DOWN") {
  const { year, month, day } = marketDate;
  const dateStr = `${year.slice(2)}${month}${day}`;

  // Determine U or D based on UP or DOWN
  const direction = upOrDown[0]; // Just take the first letter

  // Return the formatted token name
  return `W${dateStr}${cityCode}${direction}`;
}

async function getForecast(cityCode: CityCode, year: string, month: string, day: string) {
  type WeatherCell = {
    cell: string;
    temperature: number[];
  };

  type WeatherForecast = {
    date: string;
    stats: {
      min: number;
      max: number;
      mean: number;
      sd: number;
    };
    market: {
      low: number;
      high: number;
    };
    timeseries: WeatherCell[];
  };

  // Fetch forecast from WeatherXM API
  const response = await fetch(
    `https://markets-api.weatherxm.com/api/v2/forecast/temperature/${WEATHER_CITIES[cityCode].formatted}`,
    {
      headers: {
        "x-api-key": process.env.WEATHER_XM_API_KEY!,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`WeatherXM API request failed: ${response.statusText}`);
  }

  const data: WeatherForecast[] = await response.json();

  // Find forecast for specified date
  const targetDate = `${year}-${month}-${day}`;
  const forecast = data.find((item) => item.date === targetDate);

  if (!forecast) {
    throw new Error(`No forecast found for date ${targetDate}`);
  }

  return { lowerBound: celciusToKelvin(forecast.market.low), upperBound: celciusToKelvin(forecast.market.high) };
}

async function checkMarketExists(cityCode: CityCode, marketDate: DateParts, chainId: SupportedChain): Promise<boolean> {
  const { year, month, day } = marketDate;

  const { data: existingMarket, error: queryError } = await supabase
    .from("weather_markets")
    .select("tx_hash")
    .eq("date", `${year}-${month}-${day}`)
    .eq("city", cityCode)
    .eq("chain_id", chainId)
    .single();

  if (queryError && queryError.code !== "PGRST116") {
    // PGRST116 is "no rows returned" error
    throw new Error(`Error checking existing markets: ${queryError.message}`);
  }

  return !!existingMarket?.tx_hash;
}

async function createMarketForCity(
  account: PrivateKeyAccount,
  cityCode: CityCode,
  marketDate: DateParts,
  utcDate: Date,
  chainId: SupportedChain,
): Promise<`0x${string}`> {
  const { year, month, day } = marketDate;

  const { lowerBound, upperBound } = await getForecast(cityCode, year, month, day);
  const outcomes = ["DOWN", "UP"];
  const tokenNames = [getTokenName(cityCode, marketDate, "DOWN"), getTokenName(cityCode, marketDate, "UP")];

  const openingTime = Math.round(utcDate.getTime() / 1000);

  const simulation = await simulateContract(wagmiConfig, {
    account,
    address: marketFactoryAddress[chainId],
    functionName: "createScalarMarket",
    chainId,
    abi: marketFactoryAbi,
    args: [
      getCreateMarketParams({
        marketType: MarketTypes.SCALAR,
        marketName: `What will be WeatherXM's median highest temperature in ${WEATHER_CITIES[cityCode].name} on ${year}-${month}-${day}, considering only stations with 100% QoD?`,
        outcomes,
        tokenNames,
        parentMarket: zeroAddress,
        parentOutcome: BigInt(0),
        lowerBound: parseEther(String(lowerBound)),
        upperBound: parseEther(String(upperBound)),
        unit: "K",
        category: WEATHER_CATEGORY,
        openingTime,
        chainId,
      }),
    ],
  });

  const txHash = await writeContract(wagmiConfig, simulation.request);

  const { error: insertError } = await supabase.from("weather_markets").insert({
    date: `${year}-${month}-${day}`,
    opening_time: utcDate.toISOString(),
    tx_hash: txHash,
    city: cityCode,
    chain_id: chainId,
  });

  if (insertError) {
    throw new Error(`Error storing weather market data for ${WEATHER_CITIES[cityCode].name}: ${insertError.message}`);
  }

  return txHash;
}

export default async () => {
  const chainId = gnosis.id;

  const privateKey = process.env.LIQUIDITY_ACCOUNT_PRIVATE_KEY!;
  const account = privateKeyToAccount((privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`) as Address);

  // TODO: verify markets
  for (const cityCode of Object.keys(WEATHER_CITIES) as CityCode[]) {
    try {
      const { marketDate, openingDate } = getOpeningDate(new Date(), cityCode);

      // Check if market already exists before attempting to create it
      const marketExists = await checkMarketExists(cityCode, marketDate, chainId);

      if (marketExists) {
        const { year, month, day } = marketDate;
        console.log(
          `Market already exists for ${WEATHER_CITIES[cityCode].name} on ${year}-${month}-${day}, skipping...`,
        );
        continue;
      }

      console.log(
        `Creating weather market for ${WEATHER_CITIES[cityCode].name} ${marketDate.year}-${marketDate.month}-${marketDate.day}`,
      );
      const txHash = await createMarketForCity(account, cityCode, marketDate, openingDate, chainId);
      // TODO: set category
      console.log(`Market created, tx hash: ${txHash}`);
    } catch (error) {
      console.error(`Error creating market for ${WEATHER_CITIES[cityCode].name}:`, error);
    }

    // Wait 1 second between market creations to avoid rate limits
    // TODO: bundle all markets together on one tx?
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
};

export const config: Config = {
  schedule: "*/30 * * * *",
};
