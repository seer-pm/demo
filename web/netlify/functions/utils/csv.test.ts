import { describe, expect, it } from "vitest";
import { type CsvPage, csvCell, csvRow, pagedCsvChunks } from "./csv";

describe("csvCell", () => {
  it("leaves plain values alone", () => {
    expect(csvCell("0xabc")).toBe("0xabc");
    expect(csvCell(12.5)).toBe("12.5");
    expect(csvCell(true)).toBe("true");
    expect(csvCell(0)).toBe("0");
    expect(csvCell(false)).toBe("false");
  });

  it("renders null and undefined as an empty field", () => {
    expect(csvCell(null)).toBe("");
    expect(csvCell(undefined)).toBe("");
  });

  it("quotes values containing a comma", () => {
    expect(csvCell("a,b")).toBe('"a,b"');
  });

  it("quotes and doubles inner quotes", () => {
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell('"')).toBe('""""');
  });

  it("quotes values containing a line break", () => {
    // The DOM-side downloadCsv misses this case; a server-side encoder must not.
    expect(csvCell("a\nb")).toBe('"a\nb"');
    expect(csvCell("a\r\nb")).toBe('"a\r\nb"');
  });
});

describe("csvRow", () => {
  it("joins cells and terminates with CRLF", () => {
    expect(csvRow(["rank", "address", "seer"])).toBe("rank,address,seer\r\n");
  });

  it("escapes per cell", () => {
    expect(csvRow([1, "a,b", null, 'c"d'])).toBe('1,"a,b",,"c""d"\r\n');
  });

  it("emits an empty record for no values", () => {
    expect(csvRow([])).toBe("\r\n");
  });
});

describe("pagedCsvChunks", () => {
  type Row = { n: number };

  /** A fake paged source with a fixed page size, recording the offsets it was asked for. */
  function source(totalRows: number, pageSize: number, reportedTotal = totalRows) {
    const all: Row[] = Array.from({ length: totalRows }, (_, i) => ({ n: i }));
    const offsets: number[] = [];
    const page = (offset: number): CsvPage<Row> => {
      offsets.push(offset);
      return { rows: all.slice(offset, offset + pageSize), total: reportedTotal };
    };
    return { page, offsets };
  }

  async function collect(gen: AsyncGenerator<string>) {
    let out = "";
    for await (const chunk of gen) out += chunk;
    return out;
  }

  function opts(firstPage: CsvPage<Row>, fetchPage: (offset: number) => CsvPage<Row>, maxRows = 1000) {
    return {
      header: ["n"] as const,
      firstPage,
      fetchPage: async (offset: number) => fetchPage(offset),
      toRow: (row: Row) => [row.n],
      maxRows,
    };
  }

  /** Data rows only, unwrapped from the header line and the trailing CRLF. */
  function dataRows(csv: string) {
    return csv.trimEnd().split("\r\n").slice(1);
  }

  it("emits the header even when the board is empty", async () => {
    const csv = await collect(pagedCsvChunks(opts({ rows: [], total: 0 }, () => ({ rows: [], total: 0 }))));
    expect(csv).toBe("n\r\n");
  });

  it("pages until every row is emitted, and asks for the right offsets", async () => {
    const { page, offsets } = source(7, 3);
    const csv = await collect(pagedCsvChunks(opts(page(0), page)));
    expect(dataRows(csv)).toEqual(["0", "1", "2", "3", "4", "5", "6"]);
    // offset 0 once from the caller's pre-fetch, then 3 and 6 from the generator.
    expect(offsets).toEqual([0, 3, 6]);
  });

  it("does not fetch again when the first page already covers the total", async () => {
    const { page, offsets } = source(2, 10);
    await collect(pagedCsvChunks(opts(page(0), page)));
    expect(offsets).toEqual([0]);
  });

  it("keeps paging when the source caps below the requested page size", async () => {
    // The gateway's Max Rows cap means a page can be shorter than asked for without being the
    // last one; stopping on a short page would silently truncate the export.
    const { page, offsets } = source(5, 2);
    const csv = await collect(pagedCsvChunks(opts(page(0), page)));
    expect(dataRows(csv)).toEqual(["0", "1", "2", "3", "4"]);
    expect(offsets).toEqual([0, 2, 4]);
  });

  it("stops on an empty page even when total overstates the rows available", async () => {
    const { page, offsets } = source(3, 2, 99);
    const csv = await collect(pagedCsvChunks(opts(page(0), page)));
    expect(dataRows(csv)).toEqual(["0", "1", "2"]);
    // The page at 2 is short (one row left), so the next ask is 3, which comes back empty.
    expect(offsets).toEqual([0, 2, 3]);
  });

  it("stops at maxRows", async () => {
    const { page, offsets } = source(100, 10);
    const csv = await collect(pagedCsvChunks(opts(page(0), page, 25)));
    // Checked between pages, so the page that crosses the ceiling is emitted whole.
    expect(dataRows(csv)).toHaveLength(30);
    expect(offsets).toEqual([0, 10, 20]);
  });

  it("is lazy — no page is fetched until its chunk is pulled", async () => {
    const { page, offsets } = source(9, 3);
    const gen = pagedCsvChunks(opts(page(0), page));
    expect(offsets).toEqual([0]);
    await gen.next(); // header line
    expect(offsets).toEqual([0]);
    await gen.next(); // the pre-loaded first page, still no new fetch
    expect(offsets).toEqual([0]);
    await gen.next(); // only now is the second page fetched
    expect(offsets).toEqual([0, 3]);
  });

  it("escapes cells through csvRow", async () => {
    const csv = await collect(
      pagedCsvChunks({
        header: ["a", "b"],
        firstPage: { rows: [{ n: 0 }], total: 1 },
        fetchPage: async () => ({ rows: [], total: 1 }),
        toRow: () => ["x,y", null],
        maxRows: 10,
      }),
    );
    expect(csv).toBe('a,b\r\n"x,y",\r\n');
  });
});
