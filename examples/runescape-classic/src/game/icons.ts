/**
 * Item art is described as a handful of primitives on a 32x32 grid so the
 * inventory can draw crisp icons as inline SVG with no binary assets.
 */
export type IconShape =
  | {
      kind: "rect";
      x: number;
      y: number;
      w: number;
      h: number;
      fill: string;
      rx?: number;
    }
  | { kind: "circle"; cx: number; cy: number; r: number; fill: string }
  | { kind: "poly"; points: string; fill: string };

export type Icon = IconShape[];

const WOOD = "#7a5230";
const WOOD_DARK = "#5b3c22";
const BONE = "#e8e4d0";

export function swordIcon(blade: string, shine: string): Icon {
  return [
    { kind: "poly", points: "16,2 21,8 21,20 16,24 11,20 11,8", fill: blade },
    { kind: "poly", points: "16,2 16,24 11,20 11,8", fill: shine },
    { kind: "rect", x: 7, y: 23, w: 18, h: 3, fill: "#c9a227", rx: 1 },
    { kind: "rect", x: 14, y: 26, w: 4, h: 5, fill: WOOD_DARK, rx: 1 },
  ];
}

export function axeIcon(head: string, shine: string): Icon {
  return [
    { kind: "poly", points: "6,29 10,29 24,7 21,4", fill: WOOD },
    { kind: "poly", points: "16,3 27,3 29,12 19,14", fill: head },
    { kind: "poly", points: "16,3 27,3 27,7 17,8", fill: shine },
  ];
}

export function pickaxeIcon(head: string, shine: string): Icon {
  return [
    { kind: "poly", points: "7,29 11,29 22,8 19,5", fill: WOOD },
    { kind: "poly", points: "8,10 16,3 26,7 24,11 16,8 11,14", fill: head },
    { kind: "poly", points: "8,10 16,3 26,7 16,6", fill: shine },
  ];
}

export function helmetIcon(metal: string, shine: string): Icon {
  return [
    {
      kind: "poly",
      points: "5,22 5,13 16,5 27,13 27,22 21,22 21,15 11,15 11,22",
      fill: metal,
    },
    { kind: "poly", points: "5,13 16,5 16,15 11,15 11,22 5,22", fill: shine },
    { kind: "rect", x: 14, y: 13, w: 4, h: 14, fill: metal },
  ];
}

export function bodyIcon(metal: string, shine: string): Icon {
  return [
    {
      kind: "poly",
      points: "9,6 12,4 20,4 23,6 28,10 25,14 24,28 8,28 7,14 4,10",
      fill: metal,
    },
    { kind: "poly", points: "9,6 12,4 16,4 16,28 8,28 7,14 4,10", fill: shine },
  ];
}

export function legsIcon(metal: string, shine: string): Icon {
  return [
    {
      kind: "poly",
      points: "7,4 25,4 24,29 18,29 16,15 14,29 8,29",
      fill: metal,
    },
    { kind: "poly", points: "7,4 16,4 16,15 14,29 8,29", fill: shine },
  ];
}

export function shieldIcon(metal: string, shine: string): Icon {
  return [
    { kind: "poly", points: "6,4 26,4 26,20 16,29 6,20", fill: metal },
    { kind: "poly", points: "6,4 16,4 16,29 6,20", fill: shine },
    { kind: "circle", cx: 16, cy: 14, r: 3, fill: "#c9a227" },
  ];
}

export function logsIcon(bark: string, core: string): Icon {
  return [
    { kind: "rect", x: 3, y: 11, w: 26, h: 10, fill: bark, rx: 4 },
    { kind: "circle", cx: 26, cy: 16, r: 4, fill: core },
    { kind: "circle", cx: 26, cy: 16, r: 2, fill: bark },
  ];
}

export function oreIcon(rock: string, vein: string): Icon {
  return [
    { kind: "poly", points: "6,20 10,8 22,6 27,15 23,26 11,27", fill: rock },
    { kind: "circle", cx: 13, cy: 14, r: 3, fill: vein },
    { kind: "circle", cx: 21, cy: 19, r: 2.5, fill: vein },
    { kind: "circle", cx: 17, cy: 23, r: 1.8, fill: vein },
  ];
}

export function fishIcon(body: string, fin: string, raw: boolean): Icon {
  return [
    { kind: "poly", points: "3,16 9,9 9,23", fill: fin },
    { kind: "poly", points: "8,16 15,7 25,10 29,16 25,22 15,25", fill: body },
    {
      kind: "circle",
      cx: 24,
      cy: 14,
      r: 1.6,
      fill: raw ? "#2b2b2b" : "#4a3520",
    },
  ];
}

