import { ZodError } from "zod";

/**
 * Server actions validate untrusted input with zod before touching the
 * database. A raw ZodError message ("Invalid input: expected number,
 * received string") is not something to show a user - fall back to a
 * caller-supplied, human sentence for it. An Error thrown on purpose (e.g.
 * "Recipe not found") is already human-readable and passes through as-is.
 */
export function getActionErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ZodError) return fallback;
  if (err instanceof Error) return err.message;
  return fallback;
}
