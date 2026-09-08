/**
 * People and animals as models rather than pictures. Classic built its
 * characters out of a handful of blocks, and so does this: the parts are laid
 * out in the model's own frame — right, forward, up — and turned to face the
 * way the character is facing.
 */
import type { NpcSprite } from "../npcs";
import { type Facing, facingOf, prism } from "./paint";
import type { Camera } from "./projection";
import type { CharacterLook } from "./sprites";

interface Part {
  /** Half width across the model, and half depth along its look direction. */
  right: number;
  forward: number;
  base: number;
  top: number;
  colour: string;
  /** Where the part's centre sits, across and along. */
  atRight?: number;
  atForward?: number;
}

/** Parts are painted lowest first, which keeps a standing figure in order. */
function build(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  at: { x: number; y: number },
  facing: Facing,
  scale: number,
  parts: readonly Part[],
): void {
  for (const part of parts) {
    prism(
      ctx,
      camera,
      at,
      facing,
      {
        right: part.right * scale,
        forward: part.forward * scale,
        base: part.base * scale,
        top: part.top * scale,
      },
      {
        right: (part.atRight ?? 0) * scale,
        forward: (part.atForward ?? 0) * scale,
      },
      part.colour,
    );
  }
}

/**
 * A person. `phase` swings the arms and legs; `scale` is how tall a tile is in
 * world units, which is 1 for everyone but the taller NPCs.
 */
export function drawPerson(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  at: { x: number; y: number },
  look: CharacterLook,
  direction: number,
  phase: number,
): void {
  const facing = facingOf(direction);
  // RuneScape 2's people are taller and narrower than Classic's blocks were.
  const scale = look.height * 1.08;
  const swing = Math.sin(phase) * 0.15;
  const parts: Part[] = [
    // Legs, swinging opposite each other.
    {
      right: 0.062,
      forward: 0.075,
      base: 0,
      top: 0.66,
      colour: look.legs,
      atRight: -0.075,
      atForward: swing,
    },
    {
      right: 0.062,
      forward: 0.075,
      base: 0,
      top: 0.66,
      colour: look.legs,
      atRight: 0.075,
      atForward: -swing,
    },
    // Arms, opposite the leg on the same side.
    {
      right: 0.048,
      forward: 0.06,
      base: 0.64,
      top: 1.16,
      colour: look.shirt,
      atRight: -0.185,
      atForward: -swing,
    },
    {
      right: 0.048,
      forward: 0.06,
      base: 0.64,
      top: 1.16,
      colour: look.shirt,
      atRight: 0.185,
      atForward: swing,
    },
    { right: 0.16, forward: 0.11, base: 0.62, top: 1.22, colour: look.shirt },
    { right: 0.115, forward: 0.105, base: 1.22, top: 1.5, colour: look.skin },
    {
      right: 0.125,
      forward: 0.115,
      base: 1.46,
      top: 1.58,
      colour: look.helmet ?? look.hair,
    },
  ];

  if (look.cape) {
    parts.splice(4, 0, {
      right: 0.17,
      forward: 0.03,
      base: 0.6,
      top: 1.16,
      colour: look.cape,
      atForward: -0.12,
    });
  }
  if (look.weapon) {
    parts.push({
      right: 0.03,
      forward: 0.03,
      base: 0.72,
      top: 1.5,
      colour: look.weapon,
      atRight: 0.27,
      atForward: swing + 0.08,
    });
  }
  if (look.shield) {
    parts.push({
      right: 0.04,
      forward: 0.13,
      base: 0.72,
      top: 1.14,
      colour: look.shield,
      atRight: -0.28,
      atForward: -swing,
    });
  }

  build(ctx, camera, at, facing, scale, parts);
}

/** A four legged animal: cows, rats and the rest of the wandering livestock. */
export function drawBeast(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  at: { x: number; y: number },
  sprite: Extract<NpcSprite, { kind: "beast" }>,
  direction: number,
  phase: number,
): void {
  const facing = facingOf(direction);
  const width = sprite.width * 0.34;
  const length = sprite.width * 0.46;
  const height = sprite.height;
  const swing = Math.sin(phase) * 0.06;
  const parts: Part[] = [];

  for (const side of [-1, 1]) {
    for (const [index, along] of [-0.7, 0.7].entries()) {
      parts.push({
        right: 0.05,
        forward: 0.05,
        base: 0,
        top: height * 0.55,
        colour: sprite.body,
        atRight: side * width * 0.6,
        atForward: length * along + (index ? swing : -swing),
      });
    }
  }
  parts.push(
    {
      right: width,
      forward: length,
      base: height * 0.5,
      top: height * 1.15,
      colour: sprite.body,
    },
    {
      right: width * 0.9,
      forward: length * 0.85,
      base: height * 0.5,
      top: height * 0.72,
      colour: sprite.belly,
    },
    {
      right: width * 0.7,
      forward: width * 0.6,
      base: height * 0.75,
      top: height * 1.3,
      colour: sprite.body,
      atForward: length * 0.9,
    },
    {
      right: width * 0.32,
      forward: width * 0.3,
      base: height * 0.85,
      top: height * 1.05,
      colour: sprite.snout,
      atForward: length * 1.35,
    },
  );

  if (sprite.horns) {
    for (const side of [-1, 1]) {
      parts.push({
        right: 0.03,
        forward: 0.03,
        base: height * 1.28,
        top: height * 1.55,
        colour: "#e8e0cc",
        atRight: side * width * 0.5,
        atForward: length * 0.9,
      });
    }
  }
  if (sprite.tail) {
    parts.push({
      right: 0.03,
      forward: length * 0.5,
      base: height * 0.95,
      top: height * 1.1,
      colour: sprite.snout,
      atForward: -length * 1.3,
    });
  }

  build(ctx, camera, at, facing, 1, parts);
}

/** A chicken, which Classic gave a comb and not much else. */
export function drawBird(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  at: { x: number; y: number },
  sprite: Extract<NpcSprite, { kind: "bird" }>,
  direction: number,
  phase: number,
): void {
  const facing = facingOf(direction);
  const swing = Math.sin(phase) * 0.04;
  build(ctx, camera, at, facing, 1, [
    {
      right: 0.03,
      forward: 0.03,
      base: 0,
      top: 0.18,
      colour: sprite.beak,
      atRight: -0.07,
      atForward: swing,
    },
    {
      right: 0.03,
      forward: 0.03,
      base: 0,
      top: 0.18,
      colour: sprite.beak,
      atRight: 0.07,
      atForward: -swing,
    },
    { right: 0.16, forward: 0.21, base: 0.16, top: 0.52, colour: sprite.body },
    {
      right: 0.17,
      forward: 0.14,
      base: 0.24,
      top: 0.4,
      colour: sprite.wing,
    },
    {
      right: 0.11,
      forward: 0.1,
      base: 0.5,
      top: 0.72,
      colour: sprite.body,
      atForward: 0.12,
    },
    {
      right: 0.03,
      forward: 0.05,
      base: 0.68,
      top: 0.8,
      colour: sprite.comb,
      atForward: 0.12,
    },
    {
      right: 0.03,
      forward: 0.05,
      base: 0.56,
      top: 0.64,
      colour: sprite.beak,
      atForward: 0.24,
    },
  ]);
}