export function coinsIcon(): Icon {
  return [
    { kind: "circle", cx: 12, cy: 20, r: 7, fill: "#d8a52a" },
    { kind: "circle", cx: 21, cy: 21, r: 6, fill: "#c9962a" },
    { kind: "circle", cx: 17, cy: 12, r: 7, fill: "#f0c93f" },
    { kind: "circle", cx: 17, cy: 12, r: 3, fill: "#d8a52a" },
  ];
}

export function bonesIcon(big: boolean): Icon {
  const w = big ? 5 : 3.5;
  return [
    { kind: "rect", x: 6, y: 15 - w / 2, w: 20, h: w, fill: BONE, rx: w / 2 },
    { kind: "circle", cx: 7, cy: 11, r: 3.4, fill: BONE },
    { kind: "circle", cx: 7, cy: 19, r: 3.4, fill: BONE },
    { kind: "circle", cx: 25, cy: 11, r: 3.4, fill: BONE },
    { kind: "circle", cx: 25, cy: 19, r: 3.4, fill: BONE },
  ];
}

export function featherIcon(): Icon {
  return [
    { kind: "poly", points: "8,27 12,15 20,5 24,9 17,19", fill: "#f2f2ea" },
    { kind: "poly", points: "8,27 24,9 20,5 12,15", fill: "#d5d5c8" },
    { kind: "rect", x: 6, y: 24, w: 5, h: 2, fill: "#b9b9ac", rx: 1 },
  ];
}

export function tinderboxIcon(): Icon {
  return [
    { kind: "rect", x: 5, y: 12, w: 22, h: 13, fill: WOOD, rx: 2 },
    { kind: "rect", x: 5, y: 12, w: 22, h: 4, fill: "#96683d", rx: 2 },
    { kind: "circle", cx: 16, cy: 20, r: 2.5, fill: "#c9a227" },
    { kind: "poly", points: "20,6 24,11 18,11", fill: "#f0902a" },
  ];
}

export function breadIcon(): Icon {
  return [
    {
      kind: "poly",
      points: "5,22 6,13 16,9 26,13 27,22 16,26",
      fill: "#c98f45",
    },
    { kind: "poly", points: "6,13 16,9 26,13 16,17", fill: "#e0ac66" },
  ];
}

export function fireIcon(): Icon {
  return [
    { kind: "poly", points: "16,3 23,14 20,26 12,26 9,14", fill: "#f2a33c" },
    { kind: "poly", points: "16,10 20,18 18,26 14,26 12,18", fill: "#f5da55" },
  ];
}

export function netIcon(): Icon {
  const mesh: Icon = [];
  for (let row = 0; row < 3; row++) {
    mesh.push({
      kind: "rect",
      x: 7 + row,
      y: 9 + row * 5,
      w: 18 - row * 2,
      h: 1.5,
      fill: "#cfd6c0",
    });
  }
  return [
    { kind: "rect", x: 14, y: 21, w: 4, h: 10, fill: WOOD, rx: 1 },
    { kind: "poly", points: "5,7 27,7 21,24 11,24", fill: "#7f8a6a" },
    ...mesh,
    { kind: "rect", x: 5, y: 5, w: 22, h: 3, fill: "#5b6b48", rx: 1 },
  ];
}

export function rodIcon(): Icon {
  return [
    { kind: "poly", points: "4,29 7,29 26,5 24,3", fill: WOOD },
    { kind: "rect", x: 3, y: 25, w: 7, h: 5, fill: "#4a3524", rx: 2 },
    { kind: "poly", points: "25,4 28,14 26,14 24,6", fill: "#dfe6ef" },
    { kind: "circle", cx: 27, cy: 16, r: 2.2, fill: "#c9a227" },
  ];
}

export function potIcon(fill: string): Icon {
  return [
    { kind: "poly", points: "6,12 26,12 23,29 9,29", fill: "#8d8d95" },
    { kind: "rect", x: 5, y: 9, w: 22, h: 4, fill: "#a5a5ad", rx: 2 },
    { kind: "rect", x: 9, y: 17, w: 14, h: 2, fill: "#5f5f68" },
    { kind: "rect", x: 10, y: 23, w: 12, h: 2, fill: "#5f5f68" },
    { kind: "circle", cx: 16, cy: 20, r: 3.2, fill: fill },
  ];
}

