import { db } from "@workspace/db";
import {
  locationsTable,
  categoriesTable,
  productsTable,
} from "@workspace/db";

const locations = [
  { nameEn: "Vračar", nameSr: "Vračar" },
];

type MeasurementType = "numeric" | "color" | "both";

interface SeedCategory {
  nameEn: string;
  nameSr: string;
  type: MeasurementType;
  unit?: string;
  products: string[];
}

const seedData: SeedCategory[] = [
  {
    nameEn: "Bottled drinks",
    nameSr: "Flasirana pica",
    type: "color",
    products: [
      "Aloe", "Sveps", "Vino belo", "Vino crveno", "Coca cola", "Coca cola zero",
      "Kombuha Natural", "Kombuha Cherry", "Kombuha Zova", "Tonic three cents",
      "Rosa", "Knjaz milos", "Granini jabuka", "Granini jagoda", "Granini narandza",
      "Granini Peach", "Ledeni caj Lavanada", "Ledeni caj Slipak",
      "SP Aranciata 0,2", "SP Aranciata 0,33", "SP Aranciata",
      "SP Aranciata Rossa Zero 330ml", "SP gazirana voda 0,25",
      "SP Limonata 0,33", "SP Limonata Zero 0,33", "SP Limun Menta 350ml",
      "SP Melograno Arancia 0,33", "SP Oak Tonic 200ml", "SP Tonic Citrus 0,2",
    ],
  },
  {
    nameEn: "Milk",
    nameSr: "Mleko",
    type: "color",
    products: [
      "Obicno mleko", "Ovseno mleko", "Kokos mleko", "Vanila mleko", "Pavlaka za kuvanje",
    ],
  },
  {
    nameEn: "Coffee",
    nameSr: "Kafa",
    type: "numeric",
    unit: "pcs",
    products: [
      "Brazil 200gr", "Kenya 200gr", "Costa Rica 200gr", "Brazil", "Decaf",
      "Costa Rica", "Kenya",
    ],
  },
  {
    nameEn: "Paper goods",
    nameSr: "Papirna galanterija",
    type: "numeric",
    unit: "pcs",
    products: ["Vc papir", "Ubrusi", "Salvete"],
  },
  {
    nameEn: "Receipt rolls",
    nameSr: "Rolne za racune",
    type: "numeric",
    unit: "pcs",
    products: ["Papir za Terminal", "Papir za Kasu"],
  },
  {
    nameEn: "Cleaning supplies",
    nameSr: "Hemija i potrosni materijal",
    type: "color",
    products: [
      "Kese za smece velike", "Kese za smece male", "Detardzent za sudove",
      "Sapun za ruke", "Sapun za ruke za goste", "Sredstvo za pranje podova",
      "Sredstvo za stakla", "Rukavice", "Krema za ruke", "Krpe za poliranje",
    ],
  },
  {
    nameEn: "To go",
    nameSr: "To go",
    type: "numeric",
    unit: "pcs",
    products: [
      "Case L", "Case M", "Case S", "Plasticne case L", "Plasticne case S",
      "Poklopac za papirne case L", "Poklopac za papirne case M",
      "Poklopac za papirne case S", "Poklopac za plasticne case",
      "To go kutije", "To go poklopci", "Nosaci za case", "Slamcice",
      "Drvene Kasike", "Drvene Viljuske",
    ],
  },
  {
    nameEn: "Teas",
    nameSr: "Cajevi",
    type: "numeric",
    unit: "pcs",
    products: [
      "Crni caj", "Rooibos", "Earl grey", "Zeleni caj", "Bai mu dan",
      "Fruit mix", "Jasmin", "Oolong", "Rice Pu erh", "Yoga", "Yunnan",
    ],
  },
  {
    nameEn: "Matcha",
    nameSr: "Matcha",
    type: "numeric",
    unit: "pcs",
    products: ["Matcha", "Plava matcha"],
  },
  {
    nameEn: "Fruit",
    nameSr: "Voce",
    type: "numeric",
    unit: "kg",
    products: ["Narandze", "Lime"],
  },
  {
    nameEn: "Ingredients",
    nameSr: "Sastojci",
    type: "numeric",
    unit: "pcs",
    products: [
      "Kakao", "Cimet", "Cili", "Vanila secer", "Beli secer", "Secer za goste",
      "Cokolada", "Sladoled", "So", "Acid", "Smrznute jagode", "Sumsko voce", "Lesnik",
    ],
  },
  {
    nameEn: "Purees and syrups",
    nameSr: "Pire i sirupi",
    type: "numeric",
    unit: "pcs",
    products: [
      "Pire banana", "Pire borovnica", "Pire breskva", "Pire jagoda",
      "Pire Mango", "Pire Ananas", "Sirup Estragon", "Sirup Ruza",
      "Sirup Orhideja", "Sirup javor", "Sirup vanila", "Sirup jagoda",
      "Sirup Lesnik", "Sirup karamela", "Sirup cokolada", "Sirup bela cokolada",
      "Sirup pistaci", "Sirup kokos", "Sirup visnja", "Sirup zova", "Sirup Nana",
    ],
  },
  {
    nameEn: "Merch",
    nameSr: "Merch",
    type: "numeric",
    unit: "pcs",
    products: [
      "Plava majica", "Bela majica", "V60 filteri", "AeroPress filteri",
      "Aeropress maker", "Origami dripper", "V60 set", "Hairo coffee Bottle",
      "Stenli", "Termos veliki", "Termos mali", "Bez solja", "Plava solja",
      "Plava solja sa kaisem", "Longsleeve", "Duks",
    ],
  },
];

async function seed() {
  console.log("🌱 Seeding database...");

  // Locations
  for (const loc of locations) {
    await db.insert(locationsTable).values(loc).onConflictDoNothing();
  }
  console.log(`✅ Locations: ${locations.length}`);

  // Categories + Products
  let totalProducts = 0;
  for (const cat of seedData) {
    const [inserted] = await db
      .insert(categoriesTable)
      .values({ nameEn: cat.nameEn, nameSr: cat.nameSr })
      .onConflictDoNothing()
      .returning();

    if (!inserted) {
      console.log(`  ⚠️  Category "${cat.nameSr}" already exists, skipping`);
      continue;
    }

    for (const productName of cat.products) {
      await db
        .insert(productsTable)
        .values({
          categoryId: inserted.id,
          nameEn: productName,
          nameSr: productName,
          measurementType: cat.type,
          unit: cat.unit ?? null,
        })
        .onConflictDoNothing();
    }
    totalProducts += cat.products.length;
    console.log(`  ✅ ${cat.nameSr}: ${cat.products.length} products`);
  }

  console.log(`\n✅ Seed complete. ${seedData.length} categories, ${totalProducts} products.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
