import * as fs from "node:fs";
import { renderPage } from "vike/server";

async function getOpenFileDescriptors(): Promise<number> {
  try {
    const fdDir = "/proc/self/fd";
    if (fs.existsSync(fdDir)) {
      return fs.readdirSync(fdDir).length;
    }
    return -1; // If we can't access /proc/self/fd
  } catch (error) {
    console.error("Error getting file descriptors:", error);
    return -1;
  }
}

async function withFdMonitoring<T>(fn: () => Promise<T>): Promise<T> {
  const beforeFd = await getOpenFileDescriptors();
  console.log(`File descriptors before execution: ${beforeFd}`);

  let result: T;
  try {
    result = await fn();
  } catch (error) {
    const afterFd = await getOpenFileDescriptors();
    console.error(`File descriptors after error: ${afterFd}`);
    if (beforeFd !== -1 && afterFd !== -1) {
      console.error(`Difference in file descriptors: ${afterFd - beforeFd}`);
    }
    throw error;
  }

  const afterFd = await getOpenFileDescriptors();
  console.log(`File descriptors after execution: ${afterFd}`);
  if (beforeFd !== -1 && afterFd !== -1) {
    console.log(`Difference in file descriptors: ${afterFd - beforeFd}`);
  }

  return result;
}

export default async (req: Request) => {
  return withFdMonitoring(async () => {
    const pageContext = await renderPage({ urlOriginal: req.url });
    if (!pageContext.httpResponse) return new Response("", { status: 200 });

    console.log("render url", req.url);

    const headers = {
      ...Object.fromEntries(pageContext.httpResponse.headers),
    };

    // Add cache control only for market pages
    if (req.url.includes("/markets/")) {
      headers["Netlify-CDN-Cache-Control"] = "public, durable, max-age=60, stale-while-revalidate=120";
    }

    return new Response(pageContext.httpResponse.body, {
      status: pageContext.httpResponse.statusCode,
      headers,
    });
  });
};
