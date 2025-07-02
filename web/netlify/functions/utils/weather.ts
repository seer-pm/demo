import { format, fromZonedTime } from "date-fns-tz";

export const WEATHER_CITIES = {
  LON: {
    name: "London",
    formatted: "london",
    timezone: "Europe/London",
  },
  // LIS: {
  //   name: "Lisbon",
  //   formatted: "lisbon",
  //   timezone: "Europe/Lisbon"
  // },
  // BUE: {
  //   name: "Buenos Aires",
  //   formatted: "buenos-aires",
  //   timezone: "America/Argentina/Buenos_Aires"
  // },
  // BLR: {
  //   name: "Bangalore",
  //   formatted: "bangalore",
  //   timezone: "Asia/Kolkata"
  // }
} as const;

export type CityCode = keyof typeof WEATHER_CITIES;

export type DateParts = { year: string; month: string; day: string; formatted: string };

export function getDateParts(dateOrString: Date | string): DateParts {
  let formatted: string;
  if (typeof dateOrString === "string") {
    // If input is a string, assume format 'yyyy-MM-dd' or 'yyyy-MM-ddTHH:mm:ss' and extract the date part
    formatted = dateOrString.split("T")[0];
  } else {
    // If input is a Date, use toISOString (UTC) and extract the date part
    formatted = dateOrString.toISOString().split("T")[0];
  }
  const [year, month, day] = formatted.split("-");
  return { year, month, day, formatted };
}

/**
 * - marketDate: The local date in the city's timezone, used only for display purposes.
 * - openingDate: The UTC Date object representing 24 hours after the local marketDate, used for blockchain operations.
 */
export function getOpeningDate(initialDate: Date, city: CityCode): { marketDate: DateParts; openingDate: Date } {
  const cityTimezone = WEATHER_CITIES[city].timezone;

  // Add 4 days for verification
  const targetDate = new Date(initialDate);
  targetDate.setUTCDate(initialDate.getUTCDate() + 4);

  // Get the date in the target timezone (local date string)
  const localDateStr = format(targetDate, "yyyy-MM-dd", { timeZone: cityTimezone });

  // Create the local date at 00:00:00 in the city's timezone
  const localDateTimeStr = `${localDateStr}T00:00:00.000`;
  // Create the UTC instant corresponding to the local date
  const marketDateUTC = fromZonedTime(localDateTimeStr, cityTimezone);
  const openingDate = new Date(marketDateUTC.getTime() + 24 * 60 * 60 * 1000);

  return {
    marketDate: getDateParts(localDateStr),
    openingDate,
  };
}

export function celciusToKelvin(temperature: number) {
  return Math.round((temperature + 273.15) * 100) / 100;
}
