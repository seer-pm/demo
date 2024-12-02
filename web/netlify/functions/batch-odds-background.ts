import type { HandlerContext, HandlerEvent } from "@netlify/functions";
import chromium from "@sparticuz/chromium";
import { createClient } from "@supabase/supabase-js";
import pLimit from "p-limit";
import puppeteer, { Browser, Page } from "puppeteer-core";
import { chainIds } from "./utils/config";
import { fetchMarkets } from "./utils/fetchMarkets";
import { getMarketOdds } from "./utils/getMarketOdds";
require("dotenv").config();

export const handler = async (_event: HandlerEvent, _context: HandlerContext) => {
  const limit = pLimit(20);
  try {
    const markets = (
      await Promise.all(
        chainIds.map((chainId) =>
          fetchMarkets(chainId.toString()).then((markets) => markets.map((market) => ({ ...market, chainId }))),
        ),
      )
    ).flat();
    const results = await Promise.all(markets.map((market) => limit(() => getMarketOdds(market))));

    //save to db
    if (!process.env.VITE_SUPABASE_PROJECT_URL || !process.env.VITE_SUPABASE_API_KEY) {
      return;
    }
    const supabase = createClient(process.env.VITE_SUPABASE_PROJECT_URL, process.env.VITE_SUPABASE_API_KEY);

    const { error } = await supabase.from("markets").upsert(
      markets.map((market, index) => ({
        id: market.id,
        odds: results[index].map((x) => (Number.isNaN(x) ? null : x)),
        updated_at: new Date(),
      })),
    );

    if (error) {
      throw error;
    }

    const ogImagesResult = await getOgImages(markets);

    if (!ogImagesResult) {
      return;
    }

    const { error: writeOgImagesError } = await supabase.from("markets").upsert(
      markets.map((market, index) => ({
        id: market.id,
        og_image: ogImagesResult[index],
        updated_at: new Date(),
      })),
    );

    if (writeOgImagesError) {
      throw writeOgImagesError;
    }

    // get and save og images
  } catch (e) {
    console.log(e);
  }
  return {};
};

async function getOgImages(markets) {
  let browser: Browser | null = null;
  try {
    // Launch browser with longer timeout
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: {
        width: 700,
        height: 1080,
        deviceScaleFactor: 2,
      },
      executablePath: process.env.CHROME_EXECUTABLE_PATH || (await chromium.executablePath()),
      headless: true,
    });
    const limit = pLimit(10);
    return await Promise.all(
      markets.map((market) => limit(() => getOgImage(browser!, { chainId: market.chainId, marketId: market.id }))),
    );
  } catch (e) {
    console.log(e);
  } finally {
    if (browser)
      try {
        await browser.close();
      } catch {}
  }
}

async function getOgImage(browser: Browser, { chainId, marketId }) {
  const page = await browser.newPage();
  try {
    await page.goto(`https://app.seer.pm/markets/${chainId}/${marketId}/card`);
    const card = await page.waitForSelector(".market-card");

    await page.waitForFunction(() => document.querySelector(".market-card__outcomes__loaded"));

    const screenshot = await card!.screenshot({ type: "png" });
    await page.close();

    return screenshot.toString("base64");
  } catch (error) {
    await page.close();
    console.log(error);
  }
}
