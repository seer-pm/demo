import { afterEach, describe, expect, it } from "vitest";

import SEER_ENV from "./env";
import { isSeerCreditsDisabled } from "./seer-credits";

describe("seer-credits", () => {
  afterEach(() => {
    // biome-ignore lint/performance/noDelete: _
    delete SEER_ENV.VITE_SEER_CREDITS_DISABLED;
  });

  it("returns true when VITE_SEER_CREDITS_DISABLED is true", () => {
    SEER_ENV.VITE_SEER_CREDITS_DISABLED = "true";

    expect(isSeerCreditsDisabled()).toBe(true);
  });

  it("returns false when credits are not disabled", () => {
    expect(isSeerCreditsDisabled()).toBe(false);
  });
});
