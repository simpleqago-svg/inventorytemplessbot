import {
  pgTable,
  serial,
  text,
  boolean,
  integer,
  real,
  timestamp,
  pgEnum,
  bigint,
} from "drizzle-orm/pg-core";

export const langEnum = pgEnum("lang", ["en", "sr"]);
export const measurementTypeEnum = pgEnum("measurement_type", [
  "numeric",
  "color",
  "both",
]);
export const sessionStatusEnum = pgEnum("session_status", [
  "in_progress",
  "completed",
]);
export const colorValueEnum = pgEnum("color_value", [
  "green",
  "yellow",
  "red",
]);

export const usersTable = pgTable("users", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  username: text("username"),
  lang: langEnum("lang").notNull().default("sr"),
  isAdmin: boolean("is_admin").notNull().default(false),
});

export const locationsTable = pgTable("locations", {
  id: serial("id").primaryKey(),
  nameEn: text("name_en").notNull(),
  nameSr: text("name_sr").notNull(),
});

export const categoriesTable = pgTable("categories", {
  id: serial("id").primaryKey(),
  nameEn: text("name_en").notNull(),
  nameSr: text("name_sr").notNull(),
});

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categoriesTable.id),
  nameEn: text("name_en").notNull(),
  nameSr: text("name_sr").notNull(),
  measurementType: measurementTypeEnum("measurement_type").notNull(),
  unit: text("unit"),
});

export const activeSessionsTable = pgTable("active_sessions", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number" })
    .notNull()
    .references(() => usersTable.id),
  locationId: integer("location_id")
    .notNull()
    .references(() => locationsTable.id),
  status: sessionStatusEnum("status").notNull().default("in_progress"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const inventoryRecordsTable = pgTable("inventory_records", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id")
    .notNull()
    .references(() => activeSessionsTable.id),
  productId: integer("product_id")
    .notNull()
    .references(() => productsTable.id),
  valNumeric: real("val_numeric"),
  valColor: colorValueEnum("val_color"),
});

export type User = typeof usersTable.$inferSelect;
export type Location = typeof locationsTable.$inferSelect;
export type Category = typeof categoriesTable.$inferSelect;
export type Product = typeof productsTable.$inferSelect;
export type ActiveSession = typeof activeSessionsTable.$inferSelect;
export type InventoryRecord = typeof inventoryRecordsTable.$inferSelect;
