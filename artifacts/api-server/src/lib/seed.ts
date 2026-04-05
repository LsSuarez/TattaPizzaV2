import { db, menuItemsTable } from "@workspace/db";
import { count } from "drizzle-orm";
import { logger } from "./logger";

const menuSeed = [
  { name: "Margarita", category: "pizza", description: "Salsa de tomate, mozzarella", priceSmall: 2500, priceMedium: 3500, priceLarge: 4500, available: true },
  { name: "Pepperoni", category: "pizza", description: "Salsa de tomate, mozzarella, pepperoni", priceSmall: 2800, priceMedium: 3800, priceLarge: 4800, available: true },
  { name: "Hawaiana", category: "pizza", description: "Salsa de tomate, mozzarella, jamón, piña", priceSmall: 2800, priceMedium: 3800, priceLarge: 4800, available: true },
  { name: "Quattro Formaggi", category: "pizza", description: "Cuatro quesos: mozzarella, gouda, parmesano, ricotta", priceSmall: 3200, priceMedium: 4200, priceLarge: 5200, available: true },
  { name: "Especial Tata", category: "pizza", description: "Salsa BBQ, pollo, champiñones, pimiento, aceitunas", priceSmall: 3500, priceMedium: 4500, priceLarge: 5500, available: true },
  { name: "Napolitana", category: "pizza", description: "Salsa de tomate, mozzarella, anchoas, aceitunas", priceSmall: 2800, priceMedium: 3800, priceLarge: 4800, available: true },
  { name: "Pollo BBQ", category: "pizza", description: "Salsa BBQ, pollo grillado, cebolla, mozzarella", priceSmall: 3000, priceMedium: 4000, priceLarge: 5000, available: true },
  { name: "Vegetariana", category: "pizza", description: "Salsa de tomate, mozzarella, pimiento, champiñones, aceitunas, cebolla", priceSmall: 2800, priceMedium: 3800, priceLarge: 4800, available: true },
  { name: "Coca-Cola 600ml", category: "bebida", description: "Coca-Cola personal", priceSmall: 400, priceMedium: null, priceLarge: null, available: true },
  { name: "Inca Kola 600ml", category: "bebida", description: "Inca Kola personal", priceSmall: 400, priceMedium: null, priceLarge: null, available: true },
  { name: "Agua sin gas", category: "bebida", description: "Agua mineral 500ml", priceSmall: 200, priceMedium: null, priceLarge: null, available: true },
];

export async function seedMenuIfEmpty() {
  const [{ count: existing }] = await db.select({ count: count() }).from(menuItemsTable);
  if (existing > 0) {
    logger.info({ existing }, "Menu already seeded, skipping");
    return;
  }
  await db.insert(menuItemsTable).values(menuSeed);
  logger.info({ count: menuSeed.length }, "Menu seeded successfully");
}
