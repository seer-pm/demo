import { describe, expect, it } from "vitest";
import { runGoldskyDexRequest } from "./goldskyClient";

/** Longer than the ~223 ms pacing interval, so paced starts must overlap to run concurrently. */
const LATENCY_MS = 800;
const CALLS = 6;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("goldsky rate gate", () => {
  it("paces requests without serializing them", async () => {
    let inFlight = 0;
    let maxInFlight = 0;

    const started = Date.now();
    await Promise.all(
      Array.from({ length: CALLS }, () =>
        runGoldskyDexRequest(async () => {
          inFlight++;
          maxInFlight = Math.max(maxInFlight, inFlight);
          await sleep(LATENCY_MS);
          inFlight--;
          return null;
        }),
      ),
    );
    const elapsed = Date.now() - started;

    // The gate used to chain every call, so latency stacked on top of the interval and this was 1.
    expect(maxInFlight).toBeGreaterThan(1);
    expect(elapsed).toBeLessThan(CALLS * LATENCY_MS);
  });
});
