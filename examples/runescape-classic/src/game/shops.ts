/** The free-to-play shops, and what each one keeps in stock. */
import type { ItemStack } from "./state";

export interface ShopDef {
  id: string;
  name: string;
  /** Opening stock. Buying reduces it; selling to the shop adds to it. */
  stock: ItemStack[];
}

const SHOP_LIST: ShopDef[] = [
  {
    id: "general",
    name: "General Store",
    stock: [
      { id: "tinderbox", count: 10 },
      { id: "small_net", count: 10 },
      { id: "hammer", count: 10 },
      { id: "pot_of_flour", count: 10 },
      { id: "bucket_of_water", count: 10 },
      { id: "bread", count: 20 },
    ],
  },
  {
    id: "axes",
    name: "Bob's Brilliant Axes",
    stock: [
      { id: "bronze_axe", count: 5 },
      { id: "iron_axe", count: 3 },
      { id: "steel_axe", count: 2 },
      { id: "bronze_pickaxe", count: 5 },
      { id: "iron_pickaxe", count: 3 },
    ],
  },
  {
    id: "swords",
    name: "Varrock Swords",
    stock: [
      { id: "bronze_dagger", count: 5 },
      { id: "bronze_sword", count: 5 },
      { id: "bronze_longsword", count: 4 },
      { id: "iron_sword", count: 3 },
      { id: "steel_sword", count: 2 },
      { id: "mithril_sword", count: 1 },
    ],
  },
  {
    id: "armour",
    name: "Horvik's Armour Shop",
    stock: [
      { id: "bronze_platebody", count: 4 },
      { id: "iron_platebody", count: 3 },
      { id: "steel_platebody", count: 2 },
      { id: "bronze_platelegs", count: 4 },
      { id: "iron_platelegs", count: 3 },
    ],
  },
  {
    id: "helmets",
    name: "Peksa's Helmet Shop",
    stock: [
      { id: "bronze_helmet", count: 5 },
      { id: "iron_helmet", count: 4 },
      { id: "steel_helmet", count: 3 },
      { id: "mithril_helmet", count: 1 },
    ],
  },
  {
    id: "shields",
    name: "Cassie's Shield Shop",
    stock: [
      { id: "wooden_shield", count: 5 },
      { id: "bronze_shield", count: 4 },
      { id: "iron_shield", count: 3 },
      { id: "steel_shield", count: 2 },
    ],
  },
  {
    id: "archery",
    name: "Lowe's Archery Emporium",
    stock: [
      { id: "shortbow", count: 5 },
      { id: "bronze_arrows", count: 500 },
      { id: "feather", count: 200 },
    ],
  },
  {
    id: "runes",
    name: "Aubury's Rune Shop",
    stock: [
      { id: "air_rune", count: 500 },
      { id: "mind_rune", count: 300 },
      { id: "water_rune", count: 200 },
      { id: "earth_rune", count: 200 },
      { id: "fire_rune", count: 200 },
      { id: "body_rune", count: 200 },
    ],
  },
  {
    id: "fishing",
    name: "Gerrant's Fishy Business",
    stock: [
      { id: "small_net", count: 10 },
      { id: "fishing_rod", count: 8 },
      { id: "lobster_pot", count: 5 },
      { id: "raw_shrimp", count: 20 },
      { id: "raw_sardine", count: 20 },
    ],
  },
  {
    id: "scimitars",
    name: "Zeke's Superior Scimitars",
    stock: [
      { id: "bronze_sword", count: 5 },
      { id: "iron_sword", count: 4 },
      { id: "steel_sword", count: 3 },
      { id: "black_sword", count: 2 },
      { id: "adamantite_sword", count: 1 },
    ],
  },
];

export const SHOPS: Record<string, ShopDef> = Object.fromEntries(
  SHOP_LIST.map((shop) => [shop.id, shop]),
);

export function getShop(id: string): ShopDef {
  const shop = SHOPS[id];
  if (!shop) throw new Error(`Unknown shop: ${id}`);
  return shop;
}

export function createStock(): Record<string, ItemStack[]> {
  return Object.fromEntries(
    SHOP_LIST.map((shop) => [
      shop.id,
      shop.stock.map((entry) => ({ ...entry })),
    ]),
  );
}
