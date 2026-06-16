import Papa from "papaparse";

export interface ParsedRow {
  occurred_at: string;
  description: string;
  amount: number;
}

export interface ParseResult {
  rows: ParsedRow[];
  errors: string[];
}

export interface ColumnMapping {
  date: string;
  description: string;
  amount: string;
}

/**
 * Attempts to parse a date string in multiple common formats and
 * return a YYYY-MM-DD string. Returns null if unrecognized.
 *
 * Supported formats:
 *   YYYY-MM-DD        (already correct)
 *   YYYY/MM/DD
 *   M/D/YYYY          (e.g. 5/8/2026)
 *   MM/DD/YYYY        (e.g. 05/08/2026)
 *   M-D-YYYY          (e.g. 5-8-2026)
 *   MM-DD-YYYY        (e.g. 05-08-2026)
 *   MMM D, YYYY       (e.g. May 8, 2026)
 *   MMMM D, YYYY      (e.g. May 08, 2026)
 */
function normalizeDate(raw: string): string | null {
  const s = raw.trim();

  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // YYYY/MM/DD
  const isoSlash = s.match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
  if (isoSlash) return `${isoSlash[1]}-${isoSlash[2]}-${isoSlash[3]}`;

  // M/D/YYYY or MM/DD/YYYY
  const mdySlash = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdySlash) {
    const m = mdySlash[1].padStart(2, '0');
    const d = mdySlash[2].padStart(2, '0');
    return `${mdySlash[3]}-${m}-${d}`;
  }

  // M-D-YYYY or MM-DD-YYYY
  const mdyDash = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (mdyDash) {
    const m = mdyDash[1].padStart(2, '0');
    const d = mdyDash[2].padStart(2, '0');
    return `${mdyDash[3]}-${m}-${d}`;
  }

  // MMM D, YYYY or MMMM D, YYYY (e.g. "May 8, 2026" or "January 15, 2026")
  const monthNames: Record<string, string> = {
    january: '01', february: '02', march: '03', april: '04',
    may: '05', june: '06', july: '07', august: '08',
    september: '09', october: '10', november: '11', december: '12',
    jan: '01', feb: '02', mar: '03', apr: '04',
    jun: '06', jul: '07', aug: '08',
    sep: '09', oct: '10', nov: '11', dec: '12',
  };
  const longDate = s.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/);
  if (longDate) {
    const month = monthNames[longDate[1].toLowerCase()];
    if (month) {
      const d = longDate[2].padStart(2, '0');
      return `${longDate[3]}-${month}-${d}`;
    }
  }

  return null;
}

/**
 * Client-side CSV parser. Validates Format A: Date, Description, Amount.
 * Accepts multiple date formats — normalizes to YYYY-MM-DD.
 * Show errors to the user before calling the server — do not submit if any errors.
 */
export function parseImportFile(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows: ParsedRow[] = [];
        const errors: string[] = [];

        (results.data as Record<string, string>[]).forEach((row, i) => {
          const dateRaw = row["Date"]?.trim();
          const description = row["Description"]?.trim();
          const amountRaw = row["Amount"]?.trim();
          const amount = parseFloat(amountRaw);

          const date = dateRaw ? normalizeDate(dateRaw) : null;
          if (!date) {
            errors.push(`Row ${i + 2}: invalid date "${dateRaw ?? ""}"`);
            return;
          }
          if (!description) {
            errors.push(`Row ${i + 2}: missing description`);
            return;
          }
          if (isNaN(amount)) {
            errors.push(`Row ${i + 2}: invalid amount "${amountRaw ?? ""}"`);
            return;
          }

          rows.push({ occurred_at: date, description, amount });
        });

        resolve({ rows, errors });
      },
      error: (err) => reject(err),
    });
  });
}

/**
 * Parses a CSV file using a user-supplied column mapping.
 * Accepts multiple date formats — normalizes to YYYY-MM-DD.
 * Used when the file headers don't match the standard Date/Description/Amount format.
 */
export function parseImportFileWithMapping(
  file: File,
  mapping: ColumnMapping,
): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows: ParsedRow[] = [];
        const errors: string[] = [];

        (results.data as Record<string, string>[]).forEach((row, i) => {
          const dateRaw = row[mapping.date]?.trim();
          const description = row[mapping.description]?.trim();
          const amountRaw = row[mapping.amount]?.trim();
          const amount = parseFloat(amountRaw);

          const date = dateRaw ? normalizeDate(dateRaw) : null;
          if (!date) {
            errors.push(`Row ${i + 2}: invalid date "${dateRaw ?? ""}"`);
            return;
          }
          if (!description) {
            errors.push(`Row ${i + 2}: missing description`);
            return;
          }
          if (isNaN(amount)) {
            errors.push(`Row ${i + 2}: invalid amount "${amountRaw ?? ""}"`);
            return;
          }

          rows.push({ occurred_at: date, description, amount });
        });

        resolve({ rows, errors });
      },
      error: (err) => reject(err),
    });
  });
}

/**
 * Reads only the header row of a CSV file.
 * Used by ImportPanel to detect column names before parsing.
 */
export function detectHeaders(file: File): Promise<string[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: false,
      preview: 1,
      skipEmptyLines: true,
      complete: (results) => {
        const firstRow = (results.data as string[][])[0] ?? [];
        resolve(firstRow.map((h) => h.trim()));
      },
      error: (err) => reject(err),
    });
  });
}
