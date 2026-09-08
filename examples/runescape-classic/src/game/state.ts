/** Game state shape plus the pure helpers that read and mutate it. */
import { INVENTORY_SIZE, TUTORIAL_START } from "./config";
import {
  addBonus,
  type Bonus,
  EMPTY_BONUS,
  type EquipSlot,
  getItem,
  type ToolKind,
} from "./items";
import type { Point } from "./pathfinding";
import { baseLevel, createSkills, type Skills } from "./skills";
import type { WorldMap } from "./world";

export type CombatStyle =
  "controlled" | "aggressive" | "accurate" | "defensive";

export const COMBAT_STYLES: { id: CombatStyle; name: string; blurb: string }[] =
  [
    {
      id: "controlled",
      name: "Controlled",
      blurb: "Shared attack, strength and defence",
    },
    {
      id: "aggressive",
      name: "Aggressive",
      blurb: "All experience into strength",
    },
    { id: "accurate", name: "Accurate", blurb: "All experience into attack" },
    {
      id: "defensive",
      name: "Defensive",
      blurb: "All experience into defence",
    },
  ];

/** Eight compass directions, clockwise from north. */
export type Direction = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface ItemStack {
  id: string;
  count: number;
}

export interface Actor {
  /** Tile the actor logically occupies. */
  x: number;
  y: number;
  /** Smoothly interpolated position in tile units, used for drawing. */
  fx: number;
  fy: number;
  path: Point[];
  facing: Direction;
  hitpoints: number;
  maxHitpoints: number;
}

export type Target =
  | { kind: "tile"; x: number; y: number }
  | { kind: "object"; index: number }
  | { kind: "npc"; uid: number }
  | { kind: "ground"; uid: number };

export type Activity =
  { kind: "gather"; objectIndex: number } | { kind: "combat"; npcUid: number };

export interface PendingAction {
  target: Target;
  action: string;
  /** Inventory slot being applied, for "use item on ..." actions. */
  usingSlot?: number;
}

export interface Appearance {
  skin: string;
  hair: string;
  shirt: string;
  legs: string;
}

export interface Player extends Actor {
  name: string;
  appearance: Appearance;
  skills: Skills;
  inventory: (ItemStack | null)[];
  equipment: Partial<Record<EquipSlot, string>>;
  bank: ItemStack[];
  combatStyle: CombatStyle;
  tutorial: TutorialProgress;
  activity: Activity | null;
  pending: PendingAction | null;
  /** Tick the next combat round may resolve on. */
  nextRoundTick: number;
  /** Tick the next gathering attempt may resolve on. */
  nextGatherTick: number;
  /** Tick the player stands back up after dying. */
  respawnTick: number | null;
  /** Inventory slot picked up for a "use with" interaction. */
  selectedSlot: number | null;
  /** Spell armed from the magic tab, waiting for a target. */
  selectedSpell: string | null;
}

export interface Npc extends Actor {
  uid: number;
  defId: string;
  home: Point;
  radius: number;
  /** Tick the NPC returns after being killed, or null while it is alive. */
  respawnTick: number | null;
  targetPlayer: boolean;
  nextRoundTick: number;
  nextWanderTick: number;
}

export interface GroundItem {
  uid: number;
  id: string;
  count: number;
  x: number;
  y: number;
  expiresTick: number;
}

export type MessageTone = "game" | "skill" | "combat" | "quest" | "chat";

export interface ChatMessage {
  id: number;
  tone: MessageTone;
  text: string;
}

/** Short lived damage numbers and floating text drawn over the world. */
export interface Splat {
  x: number;
  y: number;
  text: string;
  tone: "damage" | "block" | "xp" | "level";
  bornAt: number;
}

/** How far through Tutorial Island the player is. */
export interface TutorialProgress {
  /** Number of stages completed; indexes into TUTORIAL_STAGES. */
  stage: number;
  done: boolean;
  /** One-off events a stage waits on, such as burning the first piece of meat. */
  flags: Record<string, boolean>;
}

/** An NPC conversation being played out one line at a time. */
export interface DialogueState {
  npcUid: number;
  /** Key into the dialogue scripts. */
  speaker: string;
  /** Display name shown above the lines. */
  name: string;
  node: string;
  line: number;
}

export type Overlay =
  { kind: "none" } | { kind: "bank" } | { kind: "shop"; shopId: string };

export interface GameState {
  map: WorldMap;
  tick: number;
  player: Player;
  npcs: Npc[];
  groundItems: GroundItem[];
  messages: ChatMessage[];
  splats: Splat[];
  overlay: Overlay;
  dialogue: DialogueState | null;
  /** Where the player last asked to go, drawn as the click marker. */
  marker: { x: number; y: number; bornAt: number } | null;
  /** Stock per shop, keyed by shop id. */
  shopStock: Record<string, ItemStack[]>;
  nextUid: number;
  nextMessageId: number;
}

export const DEFAULT_APPEARANCE: Appearance = {
  skin: "#d8a87a",
  hair: "#6b4a2a",
  shirt: "#9a4b3f",
  legs: "#3f4a63",
};

