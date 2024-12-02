import type { HandlerContext, HandlerEvent } from "@netlify/functions";
import chromium from "@sparticuz/chromium";
import puppeteer, { Browser, Page } from "puppeteer-core";
require("dotenv").config();

export async function handler(event: HandlerEvent, _context: HandlerContext) {
  const paths = event.path.split("/").filter(Boolean);
  const [chainId, marketId] = paths.slice(paths.indexOf("og-images") + 1, paths.indexOf("og-images") + 3);
  let browser: Browser | null = null;
  let page: Page | null = null;
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
    page = await browser.newPage();

    page.goto(`https://app.seer.pm/markets/${chainId}/${marketId}/card`);
    const card = await page.waitForSelector(".market-card", { timeout: 10000 });
    if (!card) {
      throw "Market not found!";
    }
    // wait for the prices to load
    try {
      await page.waitForFunction(
        () => {
          return document.querySelector(".market-card__outcomes__loaded");
        },
        { timeout: 15000 },
      );
    } catch (e) {}
    const screenshot = await card.screenshot({
      type: "png",
    });
    await page.close();
    await browser.close();

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400",
      },
      body: screenshot.toString("base64"),
      isBase64Encoded: true,
    };
  } catch (error) {
    if (page)
      try {
        await page.close();
      } catch {}
    if (browser)
      try {
        await browser.close();
      } catch {}

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to generate image",
        details: error.message,
      }),
    };
  }
}
