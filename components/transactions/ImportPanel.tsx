"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { parseImportFile } from "@/lib/csv/parseImportFile";
import { importStagingRows } from "@/app/app/transactions/import-actions";
import ReviewTable from "@/components/transactions/ReviewTable";
import type { StagingRow } from "@/components/transactions/ReviewTable";

interface Category {
  id: string;
  name: string;
  category_type: "income" | "expense";
}

interface AccountOption {
  id: string;
  name: string;
  account_kind: string;
  account_subtype: string | null;
}

interface ImportPanelProps {
  categories: Category[];
  accounts: AccountOption[];
  initialStagingRows: StagingRow[];
}

const instructionBoxStyle: React.CSSProperties = {
  background: "#f8fafc",
  border: "0.5px solid #e2e8f0",
  borderRadius: 8,
  padding: "12px 16px",
  marginBottom: 12,
};

export default function ImportPanel({
  categories,
  accounts,
  initialStagingRows,
}: ImportPanelProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(e.target.files?.[0] ?? null);
  };

  const handleImport = () => {
    const file = selectedFile;
    if (!file) {
      setIsError(true);
      setResultMessage("Please choose a CSV file first.");
      return;
    }

    startTransition(async () => {
      setParseErrors([]);
      setResultMessage(null);
      setIsError(false);

      // Step 1 — Client-side parse and validation
      let parsed;
      try {
        parsed = await parseImportFile(file);
      } catch {
        setIsError(true);
        setResultMessage("Failed to read file. Please check it is a valid CSV.");
        return;
      }

      // Step 2 — Show parse errors and stop
      if (parsed.errors.length > 0) {
        setParseErrors(parsed.errors);
        return;
      }

      if (parsed.rows.length === 0) {
        setIsError(true);
        setResultMessage("No valid rows found in file.");
        return;
      }

      // Step 3 — Send to server
      const result = await importStagingRows({
        rows: parsed.rows,
        original_filename: file.name,
      });

      if (!result.ok) {
        setIsError(true);
        setResultMessage(`Import failed: ${result.error}`);
        return;
      }

      setResultMessage(
        `✓ ${result.data.count} row${result.data.count === 1 ? "" : "s"} imported — review below.`
      );

      // Reset file picker
      setSelectedFile(null);
      if (fileRef.current) fileRef.current.value = "";

      // Refresh to get updated staging rows from server
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      {/* Instructions + template download */}
      <div style={instructionBoxStyle}>
        <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 8, marginTop: 0, color: "#1e293b" }}>
          CSV Import Instructions
        </p>
        <ul
          style={{
            fontSize: 12,
            color: "#64748b",
            lineHeight: 1.7,
            paddingLeft: 16,
            marginTop: 0,
            marginBottom: 8,
          }}
        >
          <li>
            Format your file with exactly 3 columns:{" "}
            <code style={{ background: "#f1f5f9", padding: "1px 4px", borderRadius: 3 }}>
              Date, Description, Amount
            </code>
          </li>
          <li>
            Date must be{" "}
            <code style={{ background: "#f1f5f9", padding: "1px 4px", borderRadius: 3 }}>
              YYYY-MM-DD
            </code>{" "}
            format (e.g. 2026-04-15)
          </li>
          <li>Amount: positive for income, negative for expenses and savings</li>
          <li>
            First row must be the header:{" "}
            <code style={{ background: "#f1f5f9", padding: "1px 4px", borderRadius: 3 }}>
              Date,Description,Amount
            </code>
          </li>
          <li>Save as CSV (UTF-8 encoding) before importing</li>
          <li>
            Category, type, and account will be auto-filled if we have history
            for that transaction — review before posting
          </li>
        </ul>
        <a
          href="/templates/ohh-finance-import-template.csv"
          download
          style={{
            fontSize: 12,
            color: "#1d9e75",
            display: "inline-block",
            textDecoration: "underline",
          }}
        >
          ↓ Download template
        </a>
      </div>

      {/* File chooser + Import button */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        {/* Hidden native input — triggered by the label below */}
        <label
          htmlFor="csv-file-input"
          style={{ cursor: "pointer", display: "inline-block" }}
        >
          <input
            id="csv-file-input"
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              padding: "5px 12px",
              borderRadius: 6,
              border: "1px solid #475569",
              background: "white",
              color: "#475569",
              display: "inline-block",
              lineHeight: 1.4,
            }}
          >
            {selectedFile ? selectedFile.name : "Choose CSV file"}
          </span>
        </label>

        <button
          onClick={handleImport}
          disabled={isPending}
          style={{
            fontSize: 12,
            fontWeight: 600,
            padding: "6px 14px",
            borderRadius: 6,
            border: "1px solid #1d9e75",
            background: isPending ? "#6ee7b7" : "#1d9e75",
            color: "white",
            cursor: isPending ? "not-allowed" : "pointer",
          }}
        >
          {isPending ? "Importing…" : "Import"}
        </button>
      </div>

      {/* Parse errors — shown before server call */}
      {parseErrors.length > 0 && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 6,
            padding: "10px 14px",
          }}
        >
          <p style={{ fontSize: 12, fontWeight: 600, color: "#dc2626", margin: "0 0 6px" }}>
            Fix these errors in your CSV before importing:
          </p>
          <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: "#b91c1c" }}>
            {parseErrors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Result message */}
      {resultMessage && (
        <p
          style={{
            fontSize: 12,
            color: isError ? "#dc2626" : "#1d9e75",
            margin: 0,
          }}
        >
          {resultMessage}
        </p>
      )}

      {/* Review table — shows all pending staging rows */}
      <div>
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "#64748b",
            marginBottom: 6,
            marginTop: 0,
          }}
        >
          Pending Review
        </p>
        <ReviewTable
          rows={initialStagingRows}
          categories={categories}
          accounts={accounts}
        />
      </div>
    </div>
  );
}
