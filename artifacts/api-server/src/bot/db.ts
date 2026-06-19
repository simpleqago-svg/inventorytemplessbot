import { eq, and } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  usersTable,
  locationsTable,
  categoriesTable,
  productsTable,
  activeSessionsTable,
  inventoryRecordsTable,
  type User,
  type Location,
  type Category,
  type Product,
  type ActiveSession,
  type InventoryRecord,
} from "@workspace/db";

export async function upsertUser(
  id: number,
  username: string | undefined
): Promise<User> {
  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, id))
    .limit(1);
  if (existing[0]) return existing[0];
  const [user] = await db
    .insert(usersTable)
    .values({ id, username: username ?? null })
    .returning();
  return user!;
}

export async function setUserLang(
  userId: number,
  lang: "en" | "sr"
): Promise<void> {
  await db
    .update(usersTable)
    .set({ lang })
    .where(eq(usersTable.id, userId));
}

export async function getUser(userId: number): Promise<User | undefined> {
  const rows = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);
  return rows[0];
}

export async function getLocations(): Promise<Location[]> {
  return db.select().from(locationsTable);
}

export async function getCategories(): Promise<Category[]> {
  return db.select().from(categoriesTable);
}

export async function getProductsByCategory(
  categoryId: number
): Promise<Product[]> {
  return db
    .select()
    .from(productsTable)
    .where(eq(productsTable.categoryId, categoryId));
}

export async function getProduct(
  productId: number
): Promise<Product | undefined> {
  const rows = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, productId))
    .limit(1);
  return rows[0];
}

export async function getOrCreateSession(
  userId: number,
  locationId: number
): Promise<ActiveSession> {
  const existing = await db
    .select()
    .from(activeSessionsTable)
    .where(
      and(
        eq(activeSessionsTable.userId, userId),
        eq(activeSessionsTable.locationId, locationId),
        eq(activeSessionsTable.status, "in_progress")
      )
    )
    .limit(1);
  if (existing[0]) return existing[0];
  const [session] = await db
    .insert(activeSessionsTable)
    .values({ userId, locationId })
    .returning();
  return session!;
}

export async function getSession(
  userId: number,
  locationId: number
): Promise<ActiveSession | undefined> {
  const rows = await db
    .select()
    .from(activeSessionsTable)
    .where(
      and(
        eq(activeSessionsTable.userId, userId),
        eq(activeSessionsTable.locationId, locationId),
        eq(activeSessionsTable.status, "in_progress")
      )
    )
    .limit(1);
  return rows[0];
}

export async function upsertRecord(
  sessionId: number,
  productId: number,
  valNumeric: number | null,
  valColor: "green" | "yellow" | "red" | null
): Promise<void> {
  const existing = await db
    .select()
    .from(inventoryRecordsTable)
    .where(
      and(
        eq(inventoryRecordsTable.sessionId, sessionId),
        eq(inventoryRecordsTable.productId, productId)
      )
    )
    .limit(1);
  if (existing[0]) {
    await db
      .update(inventoryRecordsTable)
      .set({ valNumeric, valColor })
      .where(eq(inventoryRecordsTable.id, existing[0].id));
  } else {
    await db
      .insert(inventoryRecordsTable)
      .values({ sessionId, productId, valNumeric, valColor });
  }
}

export async function getSessionRecords(
  sessionId: number
): Promise<InventoryRecord[]> {
  return db
    .select()
    .from(inventoryRecordsTable)
    .where(eq(inventoryRecordsTable.sessionId, sessionId));
}

export async function getFilledProductIds(
  sessionId: number
): Promise<Set<number>> {
  const records = await getSessionRecords(sessionId);
  return new Set(records.map((r) => r.productId));
}

export async function resetSession(sessionId: number): Promise<void> {
  await db
    .delete(inventoryRecordsTable)
    .where(eq(inventoryRecordsTable.sessionId, sessionId));
}

export async function closeSession(sessionId: number): Promise<void> {
  await db
    .update(activeSessionsTable)
    .set({ status: "completed", updatedAt: new Date() })
    .where(eq(activeSessionsTable.id, sessionId));
}

export async function addCategory(
  nameEn: string,
  nameSr: string
): Promise<Category> {
  const [cat] = await db
    .insert(categoriesTable)
    .values({ nameEn, nameSr })
    .returning();
  return cat!;
}

export async function addProduct(
  categoryId: number,
  nameEn: string,
  nameSr: string,
  measurementType: "numeric" | "color" | "both",
  unit: string | null
): Promise<Product> {
  const [prod] = await db
    .insert(productsTable)
    .values({ categoryId, nameEn, nameSr, measurementType, unit })
    .returning();
  return prod!;
}

export async function getLocationById(
  id: number
): Promise<Location | undefined> {
  const rows = await db
    .select()
    .from(locationsTable)
    .where(eq(locationsTable.id, id))
    .limit(1);
  return rows[0];
}
