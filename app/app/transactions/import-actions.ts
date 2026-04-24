"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantMembership } from "@/lib/tenant/get-current-tenant-membership";
import { importPayloadSchema } from "@/lib/validation/import";
import type { ParsedRow } from "@/lib/csv/parseImportFile";

// ─── importStagingRows ────────────────────────────────────────────────────────
// Validates parsed rows, creates an import_batch record, auto-fills 4 fields
// from description history, and inserts all rows into import_staging.
// Called from ImportPanel after successful client-side CSV parse.
// Never logs row contents — counts only.
export async function importStagingRows(payload: {
  rows: ParsedRow[];
  original_filename: string;
}): Promise<
  | { ok: true; data: { batch_id: string; count: number } }
  | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, error: "Not authenticated" };
  }

  const membership = await getCurrentTenantMembership();
  const tenantId = membership.tenant_id;

  // Server-side validation
  const parse = importPayloadSchema.safeParse(payload);
  if (!parse.success) {
    return { ok: false, error: "Invalid import data" };
  }

  const { rows, original_filename } = parse.data;

  // Step 1 — Create import batch
  const { data: batch, error: batchError } = await supabase
    .from("import_batches")
    .insert({
      tenant_id: tenantId,
      original_filename,
      imported_by: user.id,
      status: "created",
    })
    .select("id")
    .single();

  if (batchError || !batch) {
    console.error("[import] batch create failed", { code: batchError?.code });
    return { ok: false, error: "Failed to create import batch" };
  }

  // Step 2 — Batch history lookup: one RPC call for all unique descriptions
  const uniqueDescriptions = [...new Set(rows.map((r) => r.description))];

  const { data: historyRows } = await supabase.rpc(
    "get_latest_transactions_by_description",
    {
      p_tenant_id: tenantId,
      p_descriptions: uniqueDescriptions,
    }
  );

  // Build lookup map: LOWER(description) → auto-fill fields
  const historyMap = new Map<
    string,
    {
      category_id: string | null;
      transaction_type: string | null;
      linked_account_id: string | null;
      payment_source_account_id: string | null;
    }
  >();

  if (historyRows) {
    for (const h of historyRows as {
      description_key: string;
      category_id: string | null;
      transaction_type: string | null;
      linked_account_id: string | null;
      payment_source_account_id: string | null;
    }[]) {
      historyMap.set(h.description_key, {
        category_id: h.category_id,
        transaction_type: h.transaction_type,
        linked_account_id: h.linked_account_id,
        payment_source_account_id: h.payment_source_account_id,
      });
    }
  }

  // Decision 2026-04-22: only 'income' and 'expense' are valid.
  // Guard against stale history rows that may contain old savings/investment values.
  const VALID_TYPES = ["income", "expense"] as const;
  type ValidType = (typeof VALID_TYPES)[number];

  const deriveType = (historyType: string | null, amount: number): ValidType => {
    if (historyType && (VALID_TYPES as readonly string[]).includes(historyType)) {
      return historyType as ValidType;
    }
    return amount >= 0 ? "income" : "expense";
  };

  // Step 3 — Build staging rows with auto-fill
  const stagingRows = rows.map((row) => {
    const history = historyMap.get(row.description.toLowerCase()) ?? null;
    return {
      tenant_id: tenantId,
      import_batch_id: batch.id,
      occurred_at: row.occurred_at,
      description: row.description,
      amount: row.amount,
      transaction_type: deriveType(history?.transaction_type ?? null, row.amount),
      category_id: history?.category_id ?? null,
      linked_account_id: history?.linked_account_id ?? null,
      payment_source_account_id: history?.payment_source_account_id ?? null,
      status: "pending",
    };
  });

  // Step 4 — Insert staging rows
  const { error: insertError } = await supabase
    .from("import_staging")
    .insert(stagingRows);

  if (insertError) {
    await supabase
      .from("import_batches")
      .update({ status: "failed" })
      .eq("id", batch.id);
    console.error("[import] insert failed", {
      batchId: batch.id,
      code: insertError.code,
    });
    return { ok: false, error: "Failed to save imported rows" };
  }

  // Step 5 — Mark batch stored_pending
  await supabase
    .from("import_batches")
    .update({ status: "stored_pending" })
    .eq("id", batch.id);

  console.log("[import] success", {
    batchId: batch.id,
    count: stagingRows.length,
  });

  revalidatePath("/app/transactions");

  return {
    ok: true,
    data: { batch_id: batch.id, count: stagingRows.length },
  };
}

