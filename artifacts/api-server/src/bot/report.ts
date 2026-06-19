import { db } from "@workspace/db";
import {
  categoriesTable,
  productsTable,
  inventoryRecordsTable,
  type InventoryRecord,
  type Product,
  type Category,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import { Lang } from "./i18n.js";

const COLOR_EMOJI: Record<string, string> = {
  green: "🟢",
  yellow: "🟡",
  red: "🔴",
};

export async function buildReportText(
  sessionId: number,
  username: string,
  locationName: string,
  lang: Lang
): Promise<string> {
  const now = new Date();
  const date = `${String(now.getDate()).padStart(2, "0")}.${String(now.getMonth() + 1).padStart(2, "0")}.${now.getFullYear()}`;

  const header =
    lang === "sr"
      ? `📋 *Izveštaj o inventaru*\n👤 ${username}\n📍 ${locationName}\n📅 ${date}`
      : `📋 *Inventory Report*\n👤 ${username}\n📍 ${locationName}\n📅 ${date}`;

  const records = await db
    .select()
    .from(inventoryRecordsTable)
    .where(eq(inventoryRecordsTable.sessionId, sessionId));

  if (records.length === 0) {
    return `${header}\n\n_${lang === "sr" ? "Nema unetih stavki." : "No items recorded yet."}_`;
  }

  const productIds = [...new Set(records.map((r) => r.productId))];
  const products = await db
    .select()
    .from(productsTable)
    .where(
      productIds.length === 1
        ? eq(productsTable.id, productIds[0]!)
        : // multiple — fetch all and filter in memory
          eq(productsTable.id, productIds[0]!)
    );

  // Fetch all products for the session
  const allProducts: Product[] = [];
  for (const pid of productIds) {
    const rows = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, pid))
      .limit(1);
    if (rows[0]) allProducts.push(rows[0]);
  }

  const productMap = new Map<number, Product>(
    allProducts.map((p) => [p.id, p])
  );

  // Group by category
  const categoryIds = [
    ...new Set(allProducts.map((p) => p.categoryId)),
  ];
  const categories: Category[] = [];
  for (const cid of categoryIds) {
    const rows = await db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, cid))
      .limit(1);
    if (rows[0]) categories.push(rows[0]);
  }

  const recordMap = new Map<number, InventoryRecord>(
    records.map((r) => [r.productId, r])
  );

  const sections: string[] = [];
  for (const cat of categories) {
    const catProducts = allProducts.filter((p) => p.categoryId === cat.id);
    const lines: string[] = [];
    for (const prod of catProducts) {
      const rec = recordMap.get(prod.id);
      if (!rec) continue;
      const name = lang === "sr" ? prod.nameSr : prod.nameEn;
      let value = "";
      if (prod.measurementType === "numeric") {
        value = `${rec.valNumeric ?? "—"} ${prod.unit ?? ""}`.trim();
      } else if (prod.measurementType === "color") {
        value = rec.valColor ? COLOR_EMOJI[rec.valColor] ?? "—" : "—";
      } else {
        const num = rec.valNumeric !== null ? `${rec.valNumeric} ${prod.unit ?? ""}`.trim() : "—";
        const col = rec.valColor ? COLOR_EMOJI[rec.valColor] ?? "—" : "—";
        value = `${num} ${col}`;
      }
      lines.push(`  • ${name}: ${value}`);
    }
    if (lines.length > 0) {
      const catName = lang === "sr" ? cat.nameSr : cat.nameEn;
      sections.push(`*${catName}*\n${lines.join("\n")}`);
    }
  }

  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  const hashtag = `#report_${dd}_${mm}_${yyyy}`;

  return `${header}\n\n${sections.join("\n\n")}\n\n${hashtag}`;
}
