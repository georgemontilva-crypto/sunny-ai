import { boolean, index, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("admin"), // 'admin' | 'editor'
  isActive: boolean("is_active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    ip: text("ip"),
    userAgent: text("user_agent"),
  },
  (table) => [
    index("sessions_user_id_idx").on(table.userId),
    index("sessions_expires_at_idx").on(table.expiresAt),
  ]
);

export const media = pgTable("media", {
  id: uuid("id").primaryKey().defaultRandom(),
  slot: text("slot").notNull().unique(), // 'hero-bg', 'card-sleep-quality', etc.
  r2Key: text("r2_key").notNull(),
  alt: text("alt").notNull().default(""),
  width: integer("width"),
  height: integer("height"),
  bytes: integer("bytes"),
  mimeType: text("mime_type"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  updatedBy: uuid("updated_by").references(() => users.id),
});

export const requests = pgTable(
  "requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    goal: text("goal"),
    message: text("message").notNull(),
    source: text("source").notNull().default("contact"), // 'contact' | 'partner' | 'newsletter'
    status: text("status").notNull().default("new"), // 'new' | 'contacted' | 'closed' | 'spam'
    notes: text("notes"),
    ip: text("ip"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("requests_status_created_at_idx").on(table.status, table.createdAt.desc()),
    index("requests_email_idx").on(table.email),
  ]
);

export const settings = pgTable("settings", {
  key: text("key").primaryKey(), // 'contact_email', 'newsletter_email', ...
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  action: text("action").notNull(), // 'media.replace', 'request.status', 'settings.update'
  entity: text("entity"),
  detail: jsonb("detail"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