// ─── updateStagingRow ─────────────────────────────────────────────────────────
// Patches one staging row's editable fields (called when user changes a dropdown
// in the review table). Tenant check is enforced by RLS + explicit eq filter.
export async function updateStagingRow(
  rowId: string,
  updates: {
    category_id?: string | null;
    transaction_type?: string | null;
    linked_account_id?: string | null;
    payment_source_account_id?: string | null;
  }
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, error: "Not authenticated" };
  }

  const membership = await getCurrentTenantMembership();

  const { error } = await supabase
    .from("import_staging")
    .update({
      category_id: updates.category_id ?? null,
      transaction_type: updates.transaction_type ?? null,
      linked_account_id: updates.linked_account_id ?? null,
      payment_source_account_id: updates.payment_source_account_id ?? null,
    })
    .eq("id", rowId)
    .eq("tenant_id", membership.tenant_id)
    .eq("status", "pending");

  if (error) {
    console.error("[updateStagingRow] failed", { code: error.code });
    return { ok: false, error: "Failed to update row" };
  }

  return { ok: true };
}

// ─── postStagingRows ──────────────────────────────────────────────────────────
// Copies selected staging rows → transactions, deletes from staging.
// Marks batch completed when all rows for that batch are posted.
export async function postStagingRows(
  rowIds: string[]
): Promise<{ ok: boolean; count?: number; error?: string }> {
  if (!rowIds.length) {
    return { ok: false, error: "No rows selected" };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, error: "Not authenticated" };
  }

  const membership = await getCurrentTenantMembership();
  const tenantId = membership.tenant_id;

  // Fetch staging rows to post (RLS + explicit tenant check)
  const { data: stagingRows, error: fetchError } = await supabase
    .from("import_staging")
    .select("*")
    .eq("tenant_id", tenantId)
    .in("id", rowIds)
    .eq("status", "pending");

  if (fetchError || !stagingRows?.length) {
    return { ok: false, error: "No pending rows found" };
  }

  // Copy to transactions table
  // occurred_at (staging) → transaction_date (transactions physical column)
  // amount is signed — negative for expenses (constraint: amount <> 0)
  // transaction_type: 'income' | 'expense' only (confirmed from DB constraint)
  const transactionsToInsert = stagingRows.map((row) => ({
    tenant_id: row.tenant_id,
    transaction_date: row.occurred_at,
    description: row.description,
    amount: row.amount,
    transaction_type: row.transaction_type ?? "expense",
    category_id: row.category_id ?? null,
    linked_account_id: row.linked_account_id ?? null,
    payment_source_account_id: row.payment_source_account_id ?? null,
    created_by_user_id: user.id,
  }));

  // Pre-insert log — types only, never row contents
  console.log("[post] inserting", {
    count: transactionsToInsert.length,
    types: transactionsToInsert.map((r) => r.transaction_type),
  });

  const { error: insertError } = await supabase
    .from("transactions")
    .insert(transactionsToInsert);

  if (insertError) {
    console.error("[postStagingRows] insert failed", {
      code: insertError.code,
    });
    return { ok: false, error: "Failed to post transactions" };
  }

  // Delete from staging
  await supabase
    .from("import_staging")
    .delete()
    .eq("tenant_id", tenantId)
    .in("id", rowIds);

  // Mark any now-empty batches as completed
  const batchIds = [...new Set(stagingRows.map((r) => r.import_batch_id))];
  for (const batchId of batchIds) {
    const { count } = await supabase
      .from("import_staging")
      .select("id", { count: "exact", head: true })
      .eq("import_batch_id", batchId)
      .eq("tenant_id", tenantId);

    if (count === 0) {
      await supabase
        .from("import_batches")
        .update({ status: "completed" })
        .eq("id", batchId);
    }
  }

  revalidatePath("/app/transactions");

  return { ok: true, count: transactionsToInsert.length };
}
