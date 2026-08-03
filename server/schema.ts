import { boolean, index, json, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

// MySQL has no built-in random-uuid column default (unlike Postgres'
// gen_random_uuid()) — every id is generated in application code via
// crypto.randomUUID() and passed in explicitly on insert.
const uuidPk = () => varchar("id", { length: 36 }).primaryKey();

export const users = mysqlTable("users", {
  id: uuidPk(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: varchar("role", { length: 20 }).notNull().default("admin"), // 'admin' | 'editor' | 'member'
  isActive: boolean("is_active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  // Panel accounts (admin/editor) don't collect this — only public signup
  // does, so it's nullable rather than backfilled.
  name: text("name"),
  // Not read anywhere yet — reserved for when email verification ships.
  // Public signup grants full access immediately without it.
  emailVerified: boolean("email_verified").notNull().default(false),
});

export const sessions = mysqlTable(
  "sessions",
  {
    id: uuidPk(),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    ip: text("ip"),
    userAgent: text("user_agent"),
  },
  (table) => [
    index("sessions_user_id_idx").on(table.userId),
    index("sessions_expires_at_idx").on(table.expiresAt),
  ]
);

// One file per slot, but a slot can need more than one rendition of that
// file (retina, a cropped mobile version) — `variants` holds those as
// { base, "2x"?, mobile? }, each { key, width, height, bytes, hash }. See
// server/mediaVariants.ts for how they're generated and
// server/mediaCatalog.ts for which slots need which variants.
export const media = mysqlTable("media", {
  id: uuidPk(),
  slot: varchar("slot", { length: 100 }).notNull().unique(), // 'hero-bg', 'card-sleep-quality', etc.
  variants: json("variants").notNull(),
  alt: text("alt").notNull().default(""),
  mimeType: varchar("mime_type", { length: 100 }),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: varchar("updated_by", { length: 36 }).references(() => users.id),
});

export const requests = mysqlTable(
  "requests",
  {
    id: uuidPk(),
    name: text("name").notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    goal: text("goal"),
    // From the /contact "What are you contacting us about?" select — nullable
    // since rows from before this field existed have no value.
    topic: varchar("topic", { length: 20 }), // 'general' | 'standard' | 'whitelabel' | 'partnership'
    message: text("message").notNull(),
    source: varchar("source", { length: 20 }).notNull().default("contact"), // 'contact' | 'partner' | 'newsletter'
    status: varchar("status", { length: 20 }).notNull().default("new"), // 'new' | 'contacted' | 'closed' | 'spam'
    notes: text("notes"),
    ip: text("ip"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    // drizzle-orm's mysql-core index builder doesn't support a per-column
    // DESC modifier the way pg-core does (IndexColumn is plain MySqlColumn |
    // SQL) — ascending composite index instead. InnoDB can still scan it
    // backwards for `ORDER BY created_at DESC` filtered by status, so this
    // isn't a real regression, just a narrower API.
    index("requests_status_created_at_idx").on(table.status, table.createdAt),
    index("requests_email_idx").on(table.email),
  ]
);

export const settings = mysqlTable("settings", {
  key: varchar("key", { length: 100 }).primaryKey(), // 'contact_email', 'newsletter_email', ...
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// A member's own data — deleting either of these (AccountPage's "delete
// history", or the whole account) is a real DELETE, never a soft flag, per
// the privacy commitment in /legal/privacy. onDelete: "cascade" on both FKs
// means deleting the user row alone is enough to remove every message.
export const conversations = mysqlTable(
  "conversations",
  {
    id: uuidPk(),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("conversations_user_id_idx").on(table.userId)]
);

export const messages = mysqlTable(
  "messages",
  {
    id: uuidPk(),
    conversationId: varchar("conversation_id", { length: 36 })
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 20 }).notNull(), // 'user' | 'assistant'
    content: text("content").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("messages_conversation_id_idx").on(table.conversationId)]
);

export const auditLog = mysqlTable("audit_log", {
  id: uuidPk(),
  userId: varchar("user_id", { length: 36 }).references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(), // 'media.replace', 'request.status', 'settings.update'
  entity: text("entity"),
  detail: json("detail"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
