/** Tuning constants for the world, the render surfaces, and the tick loop. */

/**
 * The game view fills its element, so tiles are sized from the surface rather
 * than fixed. Aiming for roughly this many tiles across the shorter axis keeps
 * a phone and a desktop showing a comparable slice of the world.
 */
export const TILES_ACROSS_SHORT_AXIS = 12;
export const MIN_TILE_SIZE = 26;
export const MAX_TILE_SIZE = 56;

/** World pixels per tile for a surface of the given size. */
export function tileSizeFor(width: number, height: number): number {
  const target = Math.min(width, height) / TILES_ACROSS_SHORT_AXIS;
  return Math.round(Math.min(MAX_TILE_SIZE, Math.max(MIN_TILE_SIZE, target)));
}

/** How many world tiles the minimap spans, whatever size it is drawn at. */
export const MINIMAP_TILES = 52;

/** Length of a game tick. Combat rounds and skilling attempts are tick aligned. */
export const TICK_MS = 600;

/** Ticks between combat rounds, so opponents trade blows every 1.2s. */
export const TICKS_PER_ROUND = 2;

/** Walking speed, roughly a tile every three tenths of a second. */
export const TILES_PER_SECOND = 3.2;

/** The world is a square grid of this many tiles per side. */
export const WORLD_SIZE = 216;

/** The mainland occupies this square; the rest of the grid is open sea. */
export const MAINLAND_SIZE = 136;

export const INVENTORY_SIZE = 30;
export const BANK_SIZE = 48;
export const MAX_CHAT_MESSAGES = 60;

/** Where players wake up after dying, in Lumbridge. */
export const RESPAWN_TILE = { x: 72, y: 80 };

/** Inside the starting house on Tutorial Island, where a new character begins. */
export const TUTORIAL_START = { x: 17, y: 148 };

/** Ticks a dropped item stays on the ground before it decays. */
export const GROUND_ITEM_TICKS = 300;

/** Ticks between writes of the save file to local storage. */
export const AUTOSAVE_TICKS = 25;

/** Ticks a lit fire burns for. */
export const FIRE_TICKS = 200;
