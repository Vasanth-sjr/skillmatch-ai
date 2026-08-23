// RFC 4180 CSV parsing, written rather than pulled in as a dependency
// because LinkedIn's export is the only CSV this app reads and the
// format is small enough to handle correctly in a few dozen lines.
//
// "Correctly" is the operative word: LinkedIn descriptions routinely
// contain commas, embedded newlines and doubled quotes ("" for a literal
// quote). A naive split(",") mangles roughly every second Positions.csv,
// which would silently corrupt exactly the free-text fields AMSCE's
// Resume Context Analyzer reads.

export type CsvRow = Record<string, string>;

export function parseCsv(text: string): CsvRow[] {
  // LinkedIn ships UTF-8 with a BOM on some exports.
  const input = text.replace(/^﻿/, "");
  const rows: string[][] = [];

  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];

    if (inQuotes) {
      if (ch === '"') {
        if (input[i + 1] === '"') { field += '"'; i++; }  // escaped quote
        else inQuotes = false;
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') { inQuotes = true; continue; }
    if (ch === ",") { row.push(field); field = ""; continue; }
    if (ch === "\r") continue;
    if (ch === "\n") { row.push(field); rows.push(row); row = []; field = ""; continue; }
    field += ch;
  }

  // Trailing field/row when the file doesn't end in a newline.
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }

  const nonEmpty = rows.filter(r => r.some(c => c.trim().length > 0));
  if (nonEmpty.length < 2) return [];

  const headers = nonEmpty[0].map(h => h.trim());
  return nonEmpty.slice(1).map(cells => {
    const obj: CsvRow = {};
    headers.forEach((h, i) => { obj[h] = (cells[i] ?? "").trim(); });
    return obj;
  });
}

/**
 * Reads a column by any of several possible header names.
 *
 * LinkedIn has renamed export columns over the years and localises some
 * of them, so a single hard-coded header would break for anyone whose
 * archive predates the current format.
 */
export function field(row: CsvRow, ...names: string[]): string {
  for (const name of names) {
    if (row[name]) return row[name];
  }
  // Fall back to a case-insensitive match before giving up.
  const lowered = Object.keys(row).reduce<Record<string, string>>((acc, k) => {
    acc[k.toLowerCase()] = row[k];
    return acc;
  }, {});
  for (const name of names) {
    const v = lowered[name.toLowerCase()];
    if (v) return v;
  }
  return "";
}
