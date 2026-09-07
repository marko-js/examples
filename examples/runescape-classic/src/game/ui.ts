/**
 * Snapshot of everything the interface draws. The engine hands a fresh one to
 * Marko whenever game state changes, so the panels stay a pure view of it.
 */
import { maxHit } from "./combat";
import { buyPrice, sellPrice } from "./engine";
import type { Icon } from "./icons";
import {
  type Bonus,
  EQUIP_SLOT_NAMES,
  EQUIP_SLOTS,
  type EquipSlot,
  getItem,
} from "./items";
import {
  baseLevels,
  combatLevel,
  levelForXp,
  levelProgress,
  MAX_LEVEL,
  SKILL_IDS,
  SKILL_NAMES,
  type SkillId,
  xpForLevel,
} from "./skills";
import {
  type ChatMessage,
  type CombatStyle,
  countItem,
  createPlayer,
  equipmentBonus,
  type ItemStack,
  type Overlay,
  type Player,
} from "./state";

export interface UiItem {
  slot: number;
  id: string;
  name: string;
  count: number;
  icon: Icon;
  stackable: boolean;
}

export interface UiSkill {
  id: SkillId;
  name: string;
  level: number;
  base: number;
  xp: number;
  toNextLevel: number;
  progress: number;
}

export interface UiEquipSlot {
  slot: EquipSlot;
  name: string;
  item: UiItem | null;
}

export interface UiShopEntry {
  id: string;
  name: string;
  icon: Icon;
  count: number;
  price: number;
}

export interface UiState {
  name: string;
  region: string;
  hits: number;
  maxHits: number;
  dead: boolean;
  combatLevel: number;
  maxHit: number;
  totalLevel: number;
  totalXp: number;
  skills: UiSkill[];
  inventory: (UiItem | null)[];
  freeSlots: number;
  equipment: UiEquipSlot[];
  bonus: Bonus;
  coins: number;
  messages: ChatMessage[];
  selectedSlot: number | null;
  overlay: Overlay["kind"];
  bank: UiItem[];
  shop: UiShopEntry[];
  combatStyle: CombatStyle;
}

export interface UiInput {
  player: Player;
  messages: ChatMessage[];
  overlay: Overlay;
  shopStock: ItemStack[];
  region: string;
}

export function buildUi(input: UiInput): UiState {
  const { player } = input;
  const levels = baseLevels(player.skills);

  return {
    name: player.name,
    region: input.region,
    hits: player.hits,
    maxHits: player.maxHits,
    dead: player.respawnTick !== null,
    combatLevel: combatLevel(levels),
    maxHit: maxHit(
      player.skills.current.strength,
      equipmentBonus(player).power,
    ),
    totalLevel: SKILL_IDS.reduce((total, id) => total + levels[id], 0),
    totalXp: SKILL_IDS.reduce((total, id) => total + player.skills.xp[id], 0),
    skills: SKILL_IDS.map((id) =>
      toSkill(id, player.skills.xp[id], player.skills.current[id]),
    ),
    inventory: player.inventory.map((stack, slot) => toItem(stack, slot)),
    freeSlots: player.inventory.reduce(
      (total, slot) => total + (slot ? 0 : 1),
      0,
    ),
    equipment: EQUIP_SLOTS.map((slot) => ({
      slot,
      name: EQUIP_SLOT_NAMES[slot],
      item: toItem(
        player.equipment[slot]
          ? { id: player.equipment[slot], count: 1 }
          : null,
        -1,
      ),
    })),
    bonus: equipmentBonus(player),
    coins: countItem(player.inventory, "coins"),
    messages: input.messages,
    selectedSlot: player.selectedSlot,
    overlay: input.overlay.kind,
    bank: player.bank.map((stack, slot) => toItem(stack, slot)!),
    shop: input.shopStock
      .filter((stock) => stock.count > 0)
      .map((stock) => ({
        id: stock.id,
        name: getItem(stock.id).name,
        icon: getItem(stock.id).icon,
        count: stock.count,
        price: buyPrice(getItem(stock.id)),
      })),
    combatStyle: player.combatStyle,
  };
}

/** Snapshot used for the server render, before the engine exists. */
export function initialUi(): UiState {
  return buildUi({
    player: createPlayer(),
    messages: [
      { id: 1, tone: "game", text: "Welcome to RuneScape Classic." },
      { id: 2, tone: "game", text: "Loading Lumbridge…" },
    ],
    overlay: { kind: "none" },
    shopStock: [],
    region: "Lumbridge",
  });
}

export function itemSellPrice(id: string): number {
  return sellPrice(getItem(id));
}

function toSkill(id: SkillId, xp: number, current: number): UiSkill {
  const base = levelForXp(xp);
  return {
    id,
    name: SKILL_NAMES[id],
    level: current,
    base,
    xp,
    toNextLevel: base >= MAX_LEVEL ? 0 : xpForLevel(base + 1) - xp,
    progress: levelProgress(xp),
  };
}

function toItem(
  stack: ItemStack | null | undefined,
  slot: number,
): UiItem | null {
  if (!stack) return null;
  const def = getItem(stack.id);
  return {
    slot,
    id: stack.id,
    name: def.name,
    count: stack.count,
    icon: def.icon,
    stackable: !!def.stackable,
  };
}
