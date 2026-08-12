import { afterEach, describe, expect, it } from "vitest";

import SEER_ENV from "./env";
import { isTradingCreditsDisabled } from "./trading-credits";

describe("trading-credits", () => {
  afterEach(() => {
    // biome-ignore lint/performance/noDelete: _
    delete SEER_ENV.VITE_CREDITS_DISABLED;
  });

  it("returns true when VITE_CREDITS_DISABLED is true", () => {
    SEER_ENV.VITE_CREDITS_DISABLED = "true";

    expect(isTradingCreditsDisabled()).toBe(true);
  });

  it("returns false when credits are not disabled", () => {
    expect(isTradingCreditsDisabled()).toBe(false);
  });
});
