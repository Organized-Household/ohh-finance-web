"use client";

import { useState } from "react";
import type { ColumnMapping } from "@/lib/csv/parseImportFile";

interface ColumnMappingStepProps {
  headers: string[];
  onConfirm: (mapping: ColumnMapping) => void;
  onCancel: () => void;
}

function findDefault(headers: string[], target: string): string {
  return (
    headers.find((h) => h.toLowerCase() === target.toLowerCase()) ??
    headers[0] ??
    ""
  );
}

export default function ColumnMappingStep({
  headers,
  onConfirm,
  onCancel,
}: ColumnMappingStepProps) {
  const [dateCol, setDateCol] = useState(() => findDefault(headers, "date"));
  const [descCol, setDescCol] = useState(() =>
    findDefault(headers, "description")
  );
  const [amountCol, setAmountCol] = useState(() =>
    findDefault(headers, "amount")
  );

  const handleConfirm = () => {
    onConfirm({ date: dateCol, description: descCol, amount: amountCol });
  };

  const selectStyle: React.CSSProperties = {
    fontSize: 12,
    padding: "4px 8px",
    borderRadius: 6,
    border: "1px solid #cbd5e1",
    background: "white",
    color: "#1e293b",
    minWidth: 160,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: "#475569",
    minWidth: 100,
  };

  return (
    <div
      style={{
        background: "#f8fafc",
        border: "0.5px solid #e2e8f0",
        borderRadius: 8,
        padding: "12px 16px",
      }}
    >
      <p
        style={{
          fontSize: 13,
          fontWeight: 500,
          marginBottom: 12,
          marginTop: 0,
          color: "#1e293b",
        }}
      >
        Map your CSV columns
      </p>
      <p
        style={{
          fontSize: 12,
          color: "#64748b",
          marginBottom: 12,
          marginTop: 0,
        }}
      >
        We couldn&apos;t detect the standard column names. Tell us which column
        contains each field:
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={labelStyle}>Date</span>
          <select
            value={dateCol}
            onChange={(e) => setDateCol(e.target.value)}
            style={selectStyle}
          >
            {headers.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={labelStyle}>Description</span>
          <select
            value={descCol}
            onChange={(e) => setDescCol(e.target.value)}
            style={selectStyle}
          >
            {headers.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={labelStyle}>Amount</span>
          <select
            value={amountCol}
            onChange={(e) => setAmountCol(e.target.value)}
            style={selectStyle}
          >
            {headers.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={handleConfirm}
          style={{
            fontSize: 12,
            fontWeight: 600,
            padding: "6px 14px",
            borderRadius: 6,
            border: "1px solid #1d9e75",
            background: "#1d9e75",
            color: "white",
            cursor: "pointer",
          }}
        >
          Confirm Mapping
        </button>
        <button
          onClick={onCancel}
          style={{
            fontSize: 12,
            fontWeight: 600,
            padding: "6px 14px",
            borderRadius: 6,
            border: "1px solid #cbd5e1",
            background: "white",
            color: "#475569",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