export function runeIcon(face: string, rim: string): Icon {
  return [
    { kind: "poly", points: "16,3 27,11 23,26 9,26 5,11", fill: rim },
    { kind: "poly", points: "16,6 24,12 21,23 11,23 8,12", fill: face },
    { kind: "rect", x: 15, y: 10, w: 2.5, h: 10, fill: rim },
    { kind: "rect", x: 11, y: 13, w: 10, h: 2.5, fill: rim },
  ];
}

export function meatIcon(raw: boolean): Icon {
  const flesh = raw ? "#c9615c" : "#a8683a";
  return [
    { kind: "poly", points: "8,9 22,7 27,15 22,25 11,26 5,18", fill: flesh },
    {
      kind: "poly",
      points: "10,11 20,10 23,15 19,22 12,22 8,17",
      fill: raw ? "#dd8480" : "#c98a54",
    },
    { kind: "rect", x: 3, y: 20, w: 7, h: 3.5, fill: "#efe7d2", rx: 1.75 },
  ];
}

export function sleepingBagIcon(): Icon {
  return [
    { kind: "rect", x: 4, y: 10, w: 24, h: 14, fill: "#3f6a8a", rx: 6 },
    { kind: "rect", x: 4, y: 10, w: 24, h: 5, fill: "#5589ad", rx: 2.5 },
    { kind: "rect", x: 14, y: 12, w: 3, h: 11, fill: "#2b4a63" },
    { kind: "circle", cx: 22, cy: 17, r: 2, fill: "#d8d2c2" },
  ];
}

export function shieldWoodIcon(): Icon {
  return [
    { kind: "poly", points: "6,4 26,4 26,20 16,29 6,20", fill: "#8a6136" },
    { kind: "poly", points: "6,4 16,4 16,29 6,20", fill: "#a67c47" },
    { kind: "rect", x: 5, y: 9, w: 22, h: 3, fill: "#5b3c22" },
    { kind: "rect", x: 5, y: 16, w: 22, h: 3, fill: "#5b3c22" },
  ];
}

export function longswordIcon(blade: string, shine: string): Icon {
  return [
    { kind: "poly", points: "16,1 20,7 20,22 16,26 12,22 12,7", fill: blade },
    { kind: "poly", points: "16,1 16,26 12,22 12,7", fill: shine },
    { kind: "rect", x: 6, y: 25, w: 20, h: 3, fill: "#c9a227", rx: 1 },
    { kind: "rect", x: 14.5, y: 28, w: 3, h: 4, fill: "#5b3c22", rx: 1 },
  ];
}

export function daggerIcon(blade: string, shine: string): Icon {
  return [
    { kind: "poly", points: "16,5 20,11 20,20 16,23 12,20 12,11", fill: blade },
    { kind: "poly", points: "16,5 16,23 12,20 12,11", fill: shine },
    { kind: "rect", x: 9, y: 22, w: 14, h: 2.5, fill: "#c9a227", rx: 1 },
    { kind: "rect", x: 14.5, y: 24, w: 3, h: 5, fill: "#5b3c22", rx: 1 },
  ];
}

export function bowIcon(): Icon {
  return [
    {
      kind: "poly",
      points: "10,3 14,8 14,24 10,29 8,29 12,24 12,8 8,3",
      fill: "#7a5230",
    },
    { kind: "rect", x: 12, y: 4, w: 1.5, h: 24, fill: "#e8e0c8" },
  ];
}

export function arrowIcon(head: string): Icon {
  return [
    { kind: "rect", x: 15, y: 8, w: 2, h: 20, fill: "#7a5230" },
    { kind: "poly", points: "16,2 21,10 11,10", fill: head },
    { kind: "poly", points: "16,22 20,29 16,27 12,29", fill: "#f2f2ea" },
  ];
}

export function barIcon(metal: string, shine: string): Icon {
  return [
    { kind: "poly", points: "5,14 27,14 24,24 8,24", fill: metal },
    { kind: "poly", points: "5,14 27,14 24,18 8,18", fill: shine },
  ];
}

export function hammerIcon(): Icon {
  return [
    { kind: "rect", x: 14, y: 12, w: 4, h: 18, fill: "#7a5230", rx: 1 },
    { kind: "rect", x: 6, y: 4, w: 20, h: 9, fill: "#8d857c", rx: 2 },
    { kind: "rect", x: 6, y: 4, w: 20, h: 3.5, fill: "#b3a99f", rx: 2 },
  ];
}

