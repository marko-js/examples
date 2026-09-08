/**
 * People and animals as models rather than pictures. Classic built its
 * characters out of a handful of blocks, and so does this: the parts are laid
 * out in the model's own frame — right, forward, up — and turned to face the
 * way the character is facing.
 */
import type { NpcSprite } from "../npcs";
import type { Motion } from "../state";
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
  /** Which of the pose's knobs move this part. */
  limb?: "arm" | "off" | "tool" | "upper";
}

/**
 * How a figure is held this frame. Everything an animation does comes out of
 * these few knobs, so one set of blocks covers chopping, swinging, praying and
 * falling over.
 */
export interface Pose {
  /** Arms and legs, swung by the walk cycle. */
  walk: number;
  /** Working arm forward and up: negative is drawn back, positive struck out. */
  swing: number;
  /** How high the working arm is raised. */
  lift: number;
  /** Both arms held out, for casting. */
  reach: number;
  /** Sinking towards the ground, for praying and lighting a fire. */
  crouch: number;
  /** Leaning into the work. */
  lean: number;
  /** Tipping over, for a death. */
  fall: number;
}

export const REST: Pose = {
  walk: 0,
  swing: 0,
  lift: 0,
  reach: 0,
  crouch: 0,
  lean: 0,
  fall: 0,
};

/** Parts are painted lowest first, which keeps a standing figure in order. */
function build(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  at: { x: number; y: number },
  facing: Facing,
  scale: number,
  parts: readonly Part[],
  pose: Pose = REST,
): void {
  for (const part of parts) {
    const working = part.limb === "arm" || part.limb === "tool";
    const holds = working || part.limb === "off";
    const lift = working
      ? pose.lift
      : part.limb === "off"
        ? pose.lift * 0.4
        : 0;
    const reach = holds
      ? pose.reach + (working ? pose.swing : pose.swing * 0.25)
      : 0;
    let base = part.base - pose.crouch * Math.min(part.base, 0.34);
    let top = part.top - pose.crouch * Math.min(part.top, 0.34) * 0.4 + lift;
    // A limb pivots at its shoulder: the base barely moves, the hand swings.
    let forward = (part.atForward ?? 0) + reach * (working ? 0.2 : 0.15);
    let tilt = holds ? reach * 1.6 : 0;
    if (part.limb === "tool") {
      base += lift;
      forward += reach * 0.8;
      tilt = reach * 1.2;
    }
    // Anything above the waist leans with the shoulders.
    if (part.limb || part.base > 0.5) tilt += pose.lean * 1.4;

    // Falling over shears the figure flat along the way it is facing.
    if (pose.fall > 0) {
      const height = (base + top) / 2;
      forward += height * pose.fall * 1.3;
      tilt += pose.fall * 0.5;
      base *= 1 - pose.fall * 0.78;
      top *= 1 - pose.fall * 0.78;
    }

    prism(
      ctx,
      camera,
      at,
      facing,
      {
        right: part.right * scale,
        forward: part.forward * scale,
        base: Math.max(0, base) * scale,
        top: Math.max(0.02, top) * scale,
      },
      {
        right: (part.atRight ?? 0) * scale,
        forward: forward * scale,
      },
      part.colour,
      { right: 0, forward: tilt * scale },
    );
  }
}

/**
 * How a figure is held partway through each animation. `t` runs 0 to 1; the
 * looping ones are handed a wrapped value so they run on for as long as the
 * job does.
 */
