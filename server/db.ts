// Lazy DB singleton. Static build (vite build + prerender) must succeed
// without DATABASE_URL set, so nothing here may run at import time — only
// on first call to getDb().
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.ts";

export type Db = PostgresJsDatabase<typeof schema>;

let db: Db | null | undefined;

export function getDb(): Db | null {
  if (db !== undefined) return db;

  const url = process.env.DATABASE_URL;
  if (!url) {
    db = null;
    return db;
  }

  const client = postgres(url);
  db = drizzle(client, { schema });
  return db;
}
