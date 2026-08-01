// Creates (or resets the password of) the first admin user.
// Reads ADMIN_EMAIL / ADMIN_PASSWORD / DATABASE_URL from the environment —
// run locally with `node --env-file=.env scripts/seed-admin.mjs`.
import { randomUUID } from "node:crypto";
import argon2 from "argon2";
import mysql from "mysql2/promise";

const { DATABASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

if (!DATABASE_URL) {
  console.error("[seed-admin] DATABASE_URL is not set");
  process.exit(1);
}
if (!ADMIN_EMAIL) {
  console.error("[seed-admin] ADMIN_EMAIL is not set");
  process.exit(1);
}
if (!ADMIN_PASSWORD) {
  console.error("[seed-admin] ADMIN_PASSWORD is not set");
  process.exit(1);
}
if (ADMIN_PASSWORD.length < 12) {
  console.error("[seed-admin] ADMIN_PASSWORD must be at least 12 characters");
  process.exit(1);
}

const connection = await mysql.createConnection(DATABASE_URL);

try {
  const passwordHash = await argon2.hash(ADMIN_PASSWORD, { type: argon2.argon2id });

  // A new id is only used if the email doesn't exist yet — ON DUPLICATE KEY
  // UPDATE keeps the existing row's id and just resets the password.
  await connection.execute(
    `INSERT INTO users (id, email, password_hash, role)
     VALUES (?, ?, ?, 'admin')
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
    [randomUUID(), ADMIN_EMAIL, passwordHash]
  );

  const [rows] = await connection.execute("SELECT id, email, role FROM users WHERE email = ?", [ADMIN_EMAIL]);
  const user = rows[0];

  console.log(`[seed-admin] admin user ready: ${user.email} (${user.id})`);
} finally {
  await connection.end();
}
