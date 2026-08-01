import type { Db } from "./db.ts";
import { auditLog } from "./schema.ts";

export function writeAudit(
  db: Db,
  entry: { userId: string; action: string; entity?: string; detail?: unknown }
): Promise<unknown> {
  return db.insert(auditLog).values({
    userId: entry.userId,
    action: entry.action,
    entity: entry.entity,
    detail: entry.detail ?? null,
  });
}
