import { randomUUID } from "node:crypto";
import type { Db } from "./db.ts";
import { auditLog } from "./schema.ts";

export function writeAudit(
  db: Db,
  // userId is null for anything the server does on its own — the scheduled
  // publisher is the only one today. The column is nullable for this.
  entry: { userId: string | null; action: string; entity?: string; detail?: unknown }
): Promise<unknown> {
  return db.insert(auditLog).values({
    id: randomUUID(),
    userId: entry.userId,
    action: entry.action,
    entity: entry.entity,
    detail: entry.detail ?? null,
  });
}