export function createPlayer(): Player {
  return {
    name: "Guest",
    appearance: { ...DEFAULT_APPEARANCE },
    x: TUTORIAL_START.x,
    y: TUTORIAL_START.y,
    fx: TUTORIAL_START.x,
    fy: TUTORIAL_START.y,
    path: [],
    facing: 4,
    hitpoints: 10,
    maxHitpoints: 10,
    skills: createSkills(),
    inventory: createInventory(),
    equipment: {},
    bank: [],
    combatStyle: "controlled",
    tutorial: { stage: 0, done: false, flags: {} },
    activity: null,
    pending: null,
    nextRoundTick: 0,
    nextGatherTick: 0,
    respawnTick: null,
    selectedSlot: null,
    selectedSpell: null,
  };
}

export function createInventory(
  stacks: ItemStack[] = [],
): (ItemStack | null)[] {
  const inventory = new Array<ItemStack | null>(INVENTORY_SIZE).fill(null);
  for (const [index, stack] of stacks.entries())
    inventory[index] = { ...stack };
  return inventory;
}

/* ------------------------------------------------------------- inventory */

export function freeSlots(inventory: (ItemStack | null)[]): number {
  return inventory.reduce((total, slot) => total + (slot ? 0 : 1), 0);
}

/** Adds an item, stacking where the item allows it. Returns false when full. */
export function addItem(
  inventory: (ItemStack | null)[],
  id: string,
  count = 1,
): boolean {
  if (getItem(id).stackable) {
    const existing = inventory.find((slot) => slot?.id === id);
    if (existing) {
      existing.count += count;
      return true;
    }
    const empty = inventory.indexOf(null);
    if (empty === -1) return false;
    inventory[empty] = { id, count };
    return true;
  }

  let placed = 0;
  for (let i = 0; i < inventory.length && placed < count; i++) {
    if (!inventory[i]) {
      inventory[i] = { id, count: 1 };
      placed++;
    }
  }
  return placed === count;
}

export function removeAt(
  inventory: (ItemStack | null)[],
  slot: number,
  count = 1,
): number {
  const stack = inventory[slot];
  if (!stack) return 0;
  const taken = Math.min(count, stack.count);
  stack.count -= taken;
  if (stack.count <= 0) inventory[slot] = null;
  return taken;
}

export function countItem(inventory: (ItemStack | null)[], id: string): number {
  return inventory.reduce(
    (total, slot) => total + (slot?.id === id ? slot.count : 0),
    0,
  );
}

export function removeItem(
  inventory: (ItemStack | null)[],
  id: string,
  count = 1,
): boolean {
  if (countItem(inventory, id) < count) return false;
  let remaining = count;
  for (let i = 0; i < inventory.length && remaining > 0; i++) {
    if (inventory[i]?.id === id) remaining -= removeAt(inventory, i, remaining);
  }
  return true;
}

export function findSlot(inventory: (ItemStack | null)[], id: string): number {
  return inventory.findIndex((slot) => slot?.id === id);
}

/* ------------------------------------------------------------- equipment */

/** Highest tier tool of `kind` the player is holding or wearing, or null. */
export function bestTool(
  player: Player,
  kind: ToolKind,
): { id: string; tier: number } | null {
  let best: { id: string; tier: number } | null = null;
  const consider = (id: string | undefined) => {
    if (!id) return;
    const tool = getItem(id).tool;
    if (tool?.kind === kind && (!best || tool.tier > best.tier))
      best = { id, tier: tool.tier };
  };
  for (const slot of player.inventory) consider(slot?.id);
  consider(player.equipment.weapon);
  return best;
}

export function equipmentBonus(player: Player): Bonus {
  let total = EMPTY_BONUS;
  for (const id of Object.values(player.equipment)) {
    const equip = getItem(id).equip;
    if (equip) total = addBonus(total, equip.bonus);
  }
  return total;
}

export function maxHitpointsOf(player: Player): number {
  return baseLevel(player.skills, "hitpoints");
}

/* ------------------------------------------------------------------- npcs */

export function npcAt(state: GameState, x: number, y: number): Npc | undefined {
  return state.npcs.find(
    (npc) => !npc.respawnTick && npc.x === x && npc.y === y,
  );
}

export function npcByUid(state: GameState, uid: number): Npc | undefined {
  return state.npcs.find((npc) => npc.uid === uid);
}

export function groundItemAt(
  state: GameState,
  x: number,
  y: number,
): GroundItem | undefined {
  return state.groundItems.find((item) => item.x === x && item.y === y);
}

/** Direction from one tile to another, used to face actors as they move. */
export function directionTo(from: Point, to: Point): Direction {
  const dx = Math.sign(to.x - from.x);
  const dy = Math.sign(to.y - from.y);
  if (dx === 0 && dy === 0) return 4;
  const table: Record<string, Direction> = {
    "0,-1": 0,
    "1,-1": 1,
    "1,0": 2,
    "1,1": 3,
    "0,1": 4,
    "-1,1": 5,
    "-1,0": 6,
    "-1,-1": 7,
  };
  return table[`${dx},${dy}`] ?? 4;
}
