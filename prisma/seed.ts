import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

try {
  process.loadEnvFile();
} catch {
  // .env not present
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

const CHART_OF_ACCOUNTS = [
  { code: "1000", name: "Cash", type: "ASSET" as const },
  { code: "1100", name: "Inventory Asset", type: "ASSET" as const },
  { code: "2000", name: "Accounts Payable", type: "LIABILITY" as const },
  { code: "3000", name: "Owner's Equity", type: "EQUITY" as const },
  { code: "4000", name: "Sales Revenue", type: "REVENUE" as const },
  { code: "5000", name: "Cost of Goods Sold", type: "EXPENSE" as const },
  { code: "5100", name: "Rent Expense", type: "EXPENSE" as const },
  { code: "5200", name: "Utilities Expense", type: "EXPENSE" as const },
  { code: "5300", name: "Salaries Expense", type: "EXPENSE" as const },
  { code: "5400", name: "Delivery Expense", type: "EXPENSE" as const },
  { code: "5900", name: "Miscellaneous Expense", type: "EXPENSE" as const },
];

const INGREDIENTS = [
  { key: "burger_bun", name: "Burger Bun", unit: "pcs", stockQty: 100, reorderLevel: 20, costPerUnit: 800 },
  { key: "beef_patty", name: "Beef Patty", unit: "pcs", stockQty: 100, reorderLevel: 20, costPerUnit: 3500 },
  { key: "cheese_slice", name: "Cheese Slice", unit: "pcs", stockQty: 100, reorderLevel: 20, costPerUnit: 500 },
  { key: "lettuce", name: "Lettuce", unit: "g", stockQty: 5000, reorderLevel: 500, costPerUnit: 5 },
  { key: "shomai_wrapper", name: "Shomai Wrapper", unit: "pcs", stockQty: 300, reorderLevel: 50, costPerUnit: 200 },
  { key: "pork_filling", name: "Pork Shomai Filling", unit: "g", stockQty: 5000, reorderLevel: 500, costPerUnit: 10 },
  { key: "shaved_ice", name: "Shaved Ice", unit: "g", stockQty: 20000, reorderLevel: 2000, costPerUnit: 1 },
  { key: "ube_halaya", name: "Ube Halaya", unit: "g", stockQty: 3000, reorderLevel: 300, costPerUnit: 8 },
  { key: "leche_flan", name: "Leche Flan", unit: "g", stockQty: 3000, reorderLevel: 300, costPerUnit: 12 },
  { key: "sweet_beans", name: "Sweet Beans Mix", unit: "g", stockQty: 3000, reorderLevel: 300, costPerUnit: 6 },
  { key: "evap_milk", name: "Evaporated Milk", unit: "ml", stockQty: 5000, reorderLevel: 500, costPerUnit: 3 },
  { key: "rice", name: "Steamed Rice", unit: "g", stockQty: 20000, reorderLevel: 2000, costPerUnit: 2 },
  { key: "fried_chicken", name: "Fried Chicken Piece", unit: "pcs", stockQty: 80, reorderLevel: 15, costPerUnit: 4500 },
  { key: "gravy", name: "Gravy", unit: "ml", stockQty: 5000, reorderLevel: 500, costPerUnit: 3 },
  { key: "milk_tea_base", name: "Milk Tea Base", unit: "ml", stockQty: 10000, reorderLevel: 1000, costPerUnit: 4 },
  { key: "tapioca_pearls", name: "Tapioca Pearls", unit: "g", stockQty: 5000, reorderLevel: 500, costPerUnit: 3 },
  { key: "calamansi_juice", name: "Calamansi Concentrate", unit: "ml", stockQty: 5000, reorderLevel: 500, costPerUnit: 5 },
  { key: "sugar_syrup", name: "Sugar Syrup", unit: "ml", stockQty: 5000, reorderLevel: 500, costPerUnit: 2 },
];

const PRODUCTS = [
  {
    slug: "classic-burger",
    name: "Classic Burger",
    category: "Burgers",
    description: "Beef patty, cheese, lettuce, and bun.",
    cost: 4000,
    price: 8900,
    imageUrl: "/brand/products/classic-burger.jpg",
    recipe: [
      { key: "burger_bun", qty: 1 },
      { key: "beef_patty", qty: 1 },
      { key: "cheese_slice", qty: 1 },
      { key: "lettuce", qty: 20 },
    ],
  },
  {
    slug: "double-cheeseburger",
    name: "Double Cheeseburger",
    category: "Burgers",
    description: "Two beef patties, double cheese, bun.",
    cost: 5800,
    price: 12900,
    imageUrl: "/brand/products/double-cheeseburger.jpg",
    recipe: [
      { key: "burger_bun", qty: 1 },
      { key: "beef_patty", qty: 2 },
      { key: "cheese_slice", qty: 2 },
      { key: "lettuce", qty: 20 },
    ],
  },
  {
    slug: "pork-shomai",
    name: "Pork Shomai (6pcs)",
    category: "Shomai",
    description: "Steamed pork shomai, 6 pieces per order.",
    cost: 2700,
    price: 6000,
    imageUrl: "/brand/products/pork-shomai.jpg",
    recipe: [
      { key: "shomai_wrapper", qty: 6 },
      { key: "pork_filling", qty: 180 },
    ],
  },
  {
    slug: "halo-halo-regular",
    name: "Halo-Halo Regular",
    category: "Halo-halo",
    description: "Shaved ice with ube, leche flan, sweet beans, and milk.",
    cost: 3200,
    price: 7500,
    imageUrl: "/brand/products/halo-halo-regular.jpg",
    recipe: [
      { key: "shaved_ice", qty: 250 },
      { key: "ube_halaya", qty: 40 },
      { key: "leche_flan", qty: 40 },
      { key: "sweet_beans", qty: 40 },
      { key: "evap_milk", qty: 60 },
    ],
  },
  {
    slug: "fried-chicken-rice-meal",
    name: "Fried Chicken Rice Meal",
    category: "Rice Meals",
    description: "Fried chicken with steamed rice and gravy.",
    cost: 4500,
    price: 9500,
    imageUrl: "/brand/products/fried-chicken-rice-meal.jpg",
    recipe: [
      { key: "rice", qty: 200 },
      { key: "fried_chicken", qty: 1 },
      { key: "gravy", qty: 50 },
    ],
  },
  {
    slug: "milk-tea-classic",
    name: "Milk Tea Classic",
    category: "Milk Tea",
    description: "Classic milk tea with tapioca pearls.",
    cost: 2600,
    price: 6500,
    imageUrl: "/brand/products/milk-tea-classic.jpg",
    recipe: [
      { key: "milk_tea_base", qty: 300 },
      { key: "tapioca_pearls", qty: 60 },
    ],
  },
  {
    slug: "calamansi-juice",
    name: "Fresh Calamansi Juice",
    category: "Juices",
    description: "Freshly squeezed calamansi juice, lightly sweetened.",
    cost: 1500,
    price: 4500,
    imageUrl: "/brand/products/calamansi-juice.jpg",
    recipe: [
      { key: "calamansi_juice", qty: 60 },
      { key: "sugar_syrup", qty: 30 },
    ],
  },
];

async function main() {
  const branch = await db.branch.upsert({
    where: { id: "main-branch" },
    update: {},
    create: {
      id: "main-branch",
      name: "Tasty Bites Snacks & Drinks",
      address: "Parañaque City, Metro Manila",
      phone: "0917-000-1234",
    },
  });

  const passwordHash = await bcrypt.hash("password123", 10);
  await db.user.upsert({
    where: { email: "owner@store.local" },
    update: {},
    create: {
      branchId: branch.id,
      name: "Owner Account",
      email: "owner@store.local",
      passwordHash,
      role: "OWNER_ADMIN",
    },
  });

  for (const account of CHART_OF_ACCOUNTS) {
    await db.chartOfAccount.upsert({
      where: { code: account.code },
      update: {},
      create: account,
    });
  }

  const categoryNames = Array.from(new Set(PRODUCTS.map((p) => p.category)));
  const categoryIds = new Map<string, string>();
  for (let i = 0; i < categoryNames.length; i++) {
    const name = categoryNames[i];
    const existing = await db.category.findFirst({ where: { branchId: branch.id, name } });
    const record =
      existing ??
      (await db.category.create({ data: { branchId: branch.id, name, sortOrder: i } }));
    categoryIds.set(name, record.id);
  }

  const ingredientIds = new Map<string, string>();
  for (const ing of INGREDIENTS) {
    const existing = await db.ingredient.findFirst({ where: { branchId: branch.id, name: ing.name } });
    const record =
      existing ??
      (await db.ingredient.create({
        data: {
          branchId: branch.id,
          name: ing.name,
          unit: ing.unit,
          stockQty: ing.stockQty,
          reorderLevel: ing.reorderLevel,
          costPerUnit: ing.costPerUnit,
        },
      }));
    ingredientIds.set(ing.key, record.id);
  }

  for (const product of PRODUCTS) {
    const record = await db.product.upsert({
      where: { slug: product.slug },
      update: { imageUrl: product.imageUrl },
      create: {
        branchId: branch.id,
        slug: product.slug,
        name: product.name,
        categoryId: categoryIds.get(product.category)!,
        description: product.description,
        cost: product.cost,
        price: product.price,
        imageUrl: product.imageUrl,
      },
    });

    for (const ri of product.recipe) {
      const ingredientId = ingredientIds.get(ri.key)!;
      await db.productIngredient.upsert({
        where: { productId_ingredientId: { productId: record.id, ingredientId } },
        update: { quantity: ri.qty },
        create: { productId: record.id, ingredientId, quantity: ri.qty },
      });
    }
  }

  console.log("Seed complete. Owner login: owner@store.local / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
