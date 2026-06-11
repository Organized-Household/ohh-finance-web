export function logServerActionError(action: string, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[server-action] ${action} failed — ${message}`);
}
