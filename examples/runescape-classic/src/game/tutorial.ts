/**
 * Tutorial Island: the RuneScape 2 route through the island, and the dialogue
 * each instructor speaks. Every stage ends by opening the door to the next one.
 */
import type { TutorialProgress } from "./state";

export interface TutorialStage {
  id: string;
  /** Shown as the current objective while the stage is in progress. */
  objective: string;
  /** Printed when the player tries the stage's exit door too early. */
  blocked: string;
}

export const TUTORIAL_STAGES: TutorialStage[] = [
  {
    id: "guide",
    objective: "Talk to the Gielinor Guide.",
    blocked: "You should talk to the Gielinor Guide before leaving.",
  },
  {
    id: "fishing",
    objective:
      "Talk to the Survival Expert, then net some shrimp from the pond.",
    blocked: "You should talk to the Survival Expert first.",
  },
  {
    id: "firemaking",
    objective: "Chop a tree, light the logs, and cook your shrimp on the fire.",
    blocked: "You should finish learning to survive before moving on.",
  },
  {
    id: "cooking",
    objective: "Talk to the Master Chef and bake some bread on the range.",
    blocked:
      "You should talk to the Master Chef before going through this door.",
  },
  {
    id: "quest",
    objective: "Talk to the Quest Guide.",
    blocked:
      "You should talk to the Quest Guide before going through this door.",
  },
  {
    id: "mining",
    objective:
      "Mine copper and tin, smelt a bronze bar at the furnace, then smith a dagger on an anvil.",
    blocked: "You should talk to the Mining Instructor before moving on.",
  },
  {
    id: "melee",
    objective: "Wield your weapons and kill a rat.",
    blocked: "You should talk to the Combat Instructor before moving on.",
  },
  {
    id: "ranged",
    objective: "Equip the shortbow and arrows, then kill a rat with them.",
    blocked: "You should finish your combat training before moving on.",
  },
  {
    id: "banking",
    objective: "Use a bank booth, then talk to the Account Guide.",
    blocked:
      "You should talk to the Account Guide before going through this door.",
  },
  {
    id: "prayer",
    objective: "Talk to Brother Brace about Prayer.",
    blocked: "You should talk to Brother Brace before going through this door.",
  },
  {
    id: "magic",
    objective:
      "Talk to the Magic Instructor and cast wind strike on a chicken.",
    blocked: "You should talk to the Magic Instructor before you leave.",
  },
];

export function stageIndex(id: string): number {
  return TUTORIAL_STAGES.findIndex((stage) => stage.id === id);
}

/* ------------------------------------------------------------- dialogue */

export type DialogueEffect =
  | "give-net"
  | "give-axe"
  | "give-cooking-kit"
  | "give-pickaxe"
  | "give-hammer"
  | "give-melee-gear"
  | "give-ranged-gear"
  | "give-bones"
  | "give-runes"
  | "open-bank"
  | "finish-tutorial";

export interface DialogueLine {
  who: "npc" | "player";
  text: string;
}

export interface DialogueOption {
  label: string;
  goto: string;
}

export interface DialogueNode {
  lines: DialogueLine[];
  /** Choices offered once the lines have been read. */
  options?: DialogueOption[];
  /** Applied by the engine as the node closes. */
  effect?: DialogueEffect;
  /** Whether closing this node finishes the current stage. */
  advance?: boolean;
}

export type DialogueScript = Record<string, DialogueNode>;

const npc = (...texts: string[]): DialogueLine[] =>
  texts.map((text) => ({ who: "npc" as const, text }));
const you = (text: string): DialogueLine => ({ who: "player", text });

