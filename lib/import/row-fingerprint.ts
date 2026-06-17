/**
 * Row-level import idempotency utilities
 * Story: OHHFIN-175 / STORY-12.3
 *
 * Computes deterministic fingerprints for import_staging rows to prevent duplicates.
 */

import { createHash } from 'crypto';

/**
 * Normalize a description string for fingerprinting.
 * Lowercase and strip leading/trailing whitespace.
 */
export function normalizeDescription(description: string): string {
  return description.trim().toLowerCase();
}

/**
 * Compute row fingerprint for import_staging deduplication.
 *
 * Format: SHA-256(tenant_id + transaction_date + amount + normalized_description)
 *
 * @param tenantId - UUID of the tenant
 * @param transactionDate - Date in YYYY-MM-DD format
 * @param amount - Numeric amount (will be stringified)
 * @param description - Raw description string
 * @returns Hex string SHA-256 hash
 */
export function computeRowFingerprint(
  tenantId: string,
  transactionDate: string,
  amount: number,
  description: string
): string {
  const normalized = normalizeDescription(description);
  const payload = `${tenantId}${transactionDate}${amount}${normalized}`;
  return createHash('sha256').update(payload, 'utf8').digest('hex');
}
