import { db } from "@workspace/db";
import {
  locationsTable,
  categoriesTable,
  productsTable,
  activeSessionsTable,
  inventoryRecordsTable,
} from "@workspace/db";
import { eq, inArray } from "drizzle-orm";

async function dedupeLocations() {
  const rows = await db.select().from(locationsTable);
  const byName = new Map<string, typeof rows>();
  for (const r of rows) {
    const key = r.nameSr;
    const list = byName.get(key) ?? [];
    list.push(r);
    byName.set(key, list);
  }

  for (const [name, group] of byName) {
    if (group.length <= 1) continue;
    const sorted = [...group].sort((a, b) => a.id - b.id);
    const keep = sorted[0]!;
    const dupes = sorted.slice(1);
    const dupeIds = dupes.map((d) => d.id);

    await db
      .update(activeSessionsTable)
      .set({ locationId: keep.id })
      .where(inArray(activeSessionsTable.locationId, dupeIds));

    await db.delete(locationsTable).where(inArray(locationsTable.id, dupeIds));
    console.log(`  🧹 Location "${name}": kept id=${keep.id}, removed ${dupeIds.length} duplicate(s)`);
  }
}

async function dedupeCategories() {
  const rows = await db.select().from(categoriesTable);
  const byName = new Map<string, typeof rows>();
  for (const r of rows) {
    const key = r.nameSr;
    const list = byName.get(key) ?? [];
    list.push(r);
    byName.set(key, list);
  }

  for (const [name, group] of byName) {
    if (group.length <= 1) continue;
    const sorted = [...group].sort((a, b) => a.id - b.id);
    const keep = sorted[0]!;
    const dupes = sorted.slice(1);
    const dupeIds = dupes.map((d) => d.id);

    // Repoint products from duplicate categories to the kept category.
    await db
      .update(productsTable)
      .set({ categoryId: keep.id })
      .where(inArray(productsTable.categoryId, dupeIds));

    await db.delete(categoriesTable).where(inArray(categoriesTable.id, dupeIds));
    console.log(`  🧹 Category "${name}": kept id=${keep.id}, removed ${dupeIds.length} duplicate(s)`);
  }
}

async function dedupeProducts() {
  const rows = await db.select().from(productsTable);
  const byKey = new Map<string, typeof rows>();
  for (const r of rows) {
    const key = `${r.categoryId}::${r.nameSr}`;
    const list = byKey.get(key) ?? [];
    list.push(r);
    byKey.set(key, list);
  }

  for (const [key, group] of byKey) {
    if (group.length <= 1) continue;
    const sorted = [...group].sort((a, b) => a.id - b.id);
    const keep = sorted[0]!;
    const dupes = sorted.slice(1);
    const dupeIds = dupes.map((d) => d.id);

    await db
      .update(inventoryRecordsTable)
      .set({ productId: keep.id })
      .where(inArray(inventoryRecordsTable.productId, dupeIds));

    await db.delete(productsTable).where(inArray(productsTable.id, dupeIds));
    console.log(`  🧹 Product "${key}": kept id=${keep.id}, removed ${dupeIds.length} duplicate(s)`);
  }
}

async function dedupe() {
  console.log("🧹 Deduplicating database...");
  await dedupeLocations();
  await dedupeCategories();
  await dedupeProducts();
  console.log("✅ Dedupe complete.");
  process.exit(0);
}

dedupe().catch((err) => {
  console.error("Dedupe failed:", err);
  process.exit(1);
});
