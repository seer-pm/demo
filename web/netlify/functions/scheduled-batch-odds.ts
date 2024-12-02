import { Config } from "@netlify/functions";

require("dotenv").config();

export default async () => {
  if (!process.env.BATCH_ODDS_URL) {
    throw "No url found";
  }
  await fetch(process.env.BATCH_ODDS_URL);
};

export const config: Config = {
  schedule: "*/10 * * * *",
};