export const DIALOGUE: Record<string, DialogueScript> = {
  gielinor_guide: {
    start: {
      lines: npc(
        "Greetings, and welcome to the world of Gielinor.",
        "My job is to get you started on your adventures.",
        "This place is called Tutorial Island.",
        "The advisors here will teach you everything you need to know.",
      ),
      options: [
        { label: "I'm brand new to this.", goto: "explain" },
        { label: "I've played before.", goto: "explain" },
      ],
    },
    explain: {
      lines: npc(
        "Then let us begin.",
        "Tap the ground to walk, and tap a person or object to use it.",
        "Hold your finger down, or right click, to see everything you can do.",
        "Head out of the door and follow the path to your first instructor.",
      ),
      advance: true,
    },
  },

  survival_expert: {
    start: {
      lines: npc(
        "Hello there. I am the Survival Expert.",
        "I teach the skills that keep an adventurer alive:",
        "Fishing, Woodcutting, Firemaking and Cooking.",
        "Here, take this small fishing net.",
        "There are shrimp in that pond. Tap a fishing spot to catch some.",
      ),
      effect: "give-net",
    },
    fishing: {
      lines: npc(
        "Tap one of the fishing spots in the pond.",
        "While you carry the net you will catch shrimp.",
      ),
      effect: "give-net",
    },
    caught: {
      lines: npc(
        "Well caught. That is Fishing experience earned.",
        "Raw shrimp are no good to eat, so let us cook them.",
        "Take this axe and this tinderbox.",
        "Chop one of those trees for logs,",
        "then use the tinderbox on the logs to light a fire,",
        "and finally use the shrimp on the fire to cook them.",
      ),
      effect: "give-axe",
      advance: true,
    },
    cooking: {
      lines: npc(
        "Chop a tree for logs, light them with the tinderbox,",
        "then use your raw shrimp on the fire.",
      ),
      effect: "give-axe",
    },
    done: {
      lines: npc(
        "Nicely done. Cooked food heals you when you eat it.",
        "That is all I have to teach. Head through the door to the east",
        "and the Master Chef will show you some proper cooking.",
      ),
      advance: true,
    },
  },

  master_chef: {
    start: {
      lines: npc(
        "Hello there. I am the Master Chef.",
        "Cooking is a fine skill. Let me show you how to bake bread.",
        "Here is a pot of flour and a bucket of water.",
        "Use one on the other to make bread dough,",
        "then use the dough on the range to bake it.",
      ),
      effect: "give-cooking-kit",
    },
    waiting: {
      lines: npc(
        "Use the pot of flour on the bucket of water to make dough,",
        "then use the dough on the range.",
      ),
      effect: "give-cooking-kit",
    },
    done: {
      lines: npc(
        "Excellent, fresh bread.",
        "Now go through the door to the south and speak to the Quest Guide.",
      ),
      advance: true,
    },
  },

  quest_guide: {
    start: {
      lines: [
        ...npc(
          "Welcome. I am here to tell you about quests.",
          "Quests are adventures set by the people of Gielinor.",
          "They are listed in your quest journal.",
          "A quest in red has not been started,",
          "yellow means you are part way through,",
          "and green means you have finished it.",
        ),
        you("What do I get for finishing one?"),
        ...npc(
          "Experience, items, coins, and access to new places.",
          "Now head west into the mine, where you will learn to work metal.",
        ),
      ],
      advance: true,
    },
  },

  mining_instructor: {
    start: {
      lines: npc(
        "Hello. I teach Mining and Smithing.",
        "Take this pickaxe.",
        "Mine one of the copper rocks and one of the tin rocks.",
        "Then use the ores on the furnace to smelt a bronze bar.",
      ),
      effect: "give-pickaxe",
    },
    mining: {
      lines: npc(
        "Mine a copper rock and a tin rock,",
        "then use the ore on the furnace to make a bronze bar.",
      ),
      effect: "give-pickaxe",
    },
    smelted: {
      lines: npc(
        "A fine bronze bar.",
        "Now take this hammer,",
        "and use the bar on an anvil to hammer out a bronze dagger.",
      ),
      effect: "give-hammer",
    },
    done: {
      lines: npc(
        "Well made. That dagger is yours.",
        "Take it south to the Combat Instructor and put it to use.",
      ),
    },
  },

  combat_instructor: {
    start: {
      lines: npc(
        "So you want to learn to fight.",
        "First, wield that dagger you made. Tap it in your inventory.",
        "Here is a bronze sword and a wooden shield as well.",
        "Your attack style decides which skill you train:",
        "accurate trains Attack, aggressive trains Strength,",
        "and defensive trains Defence.",
        "Now kill one of the rats in this pit.",
      ),
      effect: "give-melee-gear",
    },
    melee: {
      lines: npc(
        "Wield your weapon and kill one of the rats.",
        "Tap the rat to attack it.",
      ),
    },
    ranged: {
      lines: npc(
        "Good work. Now let us try Ranged.",
        "Here is a shortbow and some bronze arrows.",
        "Wield them both, then kill another rat from a distance.",
      ),
      effect: "give-ranged-gear",
    },
    shooting: {
      lines: npc("Wield the shortbow and arrows, then shoot one of the rats."),
    },
    done: {
      lines: npc(
        "You are ready for the world.",
        "Head south to the bank and speak to the Account Guide.",
      ),
    },
  },

  account_guide: {
    start: {
      lines: npc(
        "Welcome to the Bank of Gielinor.",
        "A bank keeps your items safe, even when you die.",
        "You can reach the same account from any bank in the world.",
        "Use one of the booths here to take a look inside.",
      ),
      options: [
        { label: "Let me see my bank.", goto: "open" },
        { label: "Thanks for the advice.", goto: "bye" },
      ],
    },
    open: {
      lines: [you("Let me see my bank."), ...npc("Of course. Here you are.")],
      effect: "open-bank",
    },
    bye: {
      lines: [
        you("Thanks for the advice."),
        ...npc(
          "Not at all.",
          "Head west to the chapel, and Brother Brace will teach you about Prayer.",
        ),
      ],
    },
  },

  brother_brace: {
    start: {
      lines: npc(
        "Greetings, traveller. I am Brother Brace.",
        "I am here to teach you about Prayer.",
        "Prayer is trained by burying the bones of things you defeat.",
        "Here, take these bones and bury them.",
      ),
      effect: "give-bones",
    },
    waiting: {
      lines: npc(
        "Bury the bones from your inventory to gain Prayer experience.",
      ),
      effect: "give-bones",
    },
    done: {
      lines: npc(
        "May Saradomin watch over you.",
        "One instructor remains. Head north to the magic house.",
      ),
    },
  },

  magic_instructor: {
    start: {
      lines: npc(
        "There is magical potential in you, I can feel it.",
        "Spells are cast with runes, which you carry in your inventory.",
        "Here are some air runes and mind runes.",
        "Open your magic tab, select wind strike,",
        "then tap one of the chickens to cast it.",
      ),
      effect: "give-runes",
    },
    casting: {
      lines: npc(
        "Select wind strike from your magic tab,",
        "then tap a chicken to cast it.",
      ),
      effect: "give-runes",
    },
    done: {
      lines: npc(
        "Well cast. Higher Magic levels open up far greater spells.",
        "That is everything. You are ready for the mainland.",
      ),
      options: [
        { label: "Send me to Lumbridge.", goto: "leave" },
        { label: "Not just yet.", goto: "stay" },
      ],
    },
    leave: {
      lines: [
        you("Send me to Lumbridge."),
        ...npc("Good luck out there, adventurer."),
      ],
      effect: "finish-tutorial",
    },
    stay: {
      lines: [you("Not just yet."), ...npc("Come back when you are ready.")],
    },
  },
};

/**
 * Which node an instructor opens on, given how far the player has got. This is
 * what makes an instructor repeat themselves until their task is done.
 */
export function entryNode(npcId: string, progress: TutorialProgress): string {
  const { flags } = progress;
  switch (npcId) {
    case "survival_expert":
      if (flags.shrimpCooked) return "done";
      if (flags.shrimpCaught) return flags.axeGiven ? "cooking" : "caught";
      return flags.netGiven ? "fishing" : "start";
    case "master_chef":
      if (flags.breadBaked) return "done";
      return flags.cookingKit ? "waiting" : "start";
    case "mining_instructor":
      if (flags.daggerSmithed) return "done";
      if (flags.barSmelted) return "smelted";
      return flags.pickaxeGiven ? "mining" : "start";
    case "combat_instructor":
      if (flags.ratShot) return "done";
      if (flags.ratKilled) return flags.rangedGear ? "shooting" : "ranged";
      return flags.meleeGear ? "melee" : "start";
    case "brother_brace":
      if (flags.bonesBuried) return "done";
      return flags.bonesGiven ? "waiting" : "start";
    case "magic_instructor":
      if (flags.spellCast) return "done";
      return flags.runesGiven ? "casting" : "start";
    default:
      return "start";
  }
}
