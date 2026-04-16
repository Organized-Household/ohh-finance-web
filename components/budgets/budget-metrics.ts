export type BudgetCategory = {
  id: string;
  name: string;
  tag: "standard" | "savings" | "investment";
  category_type: "income" | "expense";
};

export type BudgetLine = {
  category_id: string;
  amount: number;
};

export type BudgetBucketKey = "income" | "standard" | "savings" | "investment";

export type BudgetMetrics = {
  totals: Record<BudgetBucketKey, number>;
  totalExpenses: number;
  remainingBalance: number;
  distributionTotal: number;
  percentages: Record<BudgetBucketKey, number>;
  expensePercentages: Record<"standard" | "savings" | "investment", number>;
  incomeDistribution: Array<{
    categoryId: string;
    name: string;
    amount: number;
    percentage: number;
  }>;
};

const BUCKET_ORDER: BudgetBucketKey[] = [
  "income",
  "standard",
  "savings",
  "investment",
];

function sanitizeAmount(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function computeBudgetMetrics(
  categories: BudgetCategory[],
  budgetLines: BudgetLine[]
): BudgetMetrics {
  const amountByCategoryId = new Map<string, number>();

  for (const line of budgetLines) {
    const existing = amountByCategoryId.get(line.category_id) ?? 0;
    amountByCategoryId.set(
      line.category_id,
      existing + sanitizeAmount(Number(line.amount))
    );
  }

  const totals: Record<BudgetBucketKey, number> = {
    income: 0,
    standard: 0,
    savings: 0,
    investment: 0,
  };

  for (const category of categories) {
    const amount = amountByCategoryId.get(category.id) ?? 0;

    if (category.category_type === "income") {
      totals.income += amount;
    }

    if (category.tag === "savings") {
      totals.savings += amount;
    } else if (category.tag === "investment") {
      totals.investment += amount;
    } else if (
      category.tag === "standard" &&
      category.category_type === "expense"
    ) {
      totals.standard += amount;
    }
  }

  const totalExpenses = totals.standard + totals.savings + totals.investment;
  const remainingBalance = totals.income - totalExpenses;
  const distributionTotal =
    totals.income + totals.standard + totals.savings + totals.investment;

  const percentages: Record<BudgetBucketKey, number> = {
    income: 0,
    standard: 0,
    savings: 0,
    investment: 0,
  };

  if (distributionTotal > 0) {
    for (const bucket of BUCKET_ORDER) {
      percentages[bucket] = (totals[bucket] / distributionTotal) * 100;
    }
  }

  const expensePercentages: Record<"standard" | "savings" | "investment", number> =
    {
      standard: 0,
      savings: 0,
      investment: 0,
    };

  if (totalExpenses > 0) {
    expensePercentages.standard = (totals.standard / totalExpenses) * 100;
    expensePercentages.savings = (totals.savings / totalExpenses) * 100;
    expensePercentages.investment = (totals.investment / totalExpenses) * 100;
  }

  const incomeCategories = categories.filter(
    (category) => category.category_type === "income"
  );

  const incomeDistribution = incomeCategories.map((category) => {
    const amount = amountByCategoryId.get(category.id) ?? 0;

    return {
      categoryId: category.id,
      name: category.name,
      amount,
      percentage:
        incomeCategories.length === 1
          ? 100
          : totals.income > 0
            ? (amount / totals.income) * 100
            : 0,
    };
  });

  return {
    totals,
    totalExpenses,
    remainingBalance,
    distributionTotal,
    percentages,
    expensePercentages,
    incomeDistribution,
  };
}
