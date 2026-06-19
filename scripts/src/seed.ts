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
  products: { en: string; sr: string }[];
}

const seedData: SeedCategory[] = [
  {
    nameEn: "Bottled Drinks",
    nameSr: "Flasirana pica",
    type: "color",
    products: [
      { en: "Aloe", sr: "Aloe" },
      { en: "Schweppes", sr: "Sveps" },
      { en: "White Wine", sr: "Vino belo" },
      { en: "Red Wine", sr: "Vino crveno" },
      { en: "Coca Cola", sr: "Coca cola" },
      { en: "Coca Cola Zero", sr: "Coca cola zero" },
      { en: "Kombucha Natural", sr: "Kombuha Natural" },
      { en: "Kombucha Cherry", sr: "Kombuha Cherry" },
      { en: "Kombucha Elderflower", sr: "Kombuha Zova" },
      { en: "Three Cents Tonic", sr: "Tonic three cents" },
      { en: "Rosa Water", sr: "Rosa" },
      { en: "Knjaz Milos Water", sr: "Knjaz milos" },
      { en: "Granini Apple", sr: "Granini jabuka" },
      { en: "Granini Strawberry", sr: "Granini jagoda" },
      { en: "Granini Orange", sr: "Granini narandza" },
      { en: "Granini Peach", sr: "Granini Peach" },
      { en: "Lavender Iced Tea", sr: "Ledeni caj Lavanada" },
      { en: "Rosehip Iced Tea", sr: "Ledeni caj Slipak" },
      { en: "SP Aranciata 0.2", sr: "SP Aranciata 0,2" },
      { en: "SP Aranciata 0.33", sr: "SP Aranciata 0,33" },
      { en: "SP Aranciata", sr: "SP Aranciata" },
      { en: "SP Aranciata Rossa Zero 330ml", sr: "SP Aranciata Rossa Zero 330ml" },
      { en: "SP Sparkling Water 0.25", sr: "SP gazirana voda 0,25" },
      { en: "SP Limonata 0.33", sr: "SP Limonata 0,33" },
      { en: "SP Limonata Zero 0.33", sr: "SP Limonata Zero 0,33" },
      { en: "SP Lemon Mint 350ml", sr: "SP Limun Menta 350ml" },
      { en: "SP Melograno Arancia 0.33", sr: "SP Melograno Arancia 0,33" },
      { en: "SP Oak Tonic 200ml", sr: "SP Oak Tonic 200ml" },
      { en: "SP Tonic Citrus 0.2", sr: "SP Tonic Citrus 0,2" },
    ],
  },
  {
    nameEn: "Milk",
    nameSr: "Mleko",
    type: "color",
    products: [
      { en: "Regular Milk", sr: "Obicno mleko" },
      { en: "Oat Milk", sr: "Ovseno mleko" },
      { en: "Coconut Milk", sr: "Kokos mleko" },
      { en: "Vanilla Milk", sr: "Vanila mleko" },
      { en: "Cooking Cream", sr: "Pavlaka za kuvanje" },
    ],
  },
  {
    nameEn: "Coffee",
    nameSr: "Kafa",
    type: "numeric",
    unit: "pcs",
    products: [
      { en: "Brazil 200g", sr: "Brazil 200gr" },
      { en: "Kenya 200g", sr: "Kenya 200gr" },
      { en: "Costa Rica 200g", sr: "Costa Rica 200gr" },
      { en: "Brazil", sr: "Brazil" },
      { en: "Decaf", sr: "Decaf" },
      { en: "Costa Rica", sr: "Costa Rica" },
      { en: "Kenya", sr: "Kenya" },
    ],
  },
  {
    nameEn: "Paper Products",
    nameSr: "Papirna galanterija",
    type: "numeric",
    unit: "pcs",
    products: [
      { en: "Toilet Paper", sr: "Vc papir" },
      { en: "Paper Towels", sr: "Ubrusi" },
      { en: "Napkins", sr: "Salvete" },
    ],
  },
  {
    nameEn: "Receipt Rolls",
    nameSr: "Rolne za racune",
    type: "numeric",
    unit: "pcs",
    products: [
      { en: "Terminal Receipt Paper", sr: "Papir za Terminal" },
      { en: "POS Receipt Paper", sr: "Papir za Kasu" },
    ],
  },
  {
    nameEn: "Chemicals & Supplies",
    nameSr: "Hemija i potrosni materijal",
    type: "color",
    products: [
      { en: "Large Trash Bags", sr: "Kese za smece velike" },
      { en: "Small Trash Bags", sr: "Kese za smece male" },
      { en: "Dish Soap", sr: "Detardzent za sudove" },
      { en: "Hand Soap", sr: "Sapun za ruke" },
      { en: "Guest Hand Soap", sr: "Sapun za ruke za goste" },
      { en: "Floor Cleaner", sr: "Sredstvo za pranje podova" },
      { en: "Glass Cleaner", sr: "Sredstvo za stakla" },
      { en: "Gloves", sr: "Rukavice" },
      { en: "Hand Cream", sr: "Krema za ruke" },
      { en: "Polishing Cloths", sr: "Krpe za poliranje" },
    ],
  },
  {
    nameEn: "To Go",
    nameSr: "To go",
    type: "numeric",
    unit: "pcs",
    products: [
      { en: "Paper Cups L", sr: "Case L" },
      { en: "Paper Cups M", sr: "Case M" },
      { en: "Paper Cups S", sr: "Case S" },
      { en: "Plastic Cups L", sr: "Plasticne case L" },
      { en: "Plastic Cups S", sr: "Plasticne case S" },
      { en: "Lids for Paper Cups L", sr: "Poklopac za papirne case L" },
      { en: "Lids for Paper Cups M", sr: "Poklopac za papirne case M" },
      { en: "Lids for Paper Cups S", sr: "Poklopac za papirne case S" },
      { en: "Lids for Plastic Cups", sr: "Poklopac za plasticne case" },
      { en: "To Go Boxes", sr: "To go kutije" },
      { en: "To Go Lids", sr: "To go poklopci" },
      { en: "Cup Holders", sr: "Nosaci za case" },
      { en: "Straws", sr: "Slamcice" },
      { en: "Wooden Spoons", sr: "Drvene Kasike" },
      { en: "Wooden Forks", sr: "Drvene Viljuske" },
    ],
  },
  {
    nameEn: "Teas",
    nameSr: "Cajevi",
    type: "numeric",
    unit: "pcs",
    products: [
      { en: "Black Tea", sr: "Crni caj" },
      { en: "Rooibos", sr: "Rooibos" },
      { en: "Earl Grey", sr: "Earl grey" },
      { en: "Green Tea", sr: "Zeleni caj" },
      { en: "Bai Mu Dan", sr: "Bai mu dan" },
      { en: "Fruit Mix", sr: "Fruit mix" },
      { en: "Jasmine", sr: "Jasmin" },
      { en: "Oolong", sr: "Oolong" },
      { en: "Rice Pu-erh", sr: "Rice Pu erh" },
      { en: "Yoga", sr: "Yoga" },
      { en: "Yunnan", sr: "Yunnan" },
    ],
  },
  {
    nameEn: "Matcha",
    nameSr: "Matcha",
    type: "numeric",
    unit: "pcs",
    products: [
      { en: "Matcha", sr: "Matcha" },
      { en: "Blue Matcha", sr: "Plava matcha" },
    ],
  },
  {
    nameEn: "Fruits",
    nameSr: "Voce",
    type: "numeric",
    unit: "kg",
    products: [
      { en: "Oranges", sr: "Narandze" },
      { en: "Lime", sr: "Lime" },
    ],
  },
  {
    nameEn: "Ingredients",
    nameSr: "Sastojci",
    type: "numeric",
    unit: "pcs",
    products: [
      { en: "Cocoa", sr: "Kakao" },
      { en: "Cinnamon", sr: "Cimet" },
      { en: "Chili", sr: "Cili" },
      { en: "Vanilla Sugar", sr: "Vanila secer" },
      { en: "White Sugar", sr: "Beli secer" },
      { en: "Guest Sugar", sr: "Secer za goste" },
      { en: "Chocolate", sr: "Cokolada" },
      { en: "Ice Cream", sr: "Sladoled" },
      { en: "Salt", sr: "So" },
      { en: "Acid", sr: "Acid" },
      { en: "Frozen Strawberries", sr: "Smrznute jagode" },
      { en: "Mixed Berries", sr: "Sumsko voce" },
      { en: "Hazelnut", sr: "Lesnik" },
    ],
  },
  {
    nameEn: "Purees & Syrups",
    nameSr: "Pire i sirupi",
    type: "numeric",
    unit: "pcs",
    products: [
      { en: "Banana Puree", sr: "Pire banana" },
      { en: "Blueberry Puree", sr: "Pire borovnica" },
      { en: "Peach Puree", sr: "Pire breskva" },
      { en: "Strawberry Puree", sr: "Pire jagoda" },
      { en: "Mango Puree", sr: "Pire Mango" },
      { en: "Pineapple Puree", sr: "Pire Ananas" },
      { en: "Tarragon Syrup", sr: "Sirup Estragon" },
      { en: "Rose Syrup", sr: "Sirup Ruza" },
      { en: "Orchid Syrup", sr: "Sirup Orhideja" },
      { en: "Maple Syrup", sr: "Sirup javor" },
      { en: "Vanilla Syrup", sr: "Sirup vanila" },
      { en: "Strawberry Syrup", sr: "Sirup jagoda" },
      { en: "Hazelnut Syrup", sr: "Sirup Lesnik" },
      { en: "Caramel Syrup", sr: "Sirup karamela" },
      { en: "Chocolate Syrup", sr: "Sirup cokolada" },
      { en: "White Chocolate Syrup", sr: "Sirup bela cokolada" },
      { en: "Pistachio Syrup", sr: "Sirup pistaci" },
      { en: "Coconut Syrup", sr: "Sirup kokos" },
      { en: "Cherry Syrup", sr: "Sirup visnja" },
      { en: "Elderflower Syrup", sr: "Sirup zova" },
      { en: "Mint Syrup", sr: "Sirup Nana" },
    ],
  },
  {
    nameEn: "Merch",
    nameSr: "Merch",
    type: "numeric",
    unit: "pcs",
    products: [
      { en: "Blue T-Shirt", sr: "Plava majica" },
      { en: "White T-Shirt", sr: "Bela majica" },
      { en: "V60 Filters", sr: "V60 filteri" },
      { en: "AeroPress Filters", sr: "AeroPress filteri" },
      { en: "AeroPress Maker", sr: "Aeropress maker" },
      { en: "Origami Dripper", sr: "Origami dripper" },
      { en: "V60 Set", sr: "V60 set" },
      { en: "Hario Coffee Bottle", sr: "Hairo coffee Bottle" },
      { en: "Stanley", sr: "Stenli" },
      { en: "Large Thermos", sr: "Termos veliki" },
      { en: "Small Thermos", sr: "Termos mali" },
      { en: "Beige Mug", sr: "Bez solja" },
      { en: "Blue Mug", sr: "Plava solja" },
      { en: "Blue Mug with Strap", sr: "Plava solja sa kaisem" },
      { en: "Longsleeve", sr: "Longsleeve" },
      { en: "Hoodie", sr: "Duks" },
    ],
  },
];

async function seed() {
  console.log("🌱 Seeding database...");

  for (const loc of locations) {
    await db.insert(locationsTable).values(loc).onConflictDoNothing();
  }
  console.log(`✅ Locations: ${locations.length}`);

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

    for (const p of cat.products) {
      await db
        .insert(productsTable)
        .values({
          categoryId: inserted.id,
          nameEn: p.en,
          nameSr: p.sr,
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
