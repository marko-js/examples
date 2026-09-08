/**
 * The game loop. Owns mutable world state, resolves a tick every 600ms, and
 * interpolates actor positions between ticks so movement stays smooth.
 */
import {
  type Fighter,
  HITPOINTS_XP_PER_DAMAGE,
  maxHit,
  meleeXpSplit,
  MONSTER_STYLE,
  rollDamage,
  STYLE_BONUSES,
  XP_PER_DAMAGE,
} from "./combat";
import {
  AUTOSAVE_TICKS,
  FIRE_TICKS,
  GROUND_ITEM_TICKS,
  MAX_CHAT_MESSAGES,
  RESPAWN_TILE,
  TICK_MS,
  TICKS_PER_ROUND,
  TILES_PER_SECOND,
} from "./config";
import { RESPAWN_TILE as LUMBRIDGE } from "./config";
import {
  EQUIP_SLOTS,
  getItem,
  type ItemDef,
  itemName,
  SMELT_XP,
} from "./items";
import { getNpcDef, npcCombatLevel, type NpcDef } from "./npcs";
import {
  adjacentTile,
  chebyshev,
  findPath,
  isAdjacent,
  type Point,
} from "./pathfinding";
import { pick, randInt } from "./rng";
import { applySave, type SaveData } from "./save";
import { createStock, getShop } from "./shops";
import {
  baseLevel,
  levelForXp,
  MAX_LEVEL,
  SKILL_NAMES,
  type SkillId,
} from "./skills";
import { getSpell, rollSpellDamage, SPELLS } from "./spells";
import {
  type Activity,
  addItem,
  bestTool,
  type ChatMessage,
  type CombatStyle,
  countItem,
  createPlayer,
  type Direction,
  directionTo,
  equipmentBonus,
  findSlot,
  freeSlots,
  type GameState,
  type GroundItem,
  type ItemStack,
  type MessageTone,
  type Npc,
  npcByUid,
  type Player,
  removeAt,
  removeItem,
  type Target,
} from "./state";
import {
  DIALOGUE,
  type DialogueEffect,
  type DialogueNode,
  entryNode,
  TUTORIAL_STAGES,
} from "./tutorial";
import type { UiDialogue } from "./ui";
import {
  getObjectDef,
  isWalkable,
  objectAt,
  type ObjectDef,
  regionAt,
  TERRAIN,
  terrainAt,
  tileIndex,
  type WorldObject,
} from "./world";
import { generateWorld } from "./worldgen";

export interface MenuOption {
  /** Full line for the menu, e.g. "Attack Chicken (level-1)". */
  label: string;
  /** Just the verb, shown in white in the hover text. */
  verb: string;
  /** What the verb acts on, shown in cyan. */
  name?: string;
  level?: number;
  action: string;
  target: Target;
}

/** The line drawn in the top corner while the pointer is over something. */
export interface HoverText {
  verb: string;
  name?: string;
  level?: number;
  /** How many other options a long press would offer. */
  more: number;
}

export interface EngineOptions {
  random?: () => number;
  onSave?: (state: GameState) => void;
}

export class Engine {
  readonly state: GameState;

  private readonly random: () => number;
  private readonly onSave?: (state: GameState) => void;
  private readonly listeners = new Set<() => void>();
  private accumulator = 0;
  private lastFrame = 0;
  private uiDirty = true;
  private now = 0;

  constructor(options: EngineOptions = {}) {
    this.random = options.random ?? Math.random;
    this.onSave = options.onSave;
    const map = generateWorld();
    this.state = {
      map,
      tick: 0,
      player: createPlayer(),
      npcs: [],
      groundItems: [],
      messages: [],
      splats: [],
      overlay: { kind: "none" },
      dialogue: null,
      marker: null,
      shopStock: createStock(),
      nextUid: 1,
      nextMessageId: 1,
    };
    this.spawnNpcs();
    this.message("game", "Welcome to RuneScape Classic.");
    this.message(
      "game",
      "Tap to interact. Hold, or right click, for more options.",
    );
  }

  /* ------------------------------------------------------------ lifecycle */

  /** Restore a save, ignoring a stored position that is no longer walkable. */
  load(save: SaveData): void {
    const { player } = this.state;
    applySave(player, save);
    if (!isWalkable(this.state.map, player.x, player.y)) {
      player.x = RESPAWN_TILE.x;
      player.y = RESPAWN_TILE.y;
    }
    player.fx = player.x;
    player.fy = player.y;
    this.message("game", "Welcome back to RuneScape Classic.");
  }

  /** Rename the character. Blank input keeps the current name. */
  setName(name: string): void {
    const trimmed = name.trim().slice(0, 12);
    if (!trimmed) return;
    this.state.player.name = trimmed;
    this.invalidate();
  }

  setCombatStyle(style: CombatStyle): void {
    this.state.player.combatStyle = style;
    this.invalidate();
  }

  /** Advance the simulation to `now`, in milliseconds. */
  advance(now: number): void {
    if (!this.lastFrame) this.lastFrame = now;
    const elapsed = Math.min(250, now - this.lastFrame);
    this.lastFrame = now;
    this.now = now;

    this.accumulator += elapsed;
    while (this.accumulator >= TICK_MS) {
      this.accumulator -= TICK_MS;
      this.tick();
    }

    const seconds = elapsed / 1000;
    this.step(this.state.player, seconds);
    for (const npc of this.state.npcs)
      if (!npc.respawnTick) this.step(npc, seconds);
    this.state.splats = this.state.splats.filter(
      (splat) => now - splat.bornAt < 1200,
    );

    if (this.uiDirty) {
      this.uiDirty = false;
      for (const listener of this.listeners) listener();
    }
  }

  /** Fraction of the way through the current tick, for animation. */
  get tickProgress(): number {
    return this.accumulator / TICK_MS;
  }

