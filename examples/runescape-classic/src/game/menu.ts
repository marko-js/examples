/** Right click menu shown over the game view and the inventory. */
export interface MenuEntry {
  label: string;
  run: () => void;
}

export interface MenuState {
  /** Position within the game frame, in pixels. */
  x: number;
  y: number;
  entries: MenuEntry[];
}