export function bucketIcon(fill: string | null): Icon {
  const shapes: Icon = [
    { kind: "poly", points: "8,10 24,10 21,28 11,28", fill: "#8d8d95" },
    { kind: "rect", x: 7, y: 8, w: 18, h: 3, fill: "#a5a5ad", rx: 1.5 },
  ];
  if (fill) shapes.push({ kind: "rect", x: 10, y: 13, w: 12, h: 5, fill });
  return shapes;
}

export function doughIcon(): Icon {
  return [
    { kind: "circle", cx: 16, cy: 19, r: 9, fill: "#e6d7b4" },
    { kind: "circle", cx: 13, cy: 16, r: 5, fill: "#f2e6c8" },
  ];
}

/* Small glyphs used by the side panel tab strip. */

export function mapIcon(): Icon {
  return [
    {
      kind: "poly",
      points: "3,7 12,4 20,8 29,5 29,25 20,28 12,24 3,27",
      fill: "#3f7a35",
    },
    { kind: "poly", points: "12,4 12,24 20,28 20,8", fill: "#c2ac74" },
    { kind: "circle", cx: 22, cy: 16, r: 3, fill: "#e33b3b" },
  ];
}

export function bagIcon(): Icon {
  return [
    { kind: "rect", x: 6, y: 11, w: 20, h: 18, fill: "#8a6136", rx: 3 },
    { kind: "poly", points: "11,12 11,7 21,7 21,12", fill: "#5b3c22" },
    { kind: "rect", x: 6, y: 16, w: 20, h: 3, fill: "#5b3c22" },
  ];
}

export function gearIcon(): Icon {
  return [
    {
      kind: "poly",
      points: "9,6 12,4 20,4 23,6 27,10 24,14 23,28 9,28 8,14 5,10",
      fill: "#b0b0ba",
    },
    {
      kind: "poly",
      points: "9,6 12,4 16,4 16,28 9,28 8,14 5,10",
      fill: "#dcdce4",
    },
  ];
}

export function statsIcon(): Icon {
  return [
    { kind: "rect", x: 5, y: 18, w: 6, h: 10, fill: "#7fdc5a" },
    { kind: "rect", x: 13, y: 11, w: 6, h: 17, fill: "#e8d24a" },
    { kind: "rect", x: 21, y: 5, w: 6, h: 23, fill: "#4ad2e8" },
  ];
}

export function chatIcon(): Icon {
  return [
    { kind: "rect", x: 3, y: 5, w: 26, h: 17, fill: "#d8d2c2", rx: 4 },
    { kind: "poly", points: "9,20 9,29 17,21", fill: "#d8d2c2" },
    { kind: "rect", x: 8, y: 10, w: 16, h: 2.4, fill: "#4a4438", rx: 1 },
    { kind: "rect", x: 8, y: 15, w: 11, h: 2.4, fill: "#4a4438", rx: 1 },
  ];
}

export function spellbookIcon(): Icon {
  return [
    { kind: "rect", x: 5, y: 5, w: 22, h: 22, fill: "#3f3f8a", rx: 2 },
    { kind: "rect", x: 5, y: 5, w: 6, h: 22, fill: "#2a2a5a", rx: 2 },
    { kind: "poly", points: "19,10 22,15 19,20 16,15", fill: "#e8d24a" },
    { kind: "poly", points: "13,13 24,13 24,17 13,17", fill: "#e8d24a" },
  ];
}

/** The prayer tab's glyph: the client's little gold orans symbol. */
export function prayerIcon(): Icon {
  return [
    { kind: "circle", cx: 16, cy: 11, r: 5, fill: "#e8dfae" },
    {
      kind: "poly",
      points: "16,14 24,20 24,27 8,27 8,20",
      fill: "#d8c98a",
    },
    { kind: "rect", x: 14, y: 16, w: 4, h: 11, fill: "#f4ecc6" },
  ];
}

export function cogIcon(): Icon {
  return [
    {
      kind: "poly",
      points:
        "14,3 18,3 19,8 23,10 27,7 29,11 25,14 25,18 29,21 27,25 23,22 19,24 18,29 14,29 13,24 9,22 5,25 3,21 7,18 7,14 3,11 5,7 9,10 13,8",
      fill: "#a5a5ad",
    },
    { kind: "circle", cx: 16, cy: 16, r: 4.5, fill: "#3f3628" },
  ];
}
