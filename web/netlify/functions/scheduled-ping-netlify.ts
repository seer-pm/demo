import { getAppUrl } from "@/lib/utils";
import { Config } from "@netlify/functions";

export default async () => {
  // ping markets-search and market-metadata endpoints
  try {
    await Promise.all([
      fetch(`${getAppUrl()}/.netlify/functions/markets-search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chainsList: [],
          marketName: "",
          marketStatusList: [],
          creator: "",
          participant: "",
          orderBy: undefined,
          orderDirection: undefined,
        }),
      }),
      fetch(`${getAppUrl()}/.netlify/functions/market-metadata`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chainsList: ["100"],
          id: "0x07c5a013b44e0dbf72a30b45f13af1e9dbb3970d",
        }),
      }),
    ]);
  } catch (error) {
    console.error("Error ping netlify:", error);
    throw error;
  }
};

export const config: Config = {
  schedule: "*/3 * * * *",
};
