/**
 * Minimal RFC 4180 cell/row encoding for CSV responses built inside Netlify functions.
 *
 * `web/src/lib/utils.ts` already has `downloadCsv`, but it is DOM-bound (Blob, createObjectURL, a
 * synthetic <a> click) so it cannot run here. Only the escaping rule is shared, and it is small
 * enough to restate rather than to split `downloadCsv` apart for.
 *
 * One deliberate difference from `downloadCsv`: a newline inside a value also triggers quoting.
 * That helper only checks for commas and quotes, which corrupts the row when a value contains a
 * line break. Nothing in the airdrop board can contain one today, but a server-side encoder should
 * not depend on that.
 */

type CsvValue = string | number | boolean | null | undefined;

/** One CSV cell: quoted only when it has to be, with inner quotes doubled. */
export function csvCell(value: CsvValue): string {
  if (value === null || value === undefined) {
    return "";
  }
  const stringValue = String(value);
  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n") ||
    stringValue.includes("\r")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

/** One CSV record, terminated by CRLF so the output is valid for spreadsheet importers on any OS. */
export function csvRow(values: CsvValue[]): string {
  return `${values.map(csvCell).join(",")}\r\n`;
}

/** One page of a paged source: the rows themselves plus how many rows match in total. */
export type CsvPage<T> = { rows: T[]; total: number };

/**
 * A whole paged result set as CSV chunks — the header line, then one chunk per page.
 *
 * Pulled lazily so the caller controls backpressure: the next page is only fetched when the
 * consumer asks for the next chunk. `firstPage` is passed in already loaded so the caller can fail
 * with a normal error status before it commits to a 200 and starts streaming a body.
 *
 * Termination trusts `total` rather than "a short page means the end" — a source that caps its
 * responses below the requested page size would otherwise silently truncate the export. An empty
 * page is the backstop so a `total` that overstates the available rows cannot loop forever, and
 * `maxRows` is the runaway guard (checked between pages, so the last page is emitted whole).
 */
export async function* pagedCsvChunks<T>(opts: {
  header: readonly string[];
  firstPage: CsvPage<T>;
  fetchPage: (offset: number) => Promise<CsvPage<T>>;
  toRow: (row: T) => CsvValue[];
  maxRows: number;
}): AsyncGenerator<string> {
  yield csvRow([...opts.header]);

  let page = opts.firstPage;
  let emitted = 0;
  for (;;) {
    if (page.rows.length > 0) {
      yield page.rows.map((row) => csvRow(opts.toRow(row))).join("");
    }
    emitted += page.rows.length;

    if (page.rows.length === 0 || emitted >= page.total || emitted >= opts.maxRows) {
      return;
    }
    page = await opts.fetchPage(emitted);
  }
}
