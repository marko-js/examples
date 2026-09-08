/** Tuning constants for the world, the render surfaces, and the tick loop. */

/**
 * The game view fills its element, so tiles are sized from the surface rather
 * than fixed. Aiming for roughly this many tiles across the shorter axis keeps
 * a phone and a desktop showing a comparable slice of the world.
 */
export const TILES_ACROSS_SHORT_AXIS = 12;
export const MIN_TILE_SIZE = 26;
export const MAX_TILE_SIZE = 56;

/**
 * The camera looks down at an angle rather than straight down, so a tile is
 * drawn wider than it is tall and anything with height leans up the screen.
 */
export const FLATTEN = 0.58;
export const RISE = 0.82;

/** How many tiles tall a wall stands. */
export const WALL_HEIGHT = 1.15;

/** World pixels per tile for a surface of the given size. */
export function tileSizeFor(width: number, height: number): number {
  // Foreshortening means the vertical axis fits more tiles, so size from width.
  const target = Math.min(width / TILES_ACROSS_SHORT_AXIS, height / 11);
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
export const WORLD_SIZE = 256;

export const INVENTORY_SIZE = 30;
export const BANK_SIZE = 48;
export const MAX_CHAT_MESSAGES = 60;

/** Where players wake up after dying, in Lumbridge. */
export const RESPAWN_TILE = { x: 121, y: 152 };

/** Inside the starting house on Tutorial Island, where a new character begins. */
export const TUTORIAL_START = { x: 187, y: 186 };

/** Ticks a dropped item stays on the ground before it decays. */
export const GROUND_ITEM_TICKS = 300;

/** Ticks between writes of the save file to local storage. */
export const AUTOSAVE_TICKS = 25;

/** Ticks a lit fire burns for. */
export const FIRE_TICKS = 200;
