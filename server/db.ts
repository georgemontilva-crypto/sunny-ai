// Lazy DB singleton. Static build (vite build + prerender) must succeed
// without DATABASE_URL set, so nothing here may run at import time — only
// on first call to getDb().
import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema.ts";

export type Db = MySql2Database<typeof schema>;

let db: Db | null | undefined;

export function getDb(): Db | null {
  if (db !== undefined) return db;

  const url = process.env.DATABASE_URL;
  if (!url) {
    db = null;
    return db;
  }

  const pool = mysql.createPool(url);
  db = drizzle(pool, { schema, mode: "default" });
  return db;
}
