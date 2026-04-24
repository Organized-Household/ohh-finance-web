import { z } from "zod";

const rowSchema = z.object({
  occurred_at: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  description: z.string().min(1).max(500),
  amount: z.number().finite(),
});

export const importPayloadSchema = z.object({
  rows: z.array(rowSchema).min(1).max(5000),
  original_filename: z.string().max(255),
});

export type ImportPayload = z.infer<typeof importPayloadSchema>;
export type ImportRow = z.infer<typeof rowSchema>;
