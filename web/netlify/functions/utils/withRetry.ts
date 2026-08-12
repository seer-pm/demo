/**
 * Retries a DB/network call on transient failures — notably Postgres statement timeouts (57014)
 * and `fetch failed`, which concurrent Supabase loaders (airdrop, PnL leaderboard) can hit.
 */
export async function withRetry<T>(fn: () => Promise<T>, label = "query", retries = 5): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      // biome-ignore lint/suspicious/noExplicitAny: error shape varies (PostgREST / fetch)
      const err = error as any;
      const message: string = err?.message ?? "";
      const retriable =
        err?.code === "57014" || // statement timeout
        err?.code === "540" ||
        err?.name === "AbortError" ||
        /timeout|fetch failed|ECONNRESET|ETIMEDOUT|network/i.test(message);
      if (!retriable || attempt === retries) {
        throw error;
      }
      const delay = Math.min(15000, 500 * 2 ** attempt) + Math.floor(Math.random() * 300);
      console.log(
        `withRetry(${label}) attempt ${attempt + 1}/${retries} failed (${err?.code ?? err?.name}); retrying in ${delay}ms`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}
