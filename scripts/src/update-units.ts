import { pool } from "@workspace/db";

const unitMap: Record<string, string> = {
  "Coffee": "g",
  "Matcha": "g",
  "Fruits": "g",
  "Ingredients": "g",
  "Teas": "kut",
  "Purees & Syrups": "ml",
  "Paper Products": "pak",
  "Receipt Rolls": "kom",
  "To Go": "kom",
  "Merch": "kom",
};

async function updateUnits() {
  console.log("🔄 Updating product units...");

  const { rows: categories } = await pool.query<{ id: number; name_en: string }>(
    "SELECT id, name_en FROM categories"
  );

  let updated = 0;

  for (const cat of categories) {
    const newUnit = unitMap[cat.name_en];
    if (!newUnit) {
      console.log(`  ⏭  ${cat.name_en} — no unit change (color-only or not in map)`);
      continue;
    }

    const { rowCount } = await pool.query(
      "UPDATE products SET unit = $1 WHERE category_id = $2",
      [newUnit, cat.id]
    );

    console.log(`  ✅ ${cat.name_en}: ${rowCount} products → ${newUnit}`);
    updated += rowCount ?? 0;
  }

  console.log(`\n✅ Done. Updated ${updated} products.`);
  await pool.end();
  process.exit(0);
}

updateUnits().catch((err) => {
  console.error("Update failed:", err);
  process.exit(1);
});
