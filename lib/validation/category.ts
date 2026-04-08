import { z } from "zod";

export const categoryTagSchema = z.enum([
  "standard",
  "savings",
  "investment",
]);

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