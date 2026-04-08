"use client"

import { useState } from "react"
import { upsertBudget } from "@/app/app/budgets/actions"

type Category = {
  id: string
  name: string
}

type Props = {
  categories: Category[]
  month: string
}

export default function BudgetTable({
  categories,
  month
}: Props) {

  const [values, setValues] = useState<
    Record<
      string,
      {
        planned_income: number
        planned_expense: number
      }
    >
  >({})

  function updateValue(
    categoryId: string,
    field: "planned_income" | "planned_expense",
    value: number
  ) {

    setValues(prev => ({
      ...prev,
      [categoryId]: {
        ...prev[categoryId],
        [field]: value
      }
    }))

  }

  async function handleSave() {

    const lines = categories.map(category => ({

      category_id: category.id,

      planned_income:
        values[category.id]?.planned_income ?? 0,

      planned_expense:
        values[category.id]?.planned_expense ?? 0

    }))

    await upsertBudget({

      month,

      lines

    })

    alert("Budget saved")

  }

  return (

    <div className="space-y-4">

      <div className="flex items-center justify-between">

        <h2 className="text-lg font-medium">
          Budget for {month}
        </h2>

        <button
          onClick={handleSave}
          className="rounded bg-black px-4 py-2 text-white"
        >
          Save
        </button>

      </div>

      <table className="w-full border-collapse">

        <thead>

          <tr className="border-b">

            <th className="py-2 text-left">
              Category
            </th>

            <th className="py-2 text-left">
              Planned Income
            </th>

            <th className="py-2 text-left">
              Planned Expense
            </th>

          </tr>

        </thead>

        <tbody>

          {categories.map(category => (

            <tr
              key={category.id}
              className="border-b"
            >

              <td className="py-2">
                {category.name}
              </td>

              <td>

                <input
                  type="number"
                  min="0"
                  className="w-full rounded border px-2 py-1"

                  onChange={e =>
                    updateValue(
                      category.id,
                      "planned_income",
                      Number(e.target.value)
                    )
                  }

                />

              </td>

              <td>

                <input
                  type="number"
                  min="0"
                  className="w-full rounded border px-2 py-1"

                  onChange={e =>
                    updateValue(
                      category.id,
                      "planned_expense",
                      Number(e.target.value)
                    )
                  }

                />

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>

  )

}