/** Tuning constants for the world, the render surfaces, and the tick loop. */

/** World pixels per tile. Sprites are authored against this size. */
export const TILE_SIZE = 32;

/** Game view surface, sized after the 512x334 RuneScape Classic viewport. */
export const VIEW_WIDTH = 512;
export const VIEW_HEIGHT = 336;

/** Minimap surface and how many world tiles fit into one of its pixels. */
export const MINIMAP_SIZE = 156;
export const MINIMAP_SCALE = 3;

/** Length of a game tick. Combat rounds and skilling attempts are tick aligned. */
export const TICK_MS = 600;

/** Ticks between combat rounds, so opponents trade blows every 1.2s. */
export const TICKS_PER_ROUND = 2;

/** Walking speed, roughly a tile every three tenths of a second. */
export const TILES_PER_SECOND = 3.2;

/** The world is a square grid of this many tiles per side. */
export const WORLD_SIZE = 128;

export const INVENTORY_SIZE = 30;
export const BANK_SIZE = 48;
export const MAX_CHAT_MESSAGES = 60;

/** Where new players start and where they wake up after dying. */
export const RESPAWN_TILE = { x: 72, y: 80 };

/** Ticks a dropped item stays on the ground before it decays. */
export const GROUND_ITEM_TICKS = 300;

/** Ticks between writes of the save file to local storage. */
export const AUTOSAVE_TICKS = 25;

/** Ticks a lit fire burns for. */
export const FIRE_TICKS = 200;
