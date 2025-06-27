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
import { CityCode, WEATHER_CITIES } from "./utils/weather.ts";

const supabase = createClient<Database>(process.env.VITE_SUPABASE_PROJECT_URL!, process.env.VITE_SUPABASE_API_KEY!);

function getDateParts(date: Date): { year: string; month: string; day: string } {
  const [year, month, day] = date.toISOString().split("T")[0].split("-");
  return { year, month, day };
}

function getTokenName(cityCode: CityCode, date: Date, upOrDown: "UP" | "DOWN") {
  const { year, month, day } = getDateParts(date);
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
        "x-api-key": process.env.WEATER_XM_API_KEY!,
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

  return { lowerBound: forecast.market.low, upperBound: forecast.market.high };
}

async function checkMarketExists(cityCode: CityCode, localDate: Date, chainId: SupportedChain): Promise<boolean> {
  const { year, month, day } = getDateParts(localDate);

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
  localDate: Date,
  utcDate: Date,
  chainId: SupportedChain,
): Promise<`0x${string}`> {
  const { year, month, day } = getDateParts(localDate);

  const { lowerBound, upperBound } = await getForecast(cityCode, year, month, day);
  const outcomes = ["DOWN", "UP"];
  const tokenNames = [getTokenName(cityCode, localDate, "DOWN"), getTokenName(cityCode, localDate, "UP")];

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
    city: cityCode,
    chain_id: chainId,
  });

  if (insertError) {
    throw new Error(`Error storing weather market data for ${WEATHER_CITIES[cityCode].name}: ${insertError.message}`);
  }

  return txHash;
}

function getOpeningDate(city: CityCode): { localDate: Date; utcDate: Date } {
  const cityTimezone = WEATHER_CITIES[city].timezone;

  // Create current date
  const now: Date = new Date();

  // Add 4 days for verification
  const targetDate: Date = new Date(now);
  targetDate.setUTCDate(now.getUTCDate() + 4);

  // Set time to 00:00 in local timezone
  const formatter: Intl.DateTimeFormat = new Intl.DateTimeFormat("en-US", {
    timeZone: cityTimezone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  });

  // Get date components in local timezone
  const parts: Intl.DateTimeFormatPart[] = formatter.formatToParts(targetDate);
  const dateParts: { [key: string]: number } = {
    year: Number.parseInt(parts.find((p) => p.type === "year")!.value),
    month: Number.parseInt(parts.find((p) => p.type === "month")!.value) - 1, // Months in JS are 0-based
    day: Number.parseInt(parts.find((p) => p.type === "day")!.value),
    hour: 0,
    minute: 0,
    second: 0,
  };

  // Create a date in local timezone at 00:00
  const localDate: Date = new Date(
    Date.UTC(dateParts.year, dateParts.month, dateParts.day, dateParts.hour, dateParts.minute, dateParts.second),
  );

  // Manually adjust to timezone to get correct UTC date
  const offsetFormatter: Intl.DateTimeFormat = new Intl.DateTimeFormat("en-US", {
    timeZone: cityTimezone,
    timeZoneName: "longOffset",
  });
  const offsetParts: Intl.DateTimeFormatPart[] = offsetFormatter.formatToParts(localDate);
  const offsetString: string | undefined = offsetParts.find((p) => p.type === "timeZoneName")?.value;

  // Parse offset (example: GMT+01:00)
  if (!offsetString) {
    throw new Error("Invalid timezone offset");
  }

  const offsetMatch: RegExpMatchArray | null = offsetString.match(/GMT([+-])(\d{2}):(\d{2})/);
  if (!offsetMatch) {
    throw new Error("Invalid timezone offset format");
  }

  const sign: number = offsetMatch[1] === "+" ? 1 : -1;
  const hours: number = Number.parseInt(offsetMatch[2]);
  const minutes: number = Number.parseInt(offsetMatch[3]);
  const totalOffsetMinutes: number = (hours * 60 + minutes) * sign;

  // Adjust UTC date by subtracting the timezone offset to get the correct UTC time.
  // Then add 24 hours because markets should open at 00:00 UTC the day after the target date
  // (e.g., for a market about 2025-01-01's temperature, the opening time should be 2025-01-02 00:00:00 UTC)
  const utcDate: Date = new Date(localDate.getTime() - totalOffsetMinutes * 60 * 1000 + 24 * 60 * 60 * 1000);

  return {
    localDate,
    utcDate,
  };
}

export default async () => {
  const chainId = gnosis.id;

  const privateKey = process.env.LIQUIDITY_ACCOUNT_PRIVATE_KEY!;
  const account = privateKeyToAccount((privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`) as Address);

  // TODO: verify markets
  for (const cityCode of Object.keys(WEATHER_CITIES)) {
    try {
      const { localDate, utcDate } = getOpeningDate(cityCode as CityCode);

      // Check if market already exists before attempting to create it
      const marketExists = await checkMarketExists(cityCode as CityCode, localDate, chainId);

      if (marketExists) {
        const { year, month, day } = getDateParts(localDate);
        console.log(
          `Market already exists for ${WEATHER_CITIES[cityCode as CityCode].name} on ${year}-${month}-${day}, skipping...`,
        );
        continue;
      }

      console.log(
        `Creating weather market for ${WEATHER_CITIES[cityCode as CityCode].name} ${localDate.toISOString()}`,
      );
      const txHash = await createMarketForCity(account, cityCode as CityCode, localDate, utcDate, chainId);
      // TODO: set category
      console.log(`Market created, tx hash: ${txHash}`);
    } catch (error) {
      console.error(`Error creating market for ${WEATHER_CITIES[cityCode as CityCode].name}:`, error);
    }

    // Wait 1 second between market creations to avoid rate limits
    // TODO: bundle all markets together on one tx?
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
};

export const config: Config = {
  schedule: "0 0 * * *",
};
