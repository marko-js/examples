/** Local storage persistence. The world regenerates, only the player is saved. */
import type { EquipSlot } from "./items";
import { baseLevel, SKILL_IDS, type SkillId } from "./skills";
import type { CombatStyle, GameState, ItemStack, Player } from "./state";

const KEY = "marko-runescape-classic";
const VERSION = 1;

export interface SaveData {
  version: number;
  name: string;
  x: number;
  y: number;
  hits: number;
  xp: Partial<Record<SkillId, number>>;
  inventory: (ItemStack | null)[];
  equipment: Partial<Record<EquipSlot, string>>;
  bank: ItemStack[];
  combatStyle: CombatStyle;
}

export function saveGame(state: GameState): void {
  if (typeof localStorage === "undefined") return;
  const { player } = state;
  const data: SaveData = {
    version: VERSION,
    name: player.name,
    x: player.x,
    y: player.y,
    hits: player.hits,
    xp: Object.fromEntries(SKILL_IDS.map((id) => [id, player.skills.xp[id]])),
    inventory: player.inventory,
    equipment: player.equipment,
    bank: player.bank,
    combatStyle: player.combatStyle,
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // Storage may be unavailable or full; the game plays fine without it.
  }
}

export function loadGame(): SaveData | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SaveData;
    return data.version === VERSION ? data : null;
  } catch {
    return null;
  }
}

export function clearSave(): void {
  if (typeof localStorage !== "undefined") localStorage.removeItem(KEY);
}

/** Copy a save back into a freshly created player. */
export function applySave(player: Player, data: SaveData): void {
  player.name = data.name || player.name;
  player.x = data.x;
  player.y = data.y;
  player.fx = data.x;
  player.fy = data.y;
  for (const id of SKILL_IDS) {
    const xp = data.xp[id];
    if (typeof xp === "number") player.skills.xp[id] = xp;
    player.skills.current[id] = baseLevel(player.skills, id);
  }
  player.maxHits = baseLevel(player.skills, "hits");
  player.hits = Math.min(player.maxHits, data.hits || player.maxHits);
  if (Array.isArray(data.inventory)) player.inventory = data.inventory;
  if (data.equipment) player.equipment = data.equipment;
  if (Array.isArray(data.bank)) player.bank = data.bank;
  player.combatStyle = data.combatStyle ?? player.combatStyle;
}
