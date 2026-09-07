/** Grid movement: eight way breadth first search with "walk as close as you can" fallback. */
import { inBounds, isWalkable, type WorldMap } from "./world";

export interface Point {
  x: number;
  y: number;
}

const STEPS: readonly (readonly [number, number])[] = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
  [1, -1],
  [1, 1],
  [-1, 1],
  [-1, -1],
];

/**
 * Path from `from` to `to`, excluding the starting tile. When the goal cannot
 * be reached the path leads to the closest reachable tile instead, which is how
 * clicking across a river behaves in the original.
 */
export function findPath(map: WorldMap, from: Point, to: Point): Point[] {
  if (from.x === to.x && from.y === to.y) return [];

  const size = map.size;
  const came = searchBuffer(size * size);
  const start = from.y * size + from.x;
  const goal = to.y * size + to.x;
  came[start] = start;

  let frontier = [start];
  let best = start;
  let bestDistance = distanceSquared(from, to);
  let found = false;

  while (frontier.length && !found) {
    const next: number[] = [];
    for (const index of frontier) {
      const x = index % size;
      const y = (index / size) | 0;
      for (const [dx, dy] of STEPS) {
        const nx = x + dx;
        const ny = y + dy;
        if (!inBounds(map, nx, ny)) continue;
        const neighbour = ny * size + nx;
        if (came[neighbour] !== -1) continue;
        if (!isWalkable(map, nx, ny)) continue;
        // Diagonal moves may not squeeze between two blocked tiles.
        if (
          dx &&
          dy &&
          (!isWalkable(map, x + dx, y) || !isWalkable(map, x, y + dy))
        )
          continue;
        came[neighbour] = index;
        const distance = distanceSquared({ x: nx, y: ny }, to);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = neighbour;
        }
        if (neighbour === goal) {
          found = true;
          best = goal;
          break;
        }
        next.push(neighbour);
      }
      if (found) break;
    }
    frontier = next;
  }

  return tracePath(came, size, start, best);
}

/** Walkable tile beside `target` that is closest to `from`, if there is one. */
export function adjacentTile(
  map: WorldMap,
  from: Point,
  target: Point,
): Point | null {
  let best: Point | null = null;
  let bestDistance = Infinity;
  for (const [dx, dy] of STEPS) {
    const x = target.x + dx;
    const y = target.y + dy;
    if (!isWalkable(map, x, y)) continue;
    // Only reach a tile diagonally when the corner is open.
    if (
      dx &&
      dy &&
      !isWalkable(map, target.x + dx, target.y) &&
      !isWalkable(map, target.x, target.y + dy)
    ) {
      continue;
    }
    const distance = distanceSquared({ x, y }, from);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = { x, y };
    }
  }
  return best;
}

export function isAdjacent(a: Point, b: Point): boolean {
  return Math.abs(a.x - b.x) <= 1 && Math.abs(a.y - b.y) <= 1;
}

export function chebyshev(a: Point, b: Point): number {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

let scratch = new Int32Array(0);

function searchBuffer(length: number): Int32Array {
  if (scratch.length !== length) scratch = new Int32Array(length);
  scratch.fill(-1);
  return scratch;
}

function distanceSquared(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

function tracePath(
  came: Int32Array,
  size: number,
  start: number,
  end: number,
): Point[] {
  const path: Point[] = [];
  let index = end;
  while (index !== start && index !== -1) {
    path.push({ x: index % size, y: (index / size) | 0 });
    const previous = came[index];
    if (previous === index) break;
    index = previous;
  }
  return path.reverse();
}
