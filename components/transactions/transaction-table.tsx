"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateTransactionInline,
  deleteTransactionInline,
} from "@/app/app/transactions/actions";

type TransactionRow = {
  id: string;
  transaction_date: string;
  description: string;
  amount: number;
  transaction_type: "income" | "expense";
  category_id: string;
  category_name: string;
  category_tag: "standard" | "savings" | "investment" | "debt_payment";
  linked_account_id: string | null;
  payment_source_account_id: string | null;
  linked_account_label: string | null;
  payment_source_label: string | null;
};

type Category = {
  id: string;
  name: string;
  tag: "standard" | "savings" | "investment" | "debt_payment";
  category_type: "income" | "expense";
};

type AccountOption = {
  id: string;
  name: string;
  account_kind: string;
  account_subtype: string | null;
};

// Edit values for one row — amount stored as string for input binding
type EditValues = {
  transaction_date: string;
  description: string;
  category_id: string;
  linked_account_id: string;
  payment_source_account_id: string;
  amount: string;
  transaction_type: "income" | "expense";
};

type TransactionTableProps = {
  rows: TransactionRow[];
  categories: Category[];
  accounts: AccountOption[];
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Compact shared input/select class used in every edit-mode cell
const cellInputCls =
  "w-full rounded border border-slate-300 bg-white px-1 py-0.5 text-xs text-slate-900 focus:border-slate-500 focus:outline-none";

export default function TransactionTable({
  rows,
  categories,
  accounts,
}: TransactionTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, EditValues>>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  const startEdit = (row: TransactionRow) => {
    setSaveError(null);
    setEditValues((prev) => ({
      ...prev,
      [row.id]: {
        transaction_date: row.transaction_date,
        description: row.description,
        category_id: row.category_id,
        linked_account_id: row.linked_account_id ?? "",
        payment_source_account_id: row.payment_source_account_id ?? "",
        amount: String(Math.abs(row.amount)),
        transaction_type: row.transaction_type,
      },
    }));
    setEditingId(row.id);
  };

  const updateEditValue = (id: string, field: keyof EditValues, value: string) => {
    setEditValues((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const handleSave = (id: string) => {
    const vals = editValues[id];
    if (!vals) return;

    setSaveError(null);
    startTransition(async () => {
      const result = await updateTransactionInline(id, {
        transaction_date: vals.transaction_date,
        description: vals.description,
        category_id: vals.category_id,
        linked_account_id: vals.linked_account_id || null,
        payment_source_account_id: vals.payment_source_account_id || null,
        amount: Number(vals.amount),
        transaction_type: vals.transaction_type,
      });

      if (!result.ok) {
        setSaveError(result.error ?? "Save failed");
        return;
      }

      setEditingId(null);
      router.refresh();
    });
  };

  const handleDelete = (id: string) => {
    setSaveError(null);
    startTransition(async () => {
      const result = await deleteTransactionInline(id);
      if (!result.ok) {
        setSaveError(result.error ?? "Delete failed");
        return;
      }
      router.refresh();
    });
  };

  if (!rows.length) {
    return (
      <section className="rounded-lg border border-slate-300 bg-white px-3 py-4 text-sm text-slate-600">
        No transactions for this month yet.
      </section>
    );
  }

  return (
    <section className="overflow-x-auto overflow-y-visible rounded-lg border border-slate-300 bg-white">
      {saveError && (
        <div className="border-b border-rose-200 bg-rose-50 px-4 py-2 text-xs text-rose-700">
          {saveError}
        </div>
      )}

      <table className="w-full border-collapse">
        <thead className="bg-slate-900 text-white">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide">
              Date
            </th>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide">
              Description
            </th>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide">
              Category
            </th>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide">
              Tag
            </th>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide">
              Linked Account
            </th>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide">
              Payment Source
            </th>
            <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide">
              Amount
            </th>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide">
              Type
            </th>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide">
              Actions
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-200">
          {rows.map((row) => {
            const isEditing = editingId === row.id;
            const vals = editValues[row.id];

            // Tag derived from selected category in edit mode
            const derivedTag = isEditing
              ? (categories.find((c) => c.id === vals?.category_id)?.tag ??
                row.category_tag)
              : row.category_tag;

            return (
              <tr
                key={row.id}
                className={isEditing ? "bg-slate-50" : undefined}
              >
                {/* DATE */}
                <td className="px-3 py-2 text-sm text-slate-700">
                  {isEditing ? (
                    <input
                      type="date"
                      value={vals?.transaction_date ?? ""}
                      onChange={(e) =>
                        updateEditValue(row.id, "transaction_date", e.target.value)
                      }
                      disabled={isPending}
                      className={cellInputCls}
                    />
                  ) : (
                    row.transaction_date
                  )}
                </td>

                {/* DESCRIPTION */}
                <td className="px-3 py-2 text-sm text-slate-900">
                  {isEditing ? (
                    <input
                      type="text"
                      value={vals?.description ?? ""}
                      onChange={(e) =>
                        updateEditValue(row.id, "description", e.target.value)
                      }
                      disabled={isPending}
                      className={cellInputCls}
                    />
                  ) : (
                    row.description
                  )}
                </td>

                {/* CATEGORY */}
                <td className="px-3 py-2 text-sm text-slate-700">
                  {isEditing ? (
                    <select
                      value={vals?.category_id ?? ""}
                      onChange={(e) =>
                        updateEditValue(row.id, "category_id", e.target.value)
                      }
                      disabled={isPending}
                      className={cellInputCls}
                    >
                      <option value="">— select —</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    row.category_name
                  )}
                </td>

                {/* TAG — always read-only; derived from selected category in edit mode */}
                <td className="px-3 py-2 text-sm capitalize text-slate-700">
                  {isEditing ? (
                    <span className="text-xs text-slate-500">
                      {derivedTag.replace("_", " ")}
                    </span>
                  ) : (
                    row.category_tag.replace("_", " ")
                  )}
                </td>

                {/* LINKED ACCOUNT */}
                <td className="px-3 py-2 text-sm text-slate-700">
                  {isEditing ? (
                    <select
                      value={vals?.linked_account_id ?? ""}
                      onChange={(e) =>
                        updateEditValue(row.id, "linked_account_id", e.target.value)
                      }
                      disabled={isPending}
                      className={cellInputCls}
                    >
                      <option value="">None</option>
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.account_subtype ? `${a.name} (${a.account_subtype})` : a.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    row.linked_account_label ?? "—"
                  )}
                </td>

                {/* PAYMENT SOURCE */}
                <td className="px-3 py-2 text-sm text-slate-700">
                  {isEditing ? (
                    <select
                      value={vals?.payment_source_account_id ?? ""}
                      onChange={(e) =>
                        updateEditValue(
                          row.id,
                          "payment_source_account_id",
                          e.target.value
                        )
                      }
                      disabled={isPending}
                      className={cellInputCls}
                    >
                      <option value="">None</option>
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.account_subtype ? `${a.name} (${a.account_subtype})` : a.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    row.payment_source_label ?? "—"
                  )}
                </td>

                {/* AMOUNT */}
                <td className="px-3 py-2 text-right text-sm font-medium tabular-nums">
                  {isEditing ? (
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={vals?.amount ?? ""}
                      onChange={(e) =>
                        updateEditValue(row.id, "amount", e.target.value)
                      }
                      disabled={isPending}
                      className={`${cellInputCls} text-right`}
                      style={{ width: "5rem" }}
                    />
                  ) : (
                    <span
                      style={{
                        color:
                          row.transaction_type === "income" ? "#1d9e75" : "#d85a30",
                      }}
                    >
                      {formatCurrency(Math.abs(row.amount))}
                    </span>
                  )}
                </td>

                {/* TYPE */}
                <td className="px-3 py-2 text-sm capitalize text-slate-700">
                  {isEditing ? (
                    <select
                      value={vals?.transaction_type ?? ""}
                      onChange={(e) =>
                        updateEditValue(
                          row.id,
                          "transaction_type",
                          e.target.value as "income" | "expense"
                        )
                      }
                      disabled={isPending}
                      className={cellInputCls}
                    >
                      <option value="income">Income</option>
                      <option value="expense">Expense</option>
                    </select>
                  ) : (
                    row.transaction_type
                  )}
                </td>

                {/* ACTIONS */}
                <td className="px-3 py-2 text-sm">
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSave(row.id)}
                        title="Save"
                        disabled={isPending}
                        className="cursor-pointer text-base leading-none text-emerald-600 hover:text-emerald-800 disabled:opacity-40"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        title="Cancel"
                        disabled={isPending}
                        className="cursor-pointer text-base leading-none text-slate-400 hover:text-slate-600 disabled:opacity-40"
                      >
                        ✗
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEdit(row)}
                        title="Edit"
                        disabled={isPending}
                        className="cursor-pointer text-sm leading-none text-blue-600 hover:text-blue-800 disabled:opacity-40"
                      >
                        ✏
                      </button>
                      <button
                        onClick={() => handleDelete(row.id)}
                        title="Delete"
                        disabled={isPending}
                        className="cursor-pointer text-sm leading-none text-rose-600 hover:text-rose-800 disabled:opacity-40"
                      >
                        🗑
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
