import { getAppUrl } from "@/lib/utils";
import { Config } from "@netlify/functions";

export default async () => {
  try {
    await fetch(getAppUrl());
  } catch (error) {
    console.error("Error ping netlify:", error);
    throw error;
  }
};

export const config: Config = {
  schedule: "*/3 * * * *",
};
