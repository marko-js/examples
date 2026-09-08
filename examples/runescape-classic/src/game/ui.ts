/**
 * Snapshot of everything the interface draws. The engine hands a fresh one to
 * Marko whenever game state changes, so the panels stay a pure view of it.
 */
import { buyPrice, playerMaxHit, sellPrice } from "./engine";
import type { Icon } from "./icons";
import {
  type Bonus,
  EQUIP_SLOT_NAMES,
  EQUIP_SLOTS,
  type EquipSlot,
  getItem,
  itemName,
} from "./items";
import { PRAYERS } from "./prayers";
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

export interface UiDialogue {
  /** Who is speaking, shown above the line. */
  name: string;
  who: "npc" | "player";
  text: string;
  /** Choices to show, empty until the last line is reached. */
  options: string[];
}

export interface UiPrayer {
  id: string;
  name: string;
  level: number;
  blurb: string;
  active: boolean;
  /** False until the player's Prayer level reaches it. */
  ready: boolean;
}

export interface UiSpell {
  id: string;
  name: string;
  level: number;
  /** True when the level and runes are both in hand. */
  ready: boolean;
  selected: boolean;
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
  hitpoints: number;
  maxHitpoints: number;
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
  shopName: string;
  shop: UiShopEntry[];
  combatStyle: CombatStyle;
  /** What the player is fighting with, for the combat tab. */
  weapon: string;
  prayerPoints: number;
  maxPrayerPoints: number;
  prayerBook: UiPrayer[];
  running: boolean;
  /** Run energy left, 0 to 100. */
  runEnergy: number;
  dialogue: UiDialogue | null;
  spells: UiSpell[];
  /** Current Tutorial Island objective, or null once it is finished. */
  objective: string | null;
}

export interface UiInput {
  player: Player;
  messages: ChatMessage[];
  overlay: Overlay;
  /** The shop the player has open, if any. */
  shop?: { name: string; stock: ItemStack[] } | null;
  region: string;
  dialogue?: UiDialogue | null;
  spells?: { id: string; name: string; level: number; ready: boolean }[];
  objective?: string | null;
}

export function buildUi(input: UiInput): UiState {
  const { player } = input;
  const levels = baseLevels(player.skills);

  return {
    name: player.name,
    region: input.region,
    hitpoints: player.hitpoints,
    maxHitpoints: player.maxHitpoints,
    dead: player.respawnTick !== null,
    combatLevel: combatLevel(levels),
    maxHit: playerMaxHit(player),
    totalLevel: SKILL_IDS.reduce((total, id) => total + levels[id], 0),
    totalXp: Math.floor(
      SKILL_IDS.reduce((total, id) => total + player.skills.xp[id], 0),
    ),
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
    shopName: input.shop?.name ?? "",
    shop: (input.shop?.stock ?? [])
      .filter((stock) => stock.count > 0)
      .map((stock) => ({
        id: stock.id,
        name: getItem(stock.id).name,
        icon: getItem(stock.id).icon,
        count: stock.count,
        price: buyPrice(getItem(stock.id)),
      })),
    combatStyle: player.combatStyle,
    weapon: player.equipment.weapon
      ? itemName(player.equipment.weapon)
      : "Unarmed",
    prayerPoints: Math.floor(player.prayerPoints),
    maxPrayerPoints: levels.prayer,
    prayerBook: PRAYERS.map((prayer) => ({
      id: prayer.id,
      name: prayer.name,
      level: prayer.level,
      blurb: prayer.blurb,
      active: player.prayers.includes(prayer.id),
      ready: levels.prayer >= prayer.level,
    })),
    running: player.running,
    runEnergy: Math.round(player.runEnergy),
    dialogue: input.dialogue ?? null,
    spells: (input.spells ?? []).map((spell) => ({
      ...spell,
      selected: player.selectedSpell === spell.id,
    })),
    objective: input.objective ?? null,
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
    region: "Tutorial Island",
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
    // Experience is paid in fractions; the game only ever shows whole points.
    xp: Math.floor(xp),
    toNextLevel: base >= MAX_LEVEL ? 0 : Math.ceil(xpForLevel(base + 1) - xp),
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
