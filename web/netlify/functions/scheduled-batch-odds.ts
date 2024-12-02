import { Config } from "@netlify/functions";

require("dotenv").config();

export default async (req: Request) => {
  try {
    const { next_run } = await req.json();
    console.log("Received event! Next invocation at:", next_run);
    await fetch(process.env.BATCH_ODDS_URL!);
  } catch (e) {
    console.log(e);
  }
};

export const config: Config = {
  schedule: "*/10 * * * *",
};
