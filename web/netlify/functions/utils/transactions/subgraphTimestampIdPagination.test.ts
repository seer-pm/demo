import { describe, expect, it } from "vitest";
import { paginateByTimestampId } from "./subgraphTimestampIdPagination";

describe("paginateByTimestampId page cap", () => {
  it("throws when pagination hits maxPages before the stream is exhausted", async () => {
    let calls = 0;
    await expect(
      paginateByTimestampId({
        pageSize: 2,
        maxPages: 2,
        accountFilters: [{ origin: "0xabc" }],
        fetchPage: async () => {
          calls += 1;
          // Always a full page so the cursor never exhausts.
          return [
            { id: `a-${calls}-0`, timestamp: String(1000 - calls) },
            { id: `a-${calls}-1`, timestamp: String(999 - calls) },
          ];
        },
      }),
    ).rejects.toThrow(/hit page cap/);
    expect(calls).toBe(2);
  });

  it("returns when the stream exhausts under the page cap", async () => {
    const rows = await paginateByTimestampId({
      pageSize: 10,
      maxPages: 2,
      accountFilters: [{ origin: "0xabc" }],
      fetchPage: async () => [{ id: "only", timestamp: "1" }],
    });
    expect(rows).toEqual([{ id: "only", timestamp: "1" }]);
  });
});
