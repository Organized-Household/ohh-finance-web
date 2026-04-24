"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateStagingRow, postStagingRows } from "@/app/app/transactions/import-actions";

export interface StagingRow {
  id: string;
  occurred_at: string;
  description: string;
  amount: number;
  transaction_type: string | null;
  category_id: string | null;
  linked_account_id: string | null;
  payment_source_account_id: string | null;
  /** true when the field was auto-filled from transaction history */
  auto_filled?: boolean;
}

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

interface ReviewTableProps {
  rows: StagingRow[];
  categories: Category[];
  accounts: AccountOption[];
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Decision 2026-04-22: transaction_type = 'income' | 'expense' only.
// Savings/investment transactions are identified via linked_account_id
// pointing to an account with account_kind = 'savings' or 'investment'.
const TRANSACTION_TYPES = [
  { value: "income", label: "Income" },
  { value: "expense", label: "Expense" },
];

const thStyle: React.CSSProperties = {
  padding: "4px 8px",
  fontSize: 10,
  fontWeight: 700,
  color: "#374151",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  textAlign: "left",
  borderBottom: "1px solid #e2e8f0",
  background: "#f1f5f9",
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "5px 8px",
  fontSize: 12,
  verticalAlign: "middle",
  borderBottom: "1px solid #f1f5f9",
};

const selectStyle: React.CSSProperties = {
  fontSize: 12,
  border: "1px solid #e2e8f0",
  borderRadius: 4,
  padding: "2px 4px",
  background: "white",
  width: "100%",
  minWidth: 80,
};

const autoFilledStyle: React.CSSProperties = {
  ...selectStyle,
  borderColor: "#6ee7b7",
  color: "#1d9e75",
};

export default function ReviewTable({
  rows: initialRows,
  categories,
  accounts,
}: ReviewTableProps) {
  const router = useRouter();
  const [rows, setRows] = useState<StagingRow[]>(initialRows);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const pendingRows = rows.filter((r) => r !== null);
  const pendingCount = pendingRows.length;

  if (pendingCount === 0) {
    return (
      <div
        style={{
          padding: "20px",
          textAlign: "center",
          fontSize: 13,
          color: "#64748b",
          border: "1px solid #e2e8f0",
          borderRadius: 8,
          background: "#f8fafc",
        }}
      >
        No pending rows to review. Import a CSV to get started.
      </div>
    );
  }

  const allSelected = selected.size === pendingCount;

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pendingRows.map((r) => r.id)));
    }
  };

  const toggleRow = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelected(next);
  };

  const handleFieldChange = (
    rowId: string,
    field: keyof Pick<
      StagingRow,
      | "transaction_type"
      | "category_id"
      | "linked_account_id"
      | "payment_source_account_id"
    >,
    value: string | null
  ) => {
    // Optimistic update for all fields except amount sign —
    // amount is corrected after the server responds (for type changes).
    setRows((prev) =>
      prev.map((r) =>
        r.id === rowId ? { ...r, [field]: value || null, auto_filled: false } : r
      )
    );

    startTransition(async () => {
      const row = rows.find((r) => r.id === rowId);
      if (!row) return;

      const result = await updateStagingRow(rowId, {
        category_id: field === "category_id" ? (value || null) : row.category_id,
        transaction_type: field === "transaction_type" ? (value || null) : row.transaction_type,
        linked_account_id:
          field === "linked_account_id" ? (value || null) : row.linked_account_id,
        payment_source_account_id:
          field === "payment_source_account_id"
            ? (value || null)
            : row.payment_source_account_id,
      });

      // When type changes, server corrects the amount sign — apply to local state
      if (
        result.ok &&
        field === "transaction_type" &&
        result.correctedAmount !== undefined
      ) {
        setRows((prev) =>
          prev.map((r) =>
            r.id === rowId ? { ...r, amount: result.correctedAmount! } : r
          )
        );
      }
    });
  };

  const handlePost = (rowIds: string[]) => {
    if (!rowIds.length) {
      setMessage("No rows selected.");
      return;
    }

    startTransition(async () => {
      setMessage(null);
      const result = await postStagingRows(rowIds);

      if (!result.ok) {
        setMessage(`Error: ${result.error}`);
        return;
      }

      // Remove posted rows from local state
      setRows((prev) => prev.filter((r) => !rowIds.includes(r.id)));
      setSelected((prev) => {
        const next = new Set(prev);
        rowIds.forEach((id) => next.delete(id));
        return next;
      });

      setMessage(`✓ ${result.count} transaction${result.count === 1 ? "" : "s"} posted.`);
      router.refresh();
    });
  };

  const accountLabel = (a: AccountOption) =>
    a.account_subtype ? `${a.name} (${a.account_subtype})` : a.name;

  return (
    <div>
      {/* Bulk actions bar */}
      <div
        style={{
          display: "flex",
          gap: 8,
          padding: "8px 0",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => handlePost(pendingRows.map((r) => r.id))}
          disabled={isPending || pendingCount === 0}
          style={{
            fontSize: 12,
            fontWeight: 600,
            padding: "5px 12px",
            borderRadius: 6,
            border: "1px solid #1d9e75",
            background: "#1d9e75",
            color: "white",
            cursor: isPending ? "not-allowed" : "pointer",
            opacity: isPending ? 0.7 : 1,
          }}
        >
          Post All ({pendingCount})
        </button>

        <button
          onClick={() => handlePost([...selected])}
          disabled={isPending || selected.size === 0}
          style={{
            fontSize: 12,
            fontWeight: 600,
            padding: "5px 12px",
            borderRadius: 6,
            border: "1px solid #475569",
            background: "white",
            color: "#475569",
            cursor: isPending || selected.size === 0 ? "not-allowed" : "pointer",
            opacity: isPending || selected.size === 0 ? 0.5 : 1,
          }}
        >
          Post Selected ({selected.size})
        </button>

        <span style={{ fontSize: 11, color: "#64748b", marginLeft: 4 }}>
          {pendingCount} pending
        </span>

        {message && (
          <span
            style={{
              fontSize: 11,
              color: message.startsWith("Error") ? "#dc2626" : "#1d9e75",
              marginLeft: 4,
            }}
          >
            {message}
          </span>
        )}
      </div>

      {/* Review table */}
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 12,
            tableLayout: "auto",
          }}
        >
          <thead>
            <tr>
              <th style={{ ...thStyle, width: 28 }}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  style={{ cursor: "pointer" }}
                />
              </th>
              <th style={{ ...thStyle, width: 90 }}>Date</th>
              <th style={thStyle}>Description</th>
              <th style={{ ...thStyle, width: 80, textAlign: "right" }}>
                Amount
              </th>
              <th style={{ ...thStyle, width: 110 }}>Type</th>
              <th style={{ ...thStyle, width: 140 }}>Category</th>
              <th style={{ ...thStyle, width: 140 }}>Linked Account</th>
              <th style={{ ...thStyle, width: 140 }}>Payment Source</th>
            </tr>
          </thead>
          <tbody>
            {pendingRows.map((row) => {
              const isAutoFilled = !!row.auto_filled;
              const cellSelect = isAutoFilled ? autoFilledStyle : selectStyle;

              return (
                <tr
                  key={row.id}
                  style={{
                    background: selected.has(row.id) ? "#f0fdf4" : "white",
                  }}
                >
                  <td style={tdStyle}>
                    <input
                      type="checkbox"
                      checked={selected.has(row.id)}
                      onChange={() => toggleRow(row.id)}
                      style={{ cursor: "pointer" }}
                    />
                  </td>

                  <td style={{ ...tdStyle, whiteSpace: "nowrap", color: "#4b5563" }}>
                    {row.occurred_at}
                  </td>

                  <td style={{ ...tdStyle, color: "#1e293b", maxWidth: 200 }}>
                    <span
                      style={{
                        display: "block",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={row.description}
                    >
                      {row.description}
                    </span>
                  </td>

                  <td
                    style={{
                      ...tdStyle,
                      textAlign: "right",
                      fontVariantNumeric: "tabular-nums",
                      color: row.amount >= 0 ? "#059669" : "#dc2626",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatCurrency(row.amount)}
                  </td>

                  {/* Type dropdown */}
                  <td style={tdStyle}>
                    <select
                      value={row.transaction_type ?? ""}
                      onChange={(e) =>
                        handleFieldChange(row.id, "transaction_type", e.target.value)
                      }
                      style={isAutoFilled && row.transaction_type ? cellSelect : selectStyle}
                      disabled={isPending}
                    >
                      <option value="">Select…</option>
                      {TRANSACTION_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Category dropdown */}
                  <td style={tdStyle}>
                    <select
                      value={row.category_id ?? ""}
                      onChange={(e) =>
                        handleFieldChange(row.id, "category_id", e.target.value)
                      }
                      style={isAutoFilled && row.category_id ? cellSelect : selectStyle}
                      disabled={isPending}
                    >
                      <option value="">Select…</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Linked Account dropdown */}
                  <td style={tdStyle}>
                    <select
                      value={row.linked_account_id ?? ""}
                      onChange={(e) =>
                        handleFieldChange(row.id, "linked_account_id", e.target.value)
                      }
                      style={isAutoFilled && row.linked_account_id ? cellSelect : selectStyle}
                      disabled={isPending}
                    >
                      <option value="">None</option>
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {accountLabel(a)}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Payment Source dropdown */}
                  <td style={tdStyle}>
                    <select
                      value={row.payment_source_account_id ?? ""}
                      onChange={(e) =>
                        handleFieldChange(
                          row.id,
                          "payment_source_account_id",
                          e.target.value
                        )
                      }
                      style={
                        isAutoFilled && row.payment_source_account_id
                          ? cellSelect
                          : selectStyle
                      }
                      disabled={isPending}
                    >
                      <option value="">None</option>
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {accountLabel(a)}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
