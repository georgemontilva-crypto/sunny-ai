// Creates (or resets the password of) the first admin user.
// Reads ADMIN_EMAIL / ADMIN_PASSWORD / DATABASE_URL from the environment —
// run locally with `node --env-file=.env scripts/seed-admin.mjs`.
import argon2 from "argon2";
import postgres from "postgres";

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

const sql = postgres(DATABASE_URL);

try {
  const passwordHash = await argon2.hash(ADMIN_PASSWORD, { type: argon2.argon2id });

  const [user] = await sql`
    insert into users (email, password_hash, role)
    values (${ADMIN_EMAIL}, ${passwordHash}, 'admin')
    on conflict (email) do update set password_hash = excluded.password_hash
    returning id, email, role
  `;

  console.log(`[seed-admin] admin user ready: ${user.email} (${user.id})`);
} finally {
  await sql.end();
}
