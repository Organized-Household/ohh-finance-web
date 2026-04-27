import { z } from "zod";

// Keep for any callers that still reference the legacy enum — slugs are now
// validated at DB level via FK to expense_types.slug.
export const categoryTagSchema = z.string().min(1, "Tag is required");

export const categoryTypeSchema = z.enum([
  "income",
  "expense",
]);

export const createCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Category name is required")
    .max(100, "Category name must be 100 characters or less"),
  tag: categoryTagSchema,
  category_type: categoryTypeSchema,
});

export const updateCategorySchema = z.object({
  id: z.string().uuid(),
  name: z
    .string()
    .trim()
    .min(1, "Category name is required")
    .max(100, "Category name must be 100 characters or less"),
  tag: categoryTagSchema,
  category_type: categoryTypeSchema,
});

export const deleteCategorySchema = z.object({
  id: z.string().uuid(),
});