export function poseFor(
  motion: Motion | null,
  t: number,
  walking: number,
): Pose {
  const pose: Pose = { ...REST, walk: walking };
  if (!motion) return pose;

  /** A tool raised and brought down, then carried back up for the next one. */
  const strike = (up: number, through: number) => {
    const down = t < 0.45 ? t / 0.45 : 1 - (t - 0.45) / 0.55;
    pose.lift = up * Math.max(0, t < 0.45 ? t / 0.45 : 1 - (t - 0.45) / 0.2);
    pose.swing = through * (t < 0.45 ? -down * 0.6 : down);
    pose.lean = 0.06 + 0.1 * (1 - down);
    pose.walk = 0;
  };

  switch (motion) {
    case "chop":
      strike(0.5, 0.34);
      break;
    case "mine":
      strike(0.42, 0.3);
      break;
    case "smith":
      strike(0.46, 0.26);
      break;
    case "swing":
      strike(0.3, 0.42);
      break;
    case "fish": {
      // A slow haul on the net, over and back.
      const sway = Math.sin(t * Math.PI * 2);
      pose.swing = sway * 0.16;
      pose.lift = 0.16 + sway * 0.1;
      pose.lean = 0.08;
      pose.walk = 0;
      break;
    }
    case "shoot":
      pose.reach = 0.24 * Math.sin(Math.min(1, t * 2) * Math.PI * 0.5);
      pose.lift = 0.28 * (1 - t);
      pose.walk = 0;
      break;
    case "cast":
      pose.reach = 0.3 * Math.sin(t * Math.PI);
      pose.lift = 0.42 * Math.sin(t * Math.PI);
      pose.walk = 0;
      break;
    case "cook":
      pose.reach = 0.22 * Math.sin(t * Math.PI);
      pose.lift = 0.2 * Math.sin(t * Math.PI);
      pose.lean = 0.1;
      pose.walk = 0;
      break;
    case "eat":
      pose.lift = 0.34 * Math.sin(t * Math.PI);
      pose.swing = -0.1 * Math.sin(t * Math.PI);
      break;
    case "crouch":
      pose.crouch = Math.sin(t * Math.PI);
      pose.lean = 0.18 * Math.sin(t * Math.PI);
      pose.walk = 0;
      break;
    case "flinch":
      pose.lean = -0.2 * Math.sin(t * Math.PI);
      break;
    case "death":
      // Tips over and stays down until whatever died comes back.
      pose.fall = Math.min(1, t * 1.3);
      pose.walk = 0;
      break;
  }
  return pose;
}

/** A person, held however the pose says. `scale` is their height in tiles. */
export function drawPerson(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  at: { x: number; y: number },
  look: CharacterLook,
  direction: number,
  pose: Pose,
): void {
  const facing = facingOf(direction);
  // RuneScape 2's people are taller and narrower than Classic's blocks were.
  const scale = look.height * 1.08;
  const swing = Math.sin(pose.walk) * 0.15;
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
      limb: "off",
    },
    {
      right: 0.048,
      forward: 0.06,
      base: 0.64,
      top: 1.16,
      colour: look.shirt,
      atRight: 0.185,
      atForward: swing,
      limb: "arm",
    },
    {
      right: 0.16,
      forward: 0.11,
      base: 0.62,
      top: 1.22,
      colour: look.shirt,
      limb: "upper",
    },
    {
      right: 0.115,
      forward: 0.105,
      base: 1.22,
      top: 1.5,
      colour: look.skin,
      limb: "upper",
    },
    {
      right: 0.125,
      forward: 0.115,
      base: 1.46,
      top: 1.58,
      colour: look.helmet ?? look.hair,
      limb: "upper",
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
      limb: "upper",
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
      limb: "tool",
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
      limb: "off",
    });
  }

  build(ctx, camera, at, facing, scale, parts, pose);
}

/** A four legged animal: cows, rats and the rest of the wandering livestock. */
export function drawBeast(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  at: { x: number; y: number },
  sprite: Extract<NpcSprite, { kind: "beast" }>,
  direction: number,
  pose: Pose,
): void {
  const facing = facingOf(direction);
  const width = sprite.width * 0.34;
  const length = sprite.width * 0.46;
  const height = sprite.height;
  const swing = Math.sin(pose.walk) * 0.06;
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

  build(ctx, camera, at, facing, 1, parts, pose);
}

/** A chicken, which Classic gave a comb and not much else. */
export function drawBird(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  at: { x: number; y: number },
  sprite: Extract<NpcSprite, { kind: "bird" }>,
  direction: number,
  pose: Pose,
): void {
  const facing = facingOf(direction);
  const swing = Math.sin(pose.walk) * 0.04;
  build(
    ctx,
    camera,
    at,
    facing,
    1,
    [
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
      {
        right: 0.16,
        forward: 0.21,
        base: 0.16,
        top: 0.52,
        colour: sprite.body,
      },
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
    ],
    pose,
  );
}
