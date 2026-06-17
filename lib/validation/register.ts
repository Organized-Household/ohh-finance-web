import { z } from "zod";

export const registerSchema = z.object({
  alias: z
    .string()
    .trim()
    .min(1, "Household alias is required")
    .max(100, "Household alias must be 100 characters or less"),
  email: z.string().trim().email("Valid email is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long"),
});
