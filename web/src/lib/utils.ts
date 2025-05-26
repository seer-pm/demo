import { intervalToDuration } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { compareAsc } from "date-fns/compareAsc";
import { FormatDurationOptions, formatDuration } from "date-fns/formatDuration";
import { fromUnixTime } from "date-fns/fromUnixTime";
import { formatUnits, getAddress } from "viem";
import SEER_ENV from "./env";

export const NATIVE_TOKEN = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

// outcome get from MarketView
export const INVALID_RESULT_OUTCOME = "Invalid result";

// display text for invalid outcome
export const INVALID_RESULT_OUTCOME_TEXT = "Invalid";

// https://stackoverflow.com/a/72190364
export function localTimeToUtc(utcTime: Date | string | number) {
  if (typeof utcTime === "string" || typeof utcTime === "number") {
    // biome-ignore lint/style/noParameterAssign:
    utcTime = new Date(utcTime);
  }

  const tzOffset = utcTime.getTimezoneOffset() * 60000;
  return new Date(utcTime.getTime() - tzOffset);
}

export function formatDate(timestamp: number, formatString?: string) {
  const date = fromUnixTime(timestamp);
  return formatInTimeZone(date, "UTC", formatString ?? "MMMM d yyyy, HH:mm");
}

export function getTimeLeft(endDate: Date | string | number, withSeconds = false): string | false {
  const startDate = new Date();

  if (typeof endDate === "number" || typeof endDate === "string") {
    // biome-ignore lint/style/noParameterAssign:
    endDate = fromUnixTime(Number(endDate));
  }

  if (compareAsc(startDate, endDate) === 1) {
    return false;
  }

  const duration = intervalToDuration({ start: startDate, end: endDate });

  const format: FormatDurationOptions["format"] = ["years", "months", "weeks", "days", "hours"];

  if (withSeconds) {
    format.push("minutes", "seconds");
  } else if (Number(duration.days || 0) < 1) {
    if (Number(duration.minutes || 0) < 2) {
      format.push("seconds");
    } else {
      format.push("minutes");
    }
  }

  return formatDuration(duration, { format });
}

export function shortenAddress(address: string): string {
  try {
    const formattedAddress = getAddress(address);
    return `${formattedAddress.substring(0, 6)}...${formattedAddress.substring(formattedAddress.length - 4)}`;
  } catch {
    throw new TypeError("Invalid input, address can't be parsed");
  }
}

// biome-ignore lint/suspicious/noExplicitAny:
export const isUndefined = (maybeObject: any): maybeObject is undefined | null => {
  return typeof maybeObject === "undefined" || maybeObject === null;
};

export function formatBigNumbers(amount: number) {
  const quantifiers: [number, string][] = [
    [10 ** 9, "B"],
    [10 ** 6, "M"],
    [10 ** 3, "k"],
  ];

  for (const [denominator, letter] of quantifiers) {
    if (amount >= denominator) {
      return `${+Math.round((amount * 100) / denominator / 100)}${letter}`;
    }
  }

  return amount.toFixed(2);
}

export function displayBalance(amount: bigint, decimals: number, formatAmount = false) {
  const number = Number(formatUnits(amount, decimals));

  if (formatAmount) {
    return formatBigNumbers(number);
  }

  if (number % 1 === 0) {
    return String(number);
  }

  return number.toFixed(number < 0.1 ? 4 : 2);
}

export function bigIntMax(...args: bigint[]): bigint {
  if (!args.length) return 0n;
  return args.reduce((m, e) => (e > m ? e : m));
}

export function isTwoStringsEqual(str1: string | undefined | null, str2: string | undefined | null) {
  return !!str1?.trim() && str2?.trim()?.toLocaleLowerCase() === str1?.trim()?.toLocaleLowerCase();
}

export function parseFraction(floatString: string) {
  // Convert the string to a number
  const num = Number(floatString);

  // If it's not a valid number, return null
  if (Number.isNaN(num)) return null;

  // Split the string by decimal point
  const [intPart, decPart] = floatString.split(".");

  // If there's no decimal part, return [number, 1]
  if (!decPart) return [num, 1];

  // Calculate numerator and denominator
  const numerator = Number.parseInt(intPart + decPart);
  const denominator = 10 ** decPart.length;

  // Simplify the fraction
  const gcd = findGCD(numerator, denominator);

  return [numerator / gcd, denominator / gcd];
}

// Helper function to find the Greatest Common Divisor
function findGCD(a: number, b: number): number {
  return b === 0 ? a : findGCD(b, a % b);
}

export function isAccessTokenExpired(accessToken: string) {
  if (!accessToken) {
    return true;
  }
  try {
    const [, payload] = accessToken.split(".");
    const decodedPayload = JSON.parse(atob(payload));
    const expirationTime = decodedPayload.exp * 1000; // Convert to milliseconds
    return Date.now() > expirationTime;
  } catch (e) {
    return true;
  }
}

export async function fetchAuth(
  accessToken: string,
  url: string,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  body?: Record<string, string | string[] | number | undefined | null>,
) {
  const response = await fetch(url, {
    method: method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: method === "POST" || method === "PATCH" ? JSON.stringify(body) : undefined,
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json?.error || `Failed to fetch: ${response.statusText}`);
  }

  return json;
}

export function getAppUrl() {
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.host}`;
  }
  return SEER_ENV.VITE_WEBSITE_URL || "https://app.seer.pm";
}

export function stripDiacritics(str: string) {
  return str
    .normalize("NFD") // Decompose characters into base + diacritical marks
    .replace(/[^A-Za-z0-9\s!]/g, "")
    .normalize("NFC");
}

export function isTextInString(text: string, string: string) {
  return stripDiacritics(string).toLowerCase().includes(stripDiacritics(text).toLowerCase());
}

interface HeaderConfig {
  key: string;
  title: string;
}

interface CsvData {
  [key: string]: string | number | boolean | null;
}

export function downloadCsv(headers: HeaderConfig[], data: CsvData[], filename = "download.csv"): void {
  // Create CSV header row with display titles
  const headerRow = headers
    .map((header) => {
      const stringValue = header.title;
      // Escape quotes and wrap in quotes if the value contains comma or quotes
      if (stringValue.includes(",") || stringValue.includes('"')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    })
    .join(",");

  // Create CSV data rows using header keys
  const rows = data.map((row) => {
    return headers
      .map((header) => {
        const value = row[header.key];

        // Handle different types of values
        if (value === null || value === undefined) {
          return "";
        }

        // Escape quotes and wrap in quotes if the value contains comma or quotes
        const stringValue = String(value);
        if (stringValue.includes(",") || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }

        return stringValue;
      })
      .join(",");
  });

  // Combine headers and rows
  const csvContent = [headerRow, ...rows].join("\n");

  // Create blob and download link
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");

  // Create download URL
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);

  // Append link to body, click it, and remove it
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up URL
  URL.revokeObjectURL(url);
}
