import Papa from "papaparse";

export interface ParsedRow {
  occurred_at: string; // YYYY-MM-DD validated
  description: string;
  amount: number;
}

export interface ParseResult {
  rows: ParsedRow[];
  errors: string[];
}

/**
 * Client-side CSV parser. Validates Format A: Date, Description, Amount.
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
          const date = row["Date"]?.trim();
          const description = row["Description"]?.trim();
          const amountRaw = row["Amount"]?.trim();
          const amount = parseFloat(amountRaw);

          if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            errors.push(`Row ${i + 2}: invalid date "${date ?? ""}"`);
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
