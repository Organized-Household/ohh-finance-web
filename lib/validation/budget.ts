import { z } from "zod"

export const budgetLineSchema = z.object({

  category_id: z.string().uuid(),

  planned_income: z
    .number()
    .min(0)
    .default(0),

  planned_expense: z
    .number()
    .min(0)
    .default(0)

})

export const budgetSchema = z.object({

  month: z.string(), // YYYY-MM

  lines: z.array(budgetLineSchema)

})