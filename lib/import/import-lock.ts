/**
 * Import Lock Utilities
 * Story: OHHFIN-167 — STORY-12.9 — Handle Concurrent Import Race Conditions
 * 
 * Provides safe concurrent import handling using PostgreSQL advisory locks
 * and duplicate detection mechanisms.
 */

import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Acquire an advisory lock for import operations scoped to a tenant.
 * This ensures only one import can proceed at a time per tenant.
 * 
 * @param tenantId - The tenant UUID to lock imports for
 * @returns Lock ID to be used for releasing the lock
 * @throws Error if lock acquisition fails
 */
export async function acquireImportLock(tenantId: string): Promise<string> {
  const supabase = createAdminClient();
  
  const { data, error } = await supabase
    .rpc('acquire_import_lock', { p_tenant_id: tenantId });
  
  if (error) {
    console.error('[acquireImportLock] Failed to acquire lock:', error);
    throw new Error(`Failed to acquire import lock: ${error.message}`);
  }
  
  return data.toString();
}

/**
 * Release an advisory lock previously acquired for import operations.
 * 
 * @param lockId - The lock ID returned from acquireImportLock
 * @returns True if lock was successfully released
 * @throws Error if lock release fails
 */
export async function releaseImportLock(lockId: string): Promise<boolean> {
  const supabase = createAdminClient();
  
  const { data, error } = await supabase
    .rpc('release_import_lock', { p_lock_id: parseInt(lockId, 10) });
  
  if (error) {
    console.error('[releaseImportLock] Failed to release lock:', error);
    throw new Error(`Failed to release import lock: ${error.message}`);
  }
  
  return data as boolean;
}

/**
 * Check if an import with identical content already exists.
 * Uses file hash to detect exact duplicates.
 * 
 * @param tenantId - The tenant UUID
 * @param filename - Original filename
 * @param fileHash - SHA-256 hash of file content
 * @returns Existing batch info if duplicate found, null otherwise
 */
export async function checkDuplicateImport(
  tenantId: string,
  filename: string,
  fileHash: string
): Promise<{
  batch_id: string;
  status: string;
  created_at: string;
} | null> {
  const supabase = createAdminClient();
  
  const { data, error } = await supabase
    .rpc('check_duplicate_import', {
      p_tenant_id: tenantId,
      p_filename: filename,
      p_file_hash: fileHash
    });
  
  if (error) {
    console.error('[checkDuplicateImport] Query failed:', error);
    throw new Error(`Failed to check for duplicate import: ${error.message}`);
  }
  
  if (!data || data.length === 0) {
    return null;
  }
  
  return data[0];
}

/**
 * Execute an import operation with automatic lock management.
 * Acquires lock, executes operation, and ensures lock is released even on error.
 * 
 * @param tenantId - The tenant UUID to lock imports for
 * @param operation - Async function to execute while lock is held
 * @returns Result of the operation
 * @throws Error if operation fails or lock management fails
 */
export async function withImportLock<T>(
  tenantId: string,
  operation: () => Promise<T>
): Promise<T> {
  let lockId: string | null = null;
  
  try {
    lockId = await acquireImportLock(tenantId);
    const result = await operation();
    return result;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[withImportLock] Operation failed:', message);
    throw err;
  } finally {
    if (lockId) {
      try {
        await releaseImportLock(lockId);
      } catch (releaseErr: unknown) {
        const message = releaseErr instanceof Error ? releaseErr.message : 'Unknown error';
        console.error('[withImportLock] Failed to release lock:', message);
      }
    }
  }
}

/**
 * Calculate SHA-256 hash of file content.
 * Used for duplicate detection.
 * 
 * @param content - File content as string or ArrayBuffer
 * @returns Hex-encoded SHA-256 hash
 */
export async function calculateFileHash(content: string | ArrayBuffer): Promise<string> {
  const encoder = new TextEncoder();
  const data = typeof content === 'string' 
    ? encoder.encode(content)
    : new Uint8Array(content);
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}
