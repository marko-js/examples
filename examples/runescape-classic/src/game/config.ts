/** Tuning constants for the world, the render surfaces, and the tick loop. */

/**
 * The camera. Classic looked at the world down a fixed bearing from above and
 * behind the player, near enough to half way between level and straight down.
 */
export const CAMERA_PITCH = 56;
/** How high the camera floats, and how far back it stands, in tiles. */
export const CAMERA_HEIGHT = 9;
export const CAMERA_BACK = 7;
/**
 * Focal length as a share of the buffer's shorter side, which sets the field
 * of view. Measuring off the short side keeps a phone held upright from
 * squeezing the view down to a corridor.
 */
export const FOCAL_TILES = 0.9;
/** How far the world is drawn before it fades into the void, in tiles. */
export const DRAW_DISTANCE = 40;

/**
 * Classic ran in a 512 by 346 window. Drawing into a buffer of about that size
 * and blowing it up keeps the soft, chunky pixels, and keeps the per-pixel
 * ground affordable on a phone.
 */
export const BUFFER_LONG_AXIS = 460;

/** How many tiles tall a wall stands. */
export const WALL_HEIGHT = 1.7;

/** How many world tiles the minimap spans, whatever size it is drawn at. */
export const MINIMAP_TILES = 52;

/** Length of a game tick. Combat rounds and skilling attempts are tick aligned. */
export const TICK_MS = 600;

/** The standard weapon speed: four ticks, so blows land every 2.4s. */
export const TICKS_PER_ROUND = 4;

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
