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

type TransactionTableProps = {
  rows: TransactionRow[];
  categories: Category[];
  accounts: AccountOption[];
  selectedMonth: string;
  updateAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function TransactionTable({
  rows,
  categories,
  accounts,
  selectedMonth,
  updateAction,
  deleteAction,
}: TransactionTableProps) {
  const incomeCategories = categories.filter(
    (category) => category.category_type === "income"
  );
  const standardCategories = categories.filter(
    (category) =>
      category.category_type === "expense" && category.tag === "standard"
  );
  const savingsCategories = categories.filter(
    (category) =>
      category.category_type === "expense" && category.tag === "savings"
  );
  const investmentCategories = categories.filter(
    (category) =>
      category.category_type === "expense" && category.tag === "investment"
  );
  const debtPaymentCategories = categories.filter(
    (category) =>
      category.category_type === "expense" && category.tag === "debt_payment"
  );

  if (!rows.length) {
    return (
      <section className="rounded-lg border border-slate-300 bg-white px-3 py-4 text-sm text-slate-600">
        No transactions for this month yet.
      </section>
    );
  }

  return (
    <section className="overflow-x-auto overflow-y-visible rounded-lg border border-slate-300 bg-white">
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
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="px-3 py-2 text-sm text-slate-700">
                {row.transaction_date}
              </td>
              <td className="px-3 py-2 text-sm text-slate-900">
                {row.description}
              </td>
              <td className="px-3 py-2 text-sm text-slate-700">
                {row.category_name}
              </td>
              <td className="px-3 py-2 text-sm capitalize text-slate-700">
                {row.category_tag.replace("_", " ")}
              </td>
              <td className="px-3 py-2 text-sm text-slate-700">
                {row.linked_account_label ?? "—"}
              </td>
              <td className="px-3 py-2 text-sm text-slate-700">
                {row.payment_source_label ?? "—"}
              </td>
              <td className="px-3 py-2 text-right text-sm font-medium tabular-nums">
                <span style={{ color: row.transaction_type === "income" ? "#1d9e75" : "#d85a30" }}>
                  {formatCurrency(Math.abs(row.amount))}
                </span>
              </td>
              <td className="px-3 py-2 text-sm capitalize text-slate-700">
                {row.transaction_type}
              </td>
              <td className="align-top px-3 py-2 text-sm text-slate-500">
                <div className="flex items-start gap-2">
                  <details>
                    <summary className="h-7 cursor-pointer list-none rounded border border-slate-300 px-2 text-xs leading-7 text-slate-700">
                      Edit
                    </summary>
                    <div className="mt-2 w-80 rounded border border-slate-300 bg-white p-3 shadow-lg">
                      <form action={updateAction} className="space-y-2">
                        <input type="hidden" name="id" value={row.id} />
                        <input type="hidden" name="month" value={selectedMonth} />

                        <div>
                          <label
                            htmlFor={`description-${row.id}`}
                            className="mb-1 block text-xs font-medium text-slate-700"
                          >
                            Description
                          </label>
                          <input
                            id={`description-${row.id}`}
                            name="description"
                            defaultValue={row.description}
                            required
                            className="h-8 w-full rounded border border-slate-300 px-2 text-sm"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label
                              htmlFor={`amount-${row.id}`}
                              className="mb-1 block text-xs font-medium text-slate-700"
                            >
                              Amount
                            </label>
                            <input
                              id={`amount-${row.id}`}
                              name="amount"
                              type="number"
                              min="0.01"
                              step="0.01"
                              inputMode="decimal"
                              defaultValue={Math.abs(row.amount)}
                              required
                              className="h-8 w-full rounded border border-slate-300 px-2 text-right text-sm"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor={`date-${row.id}`}
                              className="mb-1 block text-xs font-medium text-slate-700"
                            >
                              Date
                            </label>
                            <input
                              id={`date-${row.id}`}
                              name="transaction_date"
                              type="date"
                              defaultValue={row.transaction_date}
                              required
                              className="h-8 w-full rounded border border-slate-300 px-2 text-sm"
                            />
                          </div>
                        </div>

                        <div>
                          <label
                            htmlFor={`category-${row.id}`}
                            className="mb-1 block text-xs font-medium text-slate-700"
                          >
                            Category
                          </label>
                          <select
                            id={`category-${row.id}`}
                            name="category_id"
                            defaultValue={row.category_id}
                            className="h-8 w-full rounded border border-slate-300 px-2 text-sm"
                          >
                            {incomeCategories.length ? (
                              <optgroup label="Income">
                                {incomeCategories.map((category) => (
                                  <option key={category.id} value={category.id}>
                                    {category.name}
                                  </option>
                                ))}
                              </optgroup>
                            ) : null}
                            {standardCategories.length ? (
                              <optgroup label="Standard">
                                {standardCategories.map((category) => (
                                  <option key={category.id} value={category.id}>
                                    {category.name}
                                  </option>
                                ))}
                              </optgroup>
                            ) : null}
                            {savingsCategories.length ? (
                              <optgroup label="Savings">
                                {savingsCategories.map((category) => (
                                  <option key={category.id} value={category.id}>
                                    {category.name}
                                  </option>
                                ))}
                              </optgroup>
                            ) : null}
                            {investmentCategories.length ? (
                              <optgroup label="Investment">
                                {investmentCategories.map((category) => (
                                  <option key={category.id} value={category.id}>
                                    {category.name}
                                  </option>
                                ))}
                              </optgroup>
                            ) : null}
                            {debtPaymentCategories.length ? (
                              <optgroup label="Debt Payment">
                                {debtPaymentCategories.map((category) => (
                                  <option key={category.id} value={category.id}>
                                    {category.name}
                                  </option>
                                ))}
                              </optgroup>
                            ) : null}
                          </select>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                          <div>
                            <select
                              id={`linked-account-${row.id}`}
                              name="linked_account_id"
                              defaultValue={row.linked_account_id ?? ""}
                              className="h-8 w-full rounded border border-slate-300 px-2 text-sm"
                            >
                              <option value="">Linked Account (optional)</option>
                              {accounts.map((account) => (
                                <option key={account.id} value={account.id}>
                                  {account.account_subtype
                                    ? `${account.name} - ${account.account_subtype}`
                                    : account.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <select
                              id={`payment-source-${row.id}`}
                              name="payment_source_account_id"
                              defaultValue={row.payment_source_account_id ?? ""}
                              className="h-8 w-full rounded border border-slate-300 px-2 text-sm"
                            >
                              <option value="">Payment Source (optional)</option>
                              {accounts.map((account) => (
                                <option key={account.id} value={account.id}>
                                  {account.account_subtype
                                    ? `${account.name} - ${account.account_subtype}`
                                    : account.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="h-8 w-full rounded bg-slate-900 px-3 text-xs font-medium text-white"
                        >
                          Save Changes
                        </button>
                      </form>
                    </div>
                  </details>

                  <details>
                    <summary className="h-7 cursor-pointer list-none rounded border border-rose-300 px-2 text-xs leading-7 text-rose-700">
                      Delete
                    </summary>
                    <div className="mt-2 w-48 rounded border border-slate-300 bg-white p-2 shadow-lg">
                      <p className="mb-2 text-[11px] text-slate-600">
                        Delete this transaction?
                      </p>
                      <form action={deleteAction}>
                        <input type="hidden" name="id" value={row.id} />
                        <input type="hidden" name="month" value={selectedMonth} />
                        <button
                          type="submit"
                          className="h-8 w-full rounded bg-rose-600 px-3 text-xs font-medium text-white"
                        >
                          Confirm Delete
                        </button>
                      </form>
                    </div>
                  </details>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