  get timestamp(): number {
    return this.now;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  invalidate(): void {
    this.uiDirty = true;
  }

  /* --------------------------------------------------------------- input */

  /** Menu entries for a tile, most relevant action first. */
  optionsAt(x: number, y: number): MenuOption[] {
    const { state } = this;
    const options: MenuOption[] = [];
    const using = state.player.selectedSlot;
    const usingItem = using === null ? null : state.player.inventory[using];

    /** Build an entry, keeping the verb and target apart for the hover line. */
    const entry = (
      verb: string,
      action: string,
      target: Target,
      name?: string,
      level?: number,
    ): MenuOption => ({
      label: [verb, name, level === undefined ? "" : `(level-${level})`]
        .filter(Boolean)
        .join(" "),
      verb,
      name,
      level,
      action,
      target,
    });

    const npc = state.npcs.find(
      (candidate) =>
        !candidate.respawnTick && candidate.x === x && candidate.y === y,
    );
    if (npc) {
      const def = getNpcDef(npc.defId);
      const target: Target = { kind: "npc", uid: npc.uid };
      const level = def.attackable ? npcCombatLevel(def) : undefined;
      if (state.player.selectedSpell) {
        const spell = getSpell(state.player.selectedSpell);
        options.push(
          entry(`Cast ${spell.name} on`, "cast", target, def.name, level),
        );
      }
      if (usingItem) {
        options.push(
          entry(`Use ${itemName(usingItem.id)} with`, "use", target, def.name),
        );
      }
      if (def.attackable)
        options.push(entry("Attack", "attack", target, def.name, level));
      if (def.role === "bank")
        options.push(entry("Bank with", "bank", target, def.name));
      if (def.role === "shop")
        options.push(entry("Trade with", "shop", target, def.name));
      if (def.dialogue || def.chat) {
        options.push(entry("Talk to", "talk", target, def.name));
      }
      options.push(entry("Examine", "examine", target, def.name));
    }

    const ground = state.groundItems.find(
      (item) => item.x === x && item.y === y,
    );
    if (ground) {
      const target: Target = { kind: "ground", uid: ground.uid };
      options.push(entry("Take", "take", target, itemName(ground.id)));
      options.push(entry("Examine", "examine", target, itemName(ground.id)));
    }

    const object = objectAt(state.map, x, y);
    if (object) {
      const def = getObjectDef(object.defId);
      const target: Target = { kind: "object", index: object.index };
      if (object.defId === "tut_door") {
        return [
          entry("Open", "door", target, "Door"),
          entry("Examine", "examine", target, "Door"),
        ];
      }
      if (usingItem) {
        options.push(
          entry(`Use ${itemName(usingItem.id)} with`, "use", target, def.name),
        );
      }
      if (def.gather)
        options.push(entry(def.gather.action, "gather", target, def.name));
      if (def.use === "bank")
        options.push(entry("Open", "bank", target, def.name));
      if (def.use === "shop")
        options.push(entry("Trade at", "shop", target, def.name));
      if (def.use === "cook")
        options.push(entry("Cook on", "cook-at", target, def.name));
      options.push(entry("Examine", "examine", target, def.name));
    }

    if (isWalkable(state.map, x, y)) {
      options.splice(options.length - (object || ground || npc ? 1 : 0), 0, {
        label: "Walk here",
        verb: "Walk here",
        action: "walk",
        target: { kind: "tile", x, y },
      });
    }
    return options;
  }

  /** Run a menu option, walking to the target first when it is out of reach. */
  choose(option: MenuOption): void {
    const { player } = this.state;
    if (option.action === "examine") {
      this.message("game", this.examine(option.target));
      this.invalidate();
      return;
    }

    player.activity = null;
    player.pending = null;

    if (option.action === "walk" && option.target.kind === "tile") {
      this.walkTo(option.target);
      this.invalidate();
      return;
    }

    const pending = {
      target: option.target,
      action: option.action,
      usingSlot: player.selectedSlot ?? undefined,
    };
    player.pending = pending;
    if (option.action === "use") player.selectedSlot = null;

    const tile = this.targetTile(option.target);
    if (!tile) {
      player.pending = null;
    } else if (option.target.kind === "ground") {
      this.walkTo(tile);
    } else if (!isAdjacent(player, tile)) {
      const stand = adjacentTile(this.state.map, player, tile);
      if (stand) player.path = findPath(this.state.map, player, stand);
      this.mark(tile);
    }
    this.tryPending();
    this.invalidate();
  }

  walkTo(tile: Point): void {
    const { player } = this.state;
    player.path = findPath(this.state.map, player, tile);
    this.mark(player.path.at(-1) ?? tile);
  }

  /** Drop the click marker the client draws while you walk. */
  private mark(tile: Point): void {
    this.state.marker = { x: tile.x, y: tile.y, bornAt: this.now };
  }

  /** What the pointer is over, split so the interface can colour it. */
  describeTile(x: number, y: number): HoverText | null {
    const options = this.optionsAt(x, y);
    const first = options[0];
    if (!first) return null;
    return {
      verb: first.verb,
      name: first.name,
      level: first.level,
      more: options.length - 1,
    };
  }

  /* ---------------------------------------------------------- inventory */

  inventoryOptions(slot: number): MenuOption[] {
    const stack = this.state.player.inventory[slot];
    if (!stack) return [];
    const def = getItem(stack.id);
    const target: Target = { kind: "tile", x: slot, y: -1 };
    const entry = (verb: string, action: string): MenuOption => ({
      label: `${verb} ${def.name}`,
      verb,
      name: def.name,
      action,
      target,
    });

    const options: MenuOption[] = [];
    if (def.equip) {
      options.push(
        entry(def.equip.slot === "weapon" ? "Wield" : "Wear", "equip"),
      );
    }
    if (def.heals) options.push(entry("Eat", "eat"));
    if (def.buryXp) options.push(entry("Bury", "bury"));
    options.push(entry("Use", "select"));
    options.push(entry("Drop", "drop"));
    options.push(entry("Examine", "examine-item"));
    return options;
  }

  inventoryAction(slot: number, action: string): void {
    const { player } = this.state;
    const stack = player.inventory[slot];
    if (!stack) return;
    const def = getItem(stack.id);

    switch (action) {
      case "equip":
        this.equip(slot);
        break;
      case "eat":
        this.eat(slot, def);
        break;
      case "bury":
        this.bury(slot, def);
        break;
      case "select":
        player.selectedSlot = player.selectedSlot === slot ? null : slot;
        break;
      case "drop":
        this.dropItem(slot);
        break;
      case "examine-item":
        this.message("game", def.examine);
        break;
      case "use-on":
        break;
    }
    this.invalidate();
  }

  /** Apply the selected inventory item to another inventory slot. */
  useOnSlot(fromSlot: number, toSlot: number): void {
    const { player } = this.state;
    player.selectedSlot = null;
    const a = player.inventory[fromSlot];
    const b = player.inventory[toSlot];
    if (!a || !b || fromSlot === toSlot) return;
    if (
      !this.tryLightFire(fromSlot, toSlot) &&
      !this.tryMakeDough(a.id, b.id)
    ) {
      this.message("game", "Nothing interesting happens.");
    }
    this.invalidate();
  }

  unequip(slotName: string): void {
    const { player } = this.state;
    const id = player.equipment[slotName as keyof typeof player.equipment];
    if (!id) return;
    if (!freeSlots(player.inventory)) {
      this.message("game", "Your inventory is too full to remove that.");
      return;
    }
    delete player.equipment[slotName as keyof typeof player.equipment];
    addItem(player.inventory, id);
    this.message("game", `You remove your ${itemName(id).toLowerCase()}.`);
    this.invalidate();
  }

  /* -------------------------------------------------------------- overlay */

  closeOverlay(): void {
    this.state.overlay = { kind: "none" };
    this.invalidate();
  }

  deposit(slot: number, count: number): void {
    const { player } = this.state;
    const stack = player.inventory[slot];
    if (!stack) return;
    const moved = removeAt(player.inventory, slot, count);
    const existing = player.bank.find((entry) => entry.id === stack.id);
    if (existing) existing.count += moved;
    else player.bank.push({ id: stack.id, count: moved });
    this.invalidate();
  }

  depositAll(id: string): void {
    const { player } = this.state;
    const total = countItem(player.inventory, id);
    for (let i = 0; i < player.inventory.length; i++) {
      if (player.inventory[i]?.id === id)
        removeAt(player.inventory, i, Infinity);
    }
    if (!total) return;
    const existing = player.bank.find((entry) => entry.id === id);
    if (existing) existing.count += total;
    else player.bank.push({ id, count: total });
    this.invalidate();
  }

  withdraw(id: string, count: number): void {
    const { player } = this.state;
    const entry = player.bank.find((bankItem) => bankItem.id === id);
    if (!entry) return;
    const stackable = getItem(id).stackable;
    const room =
      stackable && findSlot(player.inventory, id) !== -1
        ? Infinity
        : freeSlots(player.inventory);
    const moved = Math.min(count, entry.count, stackable ? entry.count : room);
    if (moved <= 0) {
      this.message("game", "Your inventory is full.");
      return;
    }
    if (!addItem(player.inventory, id, moved)) {
      this.message("game", "Your inventory is full.");
    }
    entry.count -= moved;
    if (entry.count <= 0)
      player.bank = player.bank.filter((bankItem) => bankItem.id !== id);
    this.invalidate();
  }

  /** Stock of the shop currently open, or an empty list. */
  get openShop(): { id: string; name: string; stock: ItemStack[] } | null {
    const { overlay, shopStock } = this.state;
    if (overlay.kind !== "shop") return null;
    const def = getShop(overlay.shopId);
    return { id: def.id, name: def.name, stock: shopStock[def.id] ?? [] };
  }

  buy(id: string): void {
    const { player } = this.state;
    const shop = this.openShop;
    if (!shop) return;
    const shopStock = shop.stock;
    const entry = shopStock.find((stock) => stock.id === id);
    if (!entry || entry.count <= 0) {
      this.message("game", "The shop has run out of stock.");
      return;
    }
    const price = buyPrice(getItem(id));
    if (countItem(player.inventory, "coins") < price) {
      this.message("game", "You do not have enough coins.");
      return;
    }
    if (!freeSlots(player.inventory) && !getItem(id).stackable) {
      this.message("game", "Your inventory is full.");
      return;
    }
    removeCoins(player, price);
    addItem(player.inventory, id);
    entry.count--;
    this.message(
      "game",
      `You buy ${itemName(id).toLowerCase()} for ${price} coins.`,
    );
    this.invalidate();
  }

  sell(slot: number): void {
    const { player } = this.state;
    const shop = this.openShop;
    if (!shop) return;
    const shopStock = shop.stock;
    const stack = player.inventory[slot];
    if (!stack || stack.id === "coins") return;
    const price = sellPrice(getItem(stack.id));
    removeAt(player.inventory, slot, 1);
    addItem(player.inventory, "coins", price);
    const entry = shopStock.find((stock) => stock.id === stack.id);
    if (entry) entry.count++;
    else shopStock.push({ id: stack.id, count: 1 });
    this.message(
      "game",
      `You sell ${itemName(stack.id).toLowerCase()} for ${price} coins.`,
    );
    this.invalidate();
  }

  /* --------------------------------------------------------------- magic */

  /** Spells the player has the level for, with whether the runes are in hand. */
  get spellbook(): {
    id: string;
    name: string;
    level: number;
    ready: boolean;
  }[] {
    const { player } = this.state;
    const magic = baseLevel(player.skills, "magic");
    return SPELLS.map((spell) => ({
      id: spell.id,
      name: spell.name,
      level: spell.level,
      ready:
        magic >= spell.level &&
        spell.runes.every(
          (rune) => countItem(player.inventory, rune.id) >= rune.count,
        ),
    }));
  }

  selectSpell(id: string | null): void {
    const { player } = this.state;
    player.selectedSpell = player.selectedSpell === id ? null : id;
    if (player.selectedSpell) player.selectedSlot = null;
    this.invalidate();
  }

  private castSpell(target: Target): void {
    const { state } = this;
    const { player } = state;
    const id = player.selectedSpell;
    player.selectedSpell = null;
    if (!id || target.kind !== "npc") return;
    const npc = npcByUid(state, target.uid);
    if (!npc || npc.respawnTick) return;

    const spell = getSpell(id);
    const magic = baseLevel(player.skills, "magic");
    if (magic < spell.level) {
      this.message("game", `You need Magic level ${spell.level} to cast that.`);
      return;
    }
    const short = spell.runes.find(
      (rune) => countItem(player.inventory, rune.id) < rune.count,
    );
    if (short) {
      this.message(
        "game",
        `You do not have enough ${itemName(short.id).toLowerCase()}.`,
      );
      return;
    }
    for (const rune of spell.runes) {
      removeItem(player.inventory, rune.id, rune.count);
    }

    player.facing = directionTo(player, npc);
    const damage = rollSpellDamage(magic, spell, this.random);
    npc.hitpoints = Math.max(0, npc.hitpoints - damage);
    this.splat(npc, damage);
    this.addXp("magic", damage ? spell.xp : Math.ceil(spell.xp / 2));
    this.setFlag("spellCast");
    this.message(
      "combat",
      damage
        ? `You cast ${spell.name.toLowerCase()}.`
        : `Your ${spell.name.toLowerCase()} splashes.`,
    );
    if (npc.hitpoints <= 0) this.killNpc(npc, getNpcDef(npc.defId));
    this.invalidate();
  }

  /* ------------------------------------------------------------ dialogue */

  /** Line the conversation is currently showing, or null when none is open. */
  get dialogueNode(): DialogueNode | null {
    const open = this.state.dialogue;
    if (!open) return null;
    return DIALOGUE[open.speaker]?.[open.node] ?? null;
  }

  /** Step to the next line, or close the node once its lines run out. */
  advanceDialogue(): void {
    const open = this.state.dialogue;
    const node = this.dialogueNode;
    if (!open || !node) return;
    if (open.line < node.lines.length - 1) {
      open.line++;
      this.invalidate();
      return;
    }
    if (node.options?.length) return;
    this.closeDialogue(node);
  }

  chooseDialogue(index: number): void {
    const open = this.state.dialogue;
    const node = this.dialogueNode;
    if (!open || !node?.options) return;
    const option = node.options[index];
    if (!option) return;
    open.node = option.goto;
    open.line = 0;
    this.invalidate();
  }

  closeDialogue(node?: DialogueNode | null): void {
    const finished = node ?? this.dialogueNode;
    this.state.dialogue = null;
    if (finished) this.applyDialogue(finished);
    this.invalidate();
  }

  private openDialogue(npcUid: number, name: string, speaker: string): void {
    const node = entryNode(speaker, this.state.player.tutorial);
    this.state.dialogue = { npcUid, speaker, name, node, line: 0 };
    this.invalidate();
  }

  /** What the interface should draw for the open conversation, if any. */
  get dialogueView(): UiDialogue | null {
    const open = this.state.dialogue;
    const node = this.dialogueNode;
    if (!open || !node) return null;
    const line = node.lines[open.line];
    const last = open.line >= node.lines.length - 1;
    return {
      name: open.name,
      who: line.who,
      text: line.text,
      options: last ? (node.options ?? []).map((option) => option.label) : [],
    };
  }

  private applyDialogue(node: DialogueNode): void {
    if (node.effect) this.applyEffect(node.effect);
    if (node.advance) this.advanceStage();
  }

  private applyEffect(effect: DialogueEffect): void {
    const { player } = this.state;
    const give = (id: string, count = 1) => {
      addItem(player.inventory, id, count);
      this.message("game", `You are given ${itemName(id).toLowerCase()}.`);
    };
    switch (effect) {
      case "give-net":
        if (!countItem(player.inventory, "small_net")) give("small_net");
        this.setFlag("netGiven");
        break;
      case "give-axe":
        if (!countItem(player.inventory, "bronze_axe")) give("bronze_axe");
        if (!countItem(player.inventory, "tinderbox")) give("tinderbox");
        this.setFlag("axeGiven");
        break;
      case "give-cooking-kit":
        if (!countItem(player.inventory, "pot_of_flour")) give("pot_of_flour");
        if (!countItem(player.inventory, "bucket_of_water")) {
          give("bucket_of_water");
        }
        this.setFlag("cookingKit");
        break;
      case "give-pickaxe":
        if (!countItem(player.inventory, "bronze_pickaxe")) {
          give("bronze_pickaxe");
        }
        this.setFlag("pickaxeGiven");
        break;
      case "give-hammer":
        if (!countItem(player.inventory, "hammer")) give("hammer");
        break;
      case "give-melee-gear":
        give("bronze_sword");
        give("wooden_shield");
        this.setFlag("meleeGear");
        break;
      case "give-ranged-gear":
        give("shortbow");
        give("bronze_arrows", 50);
        this.setFlag("rangedGear");
        break;
      case "give-bones":
        if (!countItem(player.inventory, "bones")) give("bones");
        this.setFlag("bonesGiven");
        break;
      case "give-runes":
        if (!countItem(player.inventory, "air_rune")) {
          give("air_rune", 25);
          give("mind_rune", 25);
        }
        this.setFlag("runesGiven");
        break;
      case "open-bank":
        this.state.overlay = { kind: "bank" };
        this.setFlag("banked");
        break;
      case "finish-tutorial":
        this.finishTutorial();
        break;
    }
  }

  /* ------------------------------------------------------------ tutorial */

  get tutorialObjective(): string | null {
    const { tutorial } = this.state.player;
    if (tutorial.done) return null;
    return TUTORIAL_STAGES[tutorial.stage]?.objective ?? null;
  }

  /** Records a one-off tutorial event and re-checks the current stage. */
  setFlag(name: string): void {
    const { tutorial } = this.state.player;
    if (tutorial.done || tutorial.flags[name]) return;
    tutorial.flags[name] = true;
    this.checkStage();
    this.invalidate();
  }

  /** Stages that finish by doing something rather than by talking. */
  private checkStage(): void {
    const { tutorial } = this.state.player;
    const stage = TUTORIAL_STAGES[tutorial.stage];
    if (!stage) return;
    const done: Record<string, boolean> = {
      mining: !!tutorial.flags.daggerSmithed,
      melee: !!tutorial.flags.ratKilled,
      ranged: !!tutorial.flags.ratShot,
      banking: !!tutorial.flags.banked,
      prayer: !!tutorial.flags.bonesBuried,
    };
    if (done[stage.id]) this.advanceStage();
  }

  private advanceStage(): void {
    const { tutorial } = this.state.player;
    if (tutorial.done) return;
    this.openDoor(tutorial.stage);
    tutorial.stage++;
    if (tutorial.stage >= TUTORIAL_STAGES.length) return;
    this.message("quest", TUTORIAL_STAGES[tutorial.stage].objective);
    this.invalidate();
  }

  /** Swings the door that the finished stage was holding shut. */
  private openDoor(stage: number): void {
    for (const object of this.state.map.objects) {
      if (object?.defId === "tut_door" && object.stage === stage) {
        object.defId = "gate";
      }
    }
  }

  private finishTutorial(): void {
    const { player } = this.state;
    player.tutorial.done = true;
    player.x = LUMBRIDGE.x;
    player.y = LUMBRIDGE.y;
    player.fx = player.x;
    player.fy = player.y;
    player.path = [];
    player.activity = null;
    player.pending = null;
    for (const id of [
      "bronze_axe",
      "bronze_pickaxe",
      "tinderbox",
      "small_net",
    ]) {
      if (!countItem(player.inventory, id)) addItem(player.inventory, id);
    }
    addItem(player.inventory, "coins", 25);
    this.message("quest", "You have completed the tutorial.");
    this.message("game", "Welcome to Lumbridge.");
    this.invalidate();
  }

  /* ------------------------------------------------------------ chat api */

  message(tone: MessageTone, text: string): void {
    const { state } = this;
    state.messages.push({ id: state.nextMessageId++, tone, text });
    if (state.messages.length > MAX_CHAT_MESSAGES) state.messages.shift();
    this.uiDirty = true;
  }

  say(text: string): void {
    const trimmed = text.trim();
    if (!trimmed) return;
    this.message("chat", `${this.state.player.name}: ${trimmed}`);
  }

  get region(): string {
    return regionAt(this.state.map, this.state.player.x, this.state.player.y);
  }

  /* ---------------------------------------------------------------- tick */

  private tick(): void {
    const { state } = this;
    state.tick++;

    if (state.player.respawnTick !== null) {
      if (state.tick >= state.player.respawnTick) this.respawnPlayer();
      return;
    }

    this.tryPending();
    this.runActivity();
    this.runNpcs();
    this.expireObjects();
    this.expireGroundItems();

    if (state.tick % AUTOSAVE_TICKS === 0) this.onSave?.(state);
  }

  private tryPending(): void {
    const { player } = this.state;
    const pending = player.pending;
    if (!pending) return;

    const tile = this.targetTile(pending.target);
    if (!tile) {
      player.pending = null;
      return;
    }
    if (pending.target.kind === "ground") {
      if (player.x !== tile.x || player.y !== tile.y) return;
    } else if (!isAdjacent(player, tile)) {
      if (!player.path.length) this.repathTo(tile);
      return;
    }

    player.pending = null;
    player.path = [];
    player.facing = directionTo(player, tile);
    this.begin(pending.action, pending.target, pending.usingSlot);
  }

  private begin(action: string, target: Target, usingSlot?: number): void {
    switch (action) {
      case "attack":
        this.beginCombat(target);
        break;
      case "gather":
        this.beginGather(target);
        break;
      case "take":
        this.takeGroundItem(target);
        break;
      case "bank":
        this.state.overlay = { kind: "bank" };
        this.setFlag("banked");
        break;
      case "shop": {
        const object =
          target.kind === "object"
            ? this.state.map.objects[target.index]
            : null;
        this.state.overlay = {
          kind: "shop",
          shopId: object?.shopId ?? "general",
        };
        break;
      }
      case "talk":
        this.talkTo(target);
        break;
      case "cast":
        this.castSpell(target);
        break;
      case "door":
        this.message(
          "game",
          TUTORIAL_STAGES[this.state.player.tutorial.stage]?.blocked ??
            "The door is locked.",
        );
        break;
      case "use":
        this.useOnTarget(target, usingSlot);
        break;
    }
    this.invalidate();
  }

  private runActivity(): void {
    const { player } = this.state;
    if (!player.activity) return;
    if (player.activity.kind === "combat") this.runCombatRound(player.activity);
    else this.runGather(player.activity);
  }

  /* -------------------------------------------------------------- combat */

  private beginCombat(target: Target): void {
    if (target.kind !== "npc") return;
    const npc = npcByUid(this.state, target.uid);
    if (!npc || npc.respawnTick) return;
    const def = getNpcDef(npc.defId);
    if (!def.attackable) {
      this.message("game", "You cannot attack that.");
      return;
    }
    this.state.player.activity = { kind: "combat", npcUid: npc.uid };
    this.state.player.nextRoundTick = this.state.tick;
    npc.targetPlayer = true;
    this.message("combat", `You attack the ${def.name.toLowerCase()}.`);
  }

  private runCombatRound(
    activity: Extract<Activity, { kind: "combat" }>,
  ): void {
    const { state } = this;
    const { player } = state;
    const npc = npcByUid(state, activity.npcUid);
    if (!npc || npc.respawnTick) {
      player.activity = null;
      return;
    }
    const range = this.attackRange();
    if (chebyshev(player, npc) > range) {
      if (chebyshev(player, npc) > 12) {
        player.activity = null;
        npc.targetPlayer = false;
        this.message("combat", "You have lost your target.");
        return;
      }
      if (!player.path.length) this.repathTo(npc);
      return;
    }

    player.path = [];
    npc.path = [];
    player.facing = directionTo(player, npc);
    npc.facing = directionTo(npc, player);
    if (state.tick < player.nextRoundTick) return;
    player.nextRoundTick = state.tick + TICKS_PER_ROUND;
    npc.nextRoundTick = state.tick + TICKS_PER_ROUND;

    const def = getNpcDef(npc.defId);
    const shooting = range > 1;
    if (shooting) removeItem(player.inventory, "bronze_arrows");
    const damage = rollDamage(
      this.playerFighter(shooting),
      npcFighter(def),
      this.random,
    );
    npc.hitpoints = Math.max(0, npc.hitpoints - damage);
    this.splat(npc, damage);
    if (damage) this.awardCombatXp(damage, shooting);

    if (npc.hitpoints <= 0) {
      this.killNpc(npc, def);
      return;
    }

    const back = rollDamage(npcFighter(def), this.playerFighter(), this.random);
    this.damagePlayer(back);
    this.invalidate();
  }

  /** Tiles a fight can be held at: adjacent unless a loaded bow is wielded. */
  private attackRange(): number {
    return this.isShooting() ? 5 : 1;
  }

  private isShooting(): boolean {
    const { player } = this.state;
    return (
      player.equipment.weapon === "shortbow" &&
      countItem(player.inventory, "bronze_arrows") > 0
    );
  }

  private awardCombatXp(damage: number, shooting = false): void {
    if (shooting) {
      this.addXp("ranged", damage * XP_PER_DAMAGE);
    } else {
      const split = meleeXpSplit(this.state.player.combatStyle, damage);
      for (const [skill, xp] of Object.entries(split)) {
        this.addXp(skill as SkillId, xp);
      }
    }
    this.addXp("hitpoints", damage * HITPOINTS_XP_PER_DAMAGE);
  }

  private killNpc(npc: Npc, def: NpcDef): void {
    const { state } = this;
    if (def.id === "tutorial_rat") {
      this.setFlag(
        state.player.tutorial.flags.ratKilled ? "ratShot" : "ratKilled",
      );
    }
    state.player.activity = null;
    npc.respawnTick = state.tick + Math.max(10, def.respawnTicks);
    npc.targetPlayer = false;
    npc.path = [];
    this.message("combat", `You have defeated the ${def.name.toLowerCase()}.`);

    for (const id of def.always) this.dropOnGround(id, 1, npc.x, npc.y);
    const total = def.drops.reduce((sum, drop) => sum + drop.weight, 0);
    if (total > 0 && this.random() < 0.7) {
      let roll = this.random() * total;
      for (const drop of def.drops) {
        roll -= drop.weight;
        if (roll <= 0) {
          const count = drop.min
            ? randInt(this.random, drop.min, drop.max ?? drop.min)
            : 1;
          this.dropOnGround(drop.id, count, npc.x, npc.y);
          break;
        }
      }
    }
    this.invalidate();
  }

  private killPlayer(): void {
    const { state } = this;
    state.player.activity = null;
    state.player.pending = null;
    state.player.path = [];
    state.player.respawnTick = state.tick + 3;
    for (const npc of state.npcs) npc.targetPlayer = false;
    this.message("combat", "Oh dear, you are dead!");
    this.splatText(state.player, "Dead", "level");
  }

  private respawnPlayer(): void {
    const { player } = this.state;
    player.respawnTick = null;
    player.x = RESPAWN_TILE.x;
    player.y = RESPAWN_TILE.y;
    player.fx = RESPAWN_TILE.x;
    player.fy = RESPAWN_TILE.y;
    player.maxHitpoints = baseLevel(player.skills, "hitpoints");
    player.hitpoints = player.maxHitpoints;
    for (const id of Object.keys(player.skills.current) as SkillId[]) {
      player.skills.current[id] = baseLevel(player.skills, id);
    }
    this.message("game", "You wake up back in Lumbridge, shaken but whole.");
    this.invalidate();
  }

  private playerFighter(shooting = false): Fighter {
    const { player } = this.state;
    const bonus = equipmentBonus(player);
    const level = shooting
      ? player.skills.current.ranged
      : player.skills.current.attack;
    return {
      attack: level,
      strength: shooting
        ? player.skills.current.ranged
        : player.skills.current.strength,
      defence: player.skills.current.defence,
      aim: bonus.aim,
      power: bonus.power,
      armour: bonus.armour,
      style: STYLE_BONUSES[player.combatStyle],
    };
  }

  /* ------------------------------------------------------------ gathering */

  private beginGather(target: Target): void {
    if (target.kind !== "object") return;
    const object = this.state.map.objects[target.index];
    if (!object) return;
    const def = getObjectDef(object.defId);
    const gather = def.gather;
    if (!gather) return;

    const { player } = this.state;
    const level = baseLevel(player.skills, gather.skill);
    if (level < gather.level) {
      this.message(
        "game",
        `You need ${SKILL_NAMES[gather.skill]} level ${gather.level} to do that.`,
      );
      return;
    }
    if (!bestTool(player, gather.tool)) {
      this.message(
        "game",
        `You need a ${gather.tool === "pot" ? "lobster pot" : gather.tool} to do that.`,
      );
      return;
    }
    player.activity = { kind: "gather", objectIndex: target.index };
    player.nextGatherTick = this.state.tick;
    this.message(
      "skill",
      `You start ${gatherVerb(gather.action)} the ${def.name.toLowerCase()}.`,
    );
  }

  private runGather(activity: Extract<Activity, { kind: "gather" }>): void {
    const { state } = this;
    const { player } = state;
    const object = state.map.objects[activity.objectIndex];
    if (!object) {
      player.activity = null;
      return;
    }
    const def = getObjectDef(object.defId);
    const gather = def.gather;
    if (!gather || !isAdjacent(player, object)) {
      player.activity = null;
      return;
    }
    if (state.tick < player.nextGatherTick) return;
    player.nextGatherTick = state.tick + 1;

    if (!freeSlots(player.inventory) && !getItem(gather.item).stackable) {
      this.message("game", "Your inventory is too full to hold any more.");
      player.activity = null;
      return;
    }

    const tool = bestTool(player, gather.tool);
    const level = baseLevel(player.skills, gather.skill);
    const odds =
      (level + 2 + (tool?.tier ?? 0) * 4 - gather.level) /
      (18 * gather.difficulty);
    if (this.random() > Math.min(0.85, Math.max(0.06, odds))) return;

    addItem(player.inventory, gather.item);
    if (gather.item === "raw_shrimp") this.setFlag("shrimpCaught");
    this.addXp(gather.skill, gather.xp);
    this.message(
      "skill",
      `You get some ${itemName(gather.item).toLowerCase()}.`,
    );

    if (gather.depletesTo) {
      this.replaceObject(
        object,
        gather.depletesTo,
        gather.respawnTicks ?? 20,
        object.defId,
      );
      player.activity = null;
    }
    this.invalidate();
  }

  /* ------------------------------------------------------------ item uses */

  private useOnTarget(target: Target, usingSlot?: number): void {
    const { player } = this.state;
    if (usingSlot === undefined) return;
    const stack = player.inventory[usingSlot];
    if (!stack) return;

    if (target.kind === "object") {
      const object = this.state.map.objects[target.index];
      const use = object && getObjectDef(object.defId).use;
      if (use === "cook") {
        this.cook(usingSlot, stack.id);
        return;
      }
      if (use === "smelt") {
        this.smelt();
        return;
      }
      if (use === "smith") {
        this.smith(usingSlot, stack.id);
        return;
      }
    }
    this.message("game", "Nothing interesting happens.");
  }

  private tryMakeDough(a: string, b: string): boolean {
    const pair = new Set([a, b]);
    if (!pair.has("pot_of_flour") || !pair.has("bucket_of_water")) return false;
    const { player } = this.state;
    removeItem(player.inventory, "pot_of_flour");
    removeItem(player.inventory, "bucket_of_water");
    addItem(player.inventory, "bread_dough");
    this.message("skill", "You mix the flour and water into bread dough.");
    return true;
  }

  /** Tinderbox plus logs lights a fire on the tile the player is standing on. */
  private tryLightFire(a: number, b: number): boolean {
    const { player } = this.state;
    const first = player.inventory[a];
    const second = player.inventory[b];
    if (!first || !second) return false;
    const logSlot = getItem(first.id).burnXp
      ? a
      : getItem(second.id).burnXp
        ? b
        : -1;
    const boxSlot =
      getItem(first.id).tool?.kind === "tinderbox"
        ? a
        : getItem(second.id).tool?.kind === "tinderbox"
          ? b
          : -1;
    if (logSlot === -1 || boxSlot === -1) return false;

    const logs = getItem(player.inventory[logSlot]!.id);
    const level = baseLevel(player.skills, "firemaking");
    if (level < (logs.burnLevel ?? 1)) {
      this.message(
        "game",
        `You need Firemaking level ${logs.burnLevel} to light those.`,
      );
      return true;
    }
    if (objectAt(this.state.map, player.x, player.y)) {
      this.message("game", "You cannot light a fire here.");
      return true;
    }
    const terrain = terrainAt(this.state.map, player.x, player.y);
    if (terrain === TERRAIN.water || terrain === TERRAIN.bridge) {
      this.message("game", "You cannot light a fire here.");
      return true;
    }

    removeAt(player.inventory, logSlot, 1);
    const odds = Math.min(0.9, 0.35 + (level - (logs.burnLevel ?? 1)) * 0.02);
    if (this.random() > odds) {
      this.message("skill", "You fail to light the fire.");
      return true;
    }

    const index = tileIndex(this.state.map, player.x, player.y);
    this.state.map.objects[index] = {
      index,
      defId: "fire",
      x: player.x,
      y: player.y,
      readyAt: this.state.tick + FIRE_TICKS,
    };
    this.addXp("firemaking", logs.burnXp ?? 40);
    this.message("skill", "The fire catches and the logs begin to burn.");
    return true;
  }

  /** Copper and tin become a bronze bar in a furnace. */
  private smelt(): void {
    const { player } = this.state;
    if (
      !countItem(player.inventory, "copper_ore") ||
      !countItem(player.inventory, "tin_ore")
    ) {
      this.message("game", "You need copper ore and tin ore to make bronze.");
      return;
    }
    removeItem(player.inventory, "copper_ore");
    removeItem(player.inventory, "tin_ore");
    addItem(player.inventory, "bronze_bar");
    this.setFlag("barSmelted");
    this.addXp("smithing", SMELT_XP.bronze);
    this.message("skill", "You smelt the ore into a bronze bar.");
  }

  /** A bar plus a hammer becomes a weapon on an anvil. */
  private smith(slot: number, id: string): void {
    const { player } = this.state;
    const recipe = getItem(id).smith;
    if (!recipe) {
      this.message("game", "You can only hammer metal bars on an anvil.");
      return;
    }
    if (!countItem(player.inventory, "hammer")) {
      this.message("game", "You need a hammer to work the metal.");
      return;
    }
    if (baseLevel(player.skills, "smithing") < recipe.level) {
      this.message(
        "game",
        `You need Smithing level ${recipe.level} to make that.`,
      );
      return;
    }
    removeAt(player.inventory, slot, 1);
    addItem(player.inventory, recipe.into);
    if (recipe.into === "bronze_dagger") this.setFlag("daggerSmithed");
    this.addXp("smithing", recipe.xp);
    this.message(
      "skill",
      `You hammer out a ${itemName(recipe.into).toLowerCase()}.`,
    );
  }

  private cook(slot: number, id: string): void {
    const { player } = this.state;
    const cook = getItem(id).cook;
    if (!cook) {
      this.message("game", "Nothing interesting happens.");
      return;
    }
    const level = baseLevel(player.skills, "cooking");
    if (level < cook.level) {
      this.message(
        "game",
        `You need Cooking level ${cook.level} to cook that.`,
      );
      return;
    }
    removeAt(player.inventory, slot, 1);
    // Food never burns on Tutorial Island, as in the original.
    const odds = player.tutorial.done
      ? Math.min(0.95, 0.4 + (level - cook.level) * 0.03)
      : 1;
    if (this.random() > odds) {
      addItem(player.inventory, cook.burnt);
      this.message("skill", "You accidentally burn the fish.");
      return;
    }
    addItem(player.inventory, cook.into);
    if (cook.into === "shrimp") this.setFlag("shrimpCooked");
    if (cook.into === "bread") this.setFlag("breadBaked");
    this.addXp("cooking", cook.xp);
    this.message(
      "skill",
      `You cook the ${itemName(id).replace("Raw ", "").toLowerCase()}.`,
    );
  }

  private eat(slot: number, def: ItemDef): void {
    const { player } = this.state;
    if (!def.heals) return;
    removeAt(player.inventory, slot, 1);
    const before = player.hitpoints;
    player.hitpoints = Math.min(
      player.maxHitpoints,
      player.hitpoints + def.heals,
    );
    this.message("game", `You eat the ${def.name.toLowerCase()}.`);
    if (player.hitpoints > before)
      this.splatText(player, `+${player.hitpoints - before}`, "xp");
  }

  private bury(slot: number, def: ItemDef): void {
    if (!def.buryXp) return;
    removeAt(this.state.player.inventory, slot, 1);
    this.setFlag("bonesBuried");
    this.addXp("prayer", def.buryXp);
    this.message("skill", "You dig a hole in the ground and bury the bones.");
  }

  private equip(slot: number): void {
    const { player } = this.state;
    const stack = player.inventory[slot];
    if (!stack) return;
    const def = getItem(stack.id);
    const equip = def.equip;
    if (!equip) return;
    if (
      equip.requires &&
      baseLevel(player.skills, equip.requires.skill) < equip.requires.level
    ) {
      const skill = SKILL_NAMES[equip.requires.skill];
      this.message(
        "game",
        `You need ${skill} level ${equip.requires.level} to use that.`,
      );
      return;
    }
    const current = player.equipment[equip.slot];
    removeAt(player.inventory, slot, 1);
    player.equipment[equip.slot] = stack.id;
    if (current) addItem(player.inventory, current);
    this.message("game", `You equip the ${def.name.toLowerCase()}.`);
  }

  private dropItem(slot: number): void {
    const { player } = this.state;
    const stack = player.inventory[slot];
    if (!stack) return;
    const count = removeAt(player.inventory, slot, stack.count);
    this.dropOnGround(stack.id, count, player.x, player.y);
    this.message("game", `You drop the ${itemName(stack.id).toLowerCase()}.`);
  }

  private takeGroundItem(target: Target): void {
    if (target.kind !== "ground") return;
    const { state } = this;
    const item = state.groundItems.find((entry) => entry.uid === target.uid);
    if (!item) return;
    if (!addItem(state.player.inventory, item.id, item.count)) {
      this.message("game", "Your inventory is full.");
      return;
    }
    state.groundItems = state.groundItems.filter(
      (entry) => entry.uid !== item.uid,
    );
    this.message("game", `You pick up the ${itemName(item.id).toLowerCase()}.`);
  }

  private talkTo(target: Target): void {
    if (target.kind !== "npc") return;
    const npc = npcByUid(this.state, target.uid);
    if (!npc) return;
    const def = getNpcDef(npc.defId);
    if (def.dialogue) {
      this.openDialogue(npc.uid, def.name, def.dialogue);
      return;
    }
    this.message(
      "chat",
      `${def.name}: ${def.chat ? pick(this.random, def.chat) : "..."}`,
    );
  }

  /* ------------------------------------------------------------ world sim */

  private runNpcs(): void {
    const { state } = this;
    const { player } = state;
    for (const npc of state.npcs) {
      if (npc.respawnTick !== null) {
        if (state.tick >= npc.respawnTick) this.reviveNpc(npc);
        continue;
      }
      const def = getNpcDef(npc.defId);

      if (npc.targetPlayer) {
        if (chebyshev(npc, player) > 12 || player.respawnTick !== null) {
          npc.targetPlayer = false;
        } else if (!isAdjacent(npc, player)) {
          if (!npc.path.length)
            npc.path = findPath(state.map, npc, player).slice(0, 4);
        } else if (state.tick >= npc.nextRoundTick && !this.isFighting(npc)) {
          this.npcStrike(npc, def);
        }
        continue;
      }

      if (
        def.aggressive &&
        player.respawnTick === null &&
        chebyshev(npc, player) <= 5
      ) {
        npc.targetPlayer = true;
        this.message("combat", `The ${def.name.toLowerCase()} attacks you!`);
        continue;
      }

      if (def.wander && state.tick >= npc.nextWanderTick && !npc.path.length) {
        npc.nextWanderTick = state.tick + randInt(this.random, 4, 12);
        const x = npc.home.x + randInt(this.random, -npc.radius, npc.radius);
        const y = npc.home.y + randInt(this.random, -npc.radius, npc.radius);
        if (isWalkable(state.map, x, y))
          npc.path = findPath(state.map, npc, { x, y }).slice(0, 3);
      }
    }
  }

  /** True while the player's own combat round already covers this NPC. */
  private isFighting(npc: Npc): boolean {
    const activity = this.state.player.activity;
    return activity?.kind === "combat" && activity.npcUid === npc.uid;
  }

  private npcStrike(npc: Npc, def: NpcDef): void {
    const { state } = this;
    const { player } = state;
    npc.nextRoundTick = state.tick + TICKS_PER_ROUND;
    npc.facing = directionTo(npc, player);
    const damage = rollDamage(
      npcFighter(def),
      this.playerFighter(),
      this.random,
    );
    this.damagePlayer(damage);
    this.invalidate();
  }

  /** A blow cannot be fatal while the tutorial is still running. */
  private damagePlayer(amount: number): void {
    const { player } = this.state;
    const floor = player.tutorial.done ? 0 : 1;
    player.hitpoints = Math.max(floor, player.hitpoints - amount);
    this.splat(player, amount);
    if (player.hitpoints <= 0) this.killPlayer();
  }

  private reviveNpc(npc: Npc): void {
    const def = getNpcDef(npc.defId);
    npc.respawnTick = null;
    npc.hitpoints = def.levels.hitpoints;
    npc.maxHitpoints = def.levels.hitpoints;
    npc.x = npc.home.x;
    npc.y = npc.home.y;
    npc.fx = npc.home.x;
    npc.fy = npc.home.y;
    npc.path = [];
    this.invalidate();
  }

  private expireObjects(): void {
    const { state } = this;
    for (const object of state.map.objects) {
      if (!object?.readyAt || state.tick < object.readyAt) continue;
      if (object.restoreTo) {
        object.defId = object.restoreTo;
        object.readyAt = undefined;
        object.restoreTo = undefined;
      } else {
        state.map.objects[object.index] = undefined;
      }
    }
  }

  private expireGroundItems(): void {
    const { state } = this;
    const before = state.groundItems.length;
    state.groundItems = state.groundItems.filter(
      (item) => item.expiresTick > state.tick,
    );
    if (state.groundItems.length !== before) this.invalidate();
  }

  private replaceObject(
    object: WorldObject,
    defId: string,
    respawnTicks: number,
    restoreTo: string,
  ): void {
    object.defId = defId;
    object.readyAt = this.state.tick + respawnTicks;
    object.restoreTo = restoreTo;
  }

  private dropOnGround(id: string, count: number, x: number, y: number): void {
    const { state } = this;
    const item: GroundItem = {
      uid: state.nextUid++,
      id,
      count,
      x,
      y,
      expiresTick: state.tick + GROUND_ITEM_TICKS,
    };
    state.groundItems.push(item);
    this.invalidate();
  }

  /* --------------------------------------------------------------- skills */

  addXp(skill: SkillId, amount: number): void {
    const { player } = this.state;
    const before = levelForXp(player.skills.xp[skill]);
    player.skills.xp[skill] += amount;
    const after = levelForXp(player.skills.xp[skill]);
    if (after > before) {
      player.skills.current[skill] += after - before;
      if (skill === "hitpoints") {
        player.maxHitpoints = after;
        player.hitpoints += after - before;
      }
      this.message(
        "quest",
        `You have reached ${SKILL_NAMES[skill]} level ${after}!`,
      );
      this.splatText(player, `${SKILL_NAMES[skill]} ${after}`, "level");
    }
    this.uiDirty = true;
  }

  /* -------------------------------------------------------------- helpers */

  private step(actor: Player | Npc, seconds: number): void {
    if (!actor.path.length) {
      actor.fx = actor.x;
      actor.fy = actor.y;
      return;
    }
    const next = actor.path[0];
    const dx = next.x - actor.fx;
    const dy = next.y - actor.fy;
    const distance = Math.hypot(dx, dy);
    const travel = TILES_PER_SECOND * seconds;
    if (distance <= travel || distance === 0) {
      actor.fx = next.x;
      actor.fy = next.y;
      actor.facing = directionTo({ x: actor.x, y: actor.y }, next);
      actor.x = next.x;
      actor.y = next.y;
      actor.path.shift();
    } else {
      actor.fx += (dx / distance) * travel;
      actor.fy += (dy / distance) * travel;
      actor.facing = directionTo({ x: actor.x, y: actor.y }, next);
    }
  }

  private repathTo(tile: Point): void {
    const { player } = this.state;
    const stand = adjacentTile(this.state.map, player, tile);
    if (stand) player.path = findPath(this.state.map, player, stand);
  }

  private targetTile(target: Target): Point | null {
    const { state } = this;
    switch (target.kind) {
      case "tile":
        return target;
      case "object": {
        const object = state.map.objects[target.index];
        return object ? { x: object.x, y: object.y } : null;
      }
      case "npc": {
        const npc = npcByUid(state, target.uid);
        return npc && !npc.respawnTick ? { x: npc.x, y: npc.y } : null;
      }
      case "ground": {
        const item = state.groundItems.find(
          (entry) => entry.uid === target.uid,
        );
        return item ? { x: item.x, y: item.y } : null;
      }
    }
  }

  private examine(target: Target): string {
    const { state } = this;
    switch (target.kind) {
      case "object": {
        const object = state.map.objects[target.index];
        return object
          ? getObjectDef(object.defId).examine
          : "There is nothing there.";
      }
      case "npc": {
        const npc = npcByUid(state, target.uid);
        return npc ? getNpcDef(npc.defId).examine : "There is nobody there.";
      }
      case "ground": {
        const item = state.groundItems.find(
          (entry) => entry.uid === target.uid,
        );
        return item ? getItem(item.id).examine : "There is nothing there.";
      }
      default:
        return "Just plain old ground.";
    }
  }

  private splat(actor: Player | Npc, damage: number): void {
    this.splatText(actor, String(damage), damage ? "damage" : "block");
  }

  private splatText(
    actor: { fx: number; fy: number },
    text: string,
    tone: "damage" | "block" | "xp" | "level",
  ): void {
    this.state.splats.push({
      x: actor.fx,
      y: actor.fy,
      text,
      tone,
      bornAt: this.now,
    });
  }

  private spawnNpcs(): void {
    const { state } = this;
    for (const spawn of state.map.spawns) {
      const def = getNpcDef(spawn.defId);
      for (let i = 0; i < spawn.count; i++) {
        const home = this.findSpawnTile(spawn.x, spawn.y, spawn.radius);
        state.npcs.push({
          uid: state.nextUid++,
          defId: spawn.defId,
          x: home.x,
          y: home.y,
          fx: home.x,
          fy: home.y,
          path: [],
          facing: 4 as Direction,
          hitpoints: def.levels.hitpoints,
          maxHitpoints: def.levels.hitpoints,
          home,
          radius: spawn.radius,
          respawnTick: null,
          targetPlayer: false,
          nextRoundTick: 0,
          nextWanderTick: 0,
        });
      }
    }
  }

  private findSpawnTile(x: number, y: number, radius: number): Point {
    for (let attempt = 0; attempt < 64; attempt++) {
      const tx = x + randInt(this.random, -radius, radius);
      const ty = y + randInt(this.random, -radius, radius);
      if (isWalkable(this.state.map, tx, ty)) return { x: tx, y: ty };
    }
    return { x, y };
  }
}

/* --------------------------------------------------------------- exports */

export function buyPrice(def: ItemDef): number {
  return Math.max(1, Math.round(def.value * 1.15));
}

export function sellPrice(def: ItemDef): number {
  return Math.max(1, Math.floor(def.value * 0.4));
}

export function npcFighter(def: NpcDef): Fighter {
  return {
    attack: def.levels.attack,
    strength: def.levels.strength,
    defence: def.levels.defence,
    aim: def.bonus.aim,
    power: def.bonus.power,
    armour: def.bonus.armour,
    style: MONSTER_STYLE,
  };
}

export function playerMaxHit(player: Player): number {
  const bonus = equipmentBonus(player);
  return maxHit({
    attack: player.skills.current.attack,
    strength: player.skills.current.strength,
    defence: player.skills.current.defence,
    aim: bonus.aim,
    power: bonus.power,
    armour: bonus.armour,
    style: STYLE_BONUSES[player.combatStyle],
  });
}

export { EQUIP_SLOTS, MAX_LEVEL };
export type { ChatMessage, ObjectDef };

function removeCoins(player: Player, amount: number): void {
  let remaining = amount;
  for (let i = 0; i < player.inventory.length && remaining > 0; i++) {
    if (player.inventory[i]?.id === "coins")
      remaining -= removeAt(player.inventory, i, remaining);
  }
}

function gatherVerb(action: string): string {
  const verbs: Record<string, string> = {
    Chop: "chopping",
    Mine: "mining",
    Net: "netting",
    Bait: "fishing at",
    Lure: "fishing at",
    Cage: "fishing at",
  };
  return verbs[action] ?? action.toLowerCase();
}
