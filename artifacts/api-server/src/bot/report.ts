import { db } from "@workspace/db";
import {
  categoriesTable,
  productsTable,
  inventoryRecordsTable,
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

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function buildReportText(
  sessionId: number,
  username: string,
  locationName: string,
  lang: Lang
): Promise<string> {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  const date = `${dd}.${mm}.${yyyy}`;

  const title = lang === "sr" ? "Izveštaj o inventaru" : "Inventory Report";
  const header = `📋 <b>${esc(title)}</b>\n👤 ${esc(username)}\n📍 ${esc(locationName)}\n📅 ${date}`;

  const records = await db
    .select()
    .from(inventoryRecordsTable)
    .where(eq(inventoryRecordsTable.sessionId, sessionId));

  if (records.length === 0) {
    const empty = lang === "sr" ? "Nema unetih stavki." : "No items recorded yet.";
    return `${header}\n\n<i>${esc(empty)}</i>`;
  }

  const productIds = [...new Set(records.map((r) => r.productId))];
  const allProducts: Product[] = [];
  for (const pid of productIds) {
    const rows = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, pid))
      .limit(1);
    if (rows[0]) allProducts.push(rows[0]);
  }

  const categoryIds = [...new Set(allProducts.map((p) => p.categoryId))];
  const categories: Category[] = [];
  for (const cid of categoryIds) {
    const rows = await db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, cid))
      .limit(1);
    if (rows[0]) categories.push(rows[0]);
  }

  const recordMap = new Map(records.map((r) => [r.productId, r]));

  const sections: string[] = [];
  for (const cat of categories) {
    const catProducts = allProducts.filter((p) => p.categoryId === cat.id);
    const lines: string[] = [];
    for (const prod of catProducts) {
      const rec = recordMap.get(prod.id);
      if (!rec) continue;
      const name = esc(lang === "sr" ? prod.nameSr : prod.nameEn);
      let value = "";
      if (prod.measurementType === "numeric") {
        value = `${rec.valNumeric ?? "—"} ${esc(prod.unit ?? "")}`.trim();
      } else if (prod.measurementType === "color") {
        value = rec.valColor ? (COLOR_EMOJI[rec.valColor] ?? "—") : "—";
      } else {
        const num = rec.valNumeric !== null ? `${rec.valNumeric} ${esc(prod.unit ?? "")}`.trim() : "—";
        const col = rec.valColor ? (COLOR_EMOJI[rec.valColor] ?? "—") : "—";
        value = `${num} ${col}`;
      }
      lines.push(`  • ${name}: ${value}`);
    }
    if (lines.length > 0) {
      const catName = esc(lang === "sr" ? cat.nameSr : cat.nameEn);
      sections.push(`<b>${catName}</b>\n${lines.join("\n")}`);
    }
  }

  const hashtag = `#report_${dd}_${mm}_${yyyy}`;
  return `${header}\n\n${sections.join("\n\n")}\n\n${hashtag}`;
}
