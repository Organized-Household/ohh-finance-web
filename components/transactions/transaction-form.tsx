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

type TransactionFormProps = {
  categories: Category[];
  defaultDate: string;
  accounts: AccountOption[];
  action: (formData: FormData) => Promise<void>;
};

export default function TransactionForm({
  categories,
  defaultDate,
  accounts,
  action,
}: TransactionFormProps) {
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

  const firstCategory = categories[0]?.id ?? "";

  return (
    <section className="rounded-lg border border-slate-300 bg-white p-3">
      <h2 className="text-sm font-semibold text-slate-900">Add Transaction</h2>

      <form
        id="transaction-create-form"
        action={action}
        className="mt-2 grid gap-2 md:grid-cols-[minmax(0,1fr)_9rem_10rem_minmax(0,1fr)_auto]"
      >
        <div>
          <label htmlFor="description" className="sr-only">
            Description
          </label>
          <input
            id="description"
            name="description"
            type="text"
            placeholder="Description"
            required
            className="h-8 w-full rounded border border-slate-300 px-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="amount" className="sr-only">
            Amount
          </label>
          <input
            id="amount"
            name="amount"
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            required
            placeholder="0.00"
            className="h-8 w-full rounded border border-slate-300 px-2 text-right text-sm"
          />
        </div>

        <div>
          <label htmlFor="transaction_date" className="sr-only">
            Date
          </label>
          <input
            id="transaction_date"
            name="transaction_date"
            type="date"
            required
            defaultValue={defaultDate}
            className="h-8 w-full rounded border border-slate-300 px-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="category_id" className="sr-only">
            Category
          </label>
          <select
            id="category_id"
            name="category_id"
            required
            defaultValue={firstCategory}
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

        <button
          type="submit"
          className="h-8 rounded bg-slate-900 px-3 text-sm font-medium text-white"
        >
          Add Transaction
        </button>

        <div className="md:col-span-5">
          <div className="mt-1 grid gap-2 md:grid-cols-2">
            <div>
              <select
                id="linked_account_id"
                name="linked_account_id"
                defaultValue=""
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
                id="payment_source_account_id"
                name="payment_source_account_id"
                defaultValue=""
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
        </div>
      </form>
    </section>
  );
}
