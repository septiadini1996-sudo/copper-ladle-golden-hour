// The diner's data: ingredients (each with its OWN cooking time in seconds), the stations
// they cook on, the 26 recipes built from them, the drinks, the customers, the leveled
// shop upgrades with their buffs in plain numbers, the decor, and the story scenes.
// Pure data — the engine in engine.js gives it behaviour.

/** Processes and the station each one cooks on. 'none' goes straight onto the dish. */
export const PROCESS_STATION = {
  none: null,
  prep: 'prep',
  grill: 'grill',
  fry: 'fryer',
  boil: 'stove',
  bake: 'oven',
  brew: 'drinks',
};

export const STATIONS = [
  { id: 'prep', name: 'Prep Board', process: 'prep' },
  { id: 'grill', name: 'Grill', process: 'grill' },
  { id: 'fryer', name: 'Fryer', process: 'fry' },
  { id: 'stove', name: 'Stove', process: 'boil' },
  { id: 'oven', name: 'Brick Oven', process: 'bake' },
  { id: 'drinks', name: 'Drinks', process: 'brew' },
];

/**
 * The 29 pantry ingredients. `cook` is the ingredient's own base cooking time in seconds
 * (0 for ingredients that need no cooking). `shape` + colours drive the painters in art.js.
 */
export const INGREDIENTS = [
  { id: 'bun', name: 'Bun', process: 'none', cook: 0, shape: 'dome', c1: '#e8a856', c2: '#c47f33' },
  { id: 'patty', name: 'Patty', process: 'grill', cook: 8, shape: 'patty', c1: '#8a5a34', c2: '#5f3a1e' },
  { id: 'cheese', name: 'Cheese', process: 'none', cook: 0, shape: 'wedge', c1: '#ffd23e', c2: '#e0a91c' },
  { id: 'lettuce', name: 'Lettuce', process: 'prep', cook: 3, shape: 'leaf', c1: '#7ec850', c2: '#4d9430' },
  { id: 'tomato', name: 'Tomato', process: 'prep', cook: 3, shape: 'round', c1: '#e8452c', c2: '#b02a18' },
  { id: 'onion', name: 'Onion', process: 'prep', cook: 4, shape: 'rings', c1: '#d9b8e6', c2: '#a87fc4' },
  { id: 'egg', name: 'Egg', process: 'fry', cook: 3, shape: 'egg', c1: '#fff6e8', c2: '#ffb52e' },
  { id: 'bacon', name: 'Bacon', process: 'fry', cook: 5, shape: 'wavy', c1: '#c4503c', c2: '#8e2f22' },
  { id: 'chicken', name: 'Chicken', process: 'grill', cook: 9, shape: 'drum', c1: '#e0a05a', c2: '#b06f2e' },
  { id: 'fish', name: 'Fish', process: 'grill', cook: 7, shape: 'fish', c1: '#7fb6d9', c2: '#4a84ad' },
  { id: 'shrimp', name: 'Shrimp', process: 'fry', cook: 5, shape: 'shrimp', c1: '#f59a76', c2: '#d96a44' },
  { id: 'noodles', name: 'Noodles', process: 'boil', cook: 7, shape: 'noodle', c1: '#f2d38a', c2: '#d9ab4e' },
  { id: 'rice', name: 'Rice', process: 'boil', cook: 8, shape: 'grain', c1: '#f7f2e4', c2: '#d8cfb4' },
  { id: 'pasta', name: 'Pasta', process: 'boil', cook: 9, shape: 'pasta', c1: '#f0c96a', c2: '#cf9c34' },
  { id: 'broth', name: 'Broth', process: 'boil', cook: 6, shape: 'pot', c1: '#c97e35', c2: '#96551c' },
  { id: 'mushroom', name: 'Mushroom', process: 'fry', cook: 4, shape: 'shroom', c1: '#cbb59a', c2: '#9a7f5e' },
  { id: 'carrot', name: 'Carrot', process: 'prep', cook: 4, shape: 'carrot', c1: '#f08a2e', c2: '#c46414' },
  { id: 'potato', name: 'Potato', process: 'fry', cook: 6, shape: 'fries', c1: '#f2cd6b', c2: '#d1a23a' },
  { id: 'dough', name: 'Dough', process: 'bake', cook: 8, shape: 'dough', c1: '#eed9ae', c2: '#c9a86a' },
  { id: 'bread', name: 'Bread', process: 'none', cook: 0, shape: 'loaf', c1: '#dfa254', c2: '#b57a30' },
  { id: 'sausage', name: 'Sausage', process: 'grill', cook: 7, shape: 'sausage', c1: '#b45a38', c2: '#83391f' },
  { id: 'steak', name: 'Steak', process: 'grill', cook: 11, shape: 'steak', c1: '#a03d2d', c2: '#6e2418' },
  { id: 'avocado', name: 'Avocado', process: 'prep', cook: 3, shape: 'avo', c1: '#8fce62', c2: '#4e8f33' },
  { id: 'greens', name: 'Greens', process: 'prep', cook: 3, shape: 'leaf', c1: '#4fae4a', c2: '#2f7d2c' },
  { id: 'pepper', name: 'Pepper', process: 'prep', cook: 4, shape: 'pepper', c1: '#57b84a', c2: '#35802a' },
  { id: 'berries', name: 'Berries', process: 'none', cook: 0, shape: 'berries', c1: '#7a4fd0', c2: '#4e2b96' },
  { id: 'cream', name: 'Cream', process: 'none', cook: 0, shape: 'swirl', c1: '#fffaf0', c2: '#e3d5ba' },
  { id: 'honey', name: 'Honey', process: 'none', cook: 0, shape: 'jar', c1: '#ffb52e', c2: '#d98a10' },
  { id: 'choco', name: 'Choco', process: 'none', cook: 0, shape: 'bar', c1: '#6e4230', c2: '#452416' },
];
export const ING = Object.fromEntries(INGREDIENTS.map((i) => [i.id, i]));

/** Drinks brewed at the drinks station; each has its own brew time. */
export const DRINKS = [
  { id: 'coffee', name: 'Coffee', process: 'brew', cook: 4, price: 4, shape: 'cup', c1: '#6e4230', c2: '#452416' },
  { id: 'juice', name: 'Berry Juice', process: 'brew', cook: 3, price: 4, shape: 'glass', c1: '#c44a7a', c2: '#8e2a54' },
  { id: 'tea', name: 'Herb Tea', process: 'brew', cook: 5, price: 4, shape: 'cup', c1: '#a8c46a', c2: '#75963c' },
];
export const DRINK = Object.fromEntries(DRINKS.map((d) => [d.id, d]));

/** The 26 recipes: an ordered list of ingredient steps and the vessel the dish is served in. */
export const RECIPES = [
  { id: 'classic-burger', name: 'Classic Burger', vessel: 'burger', steps: ['bun', 'patty', 'cheese', 'lettuce', 'tomato'] },
  { id: 'double-stack', name: 'Double Stack', vessel: 'burger', steps: ['bun', 'patty', 'cheese', 'patty', 'bacon'] },
  { id: 'garden-burger', name: 'Garden Burger', vessel: 'burger', steps: ['bun', 'lettuce', 'tomato', 'avocado', 'cheese'] },
  { id: 'tomato-soup', name: 'Tomato Soup', vessel: 'bowl', steps: ['tomato', 'broth', 'cream', 'greens'] },
  { id: 'shrimp-noodles', name: 'Shrimp Noodles', vessel: 'bowl', steps: ['noodles', 'shrimp', 'pepper', 'greens'] },
  { id: 'chicken-soup', name: 'Chicken Noodle Soup', vessel: 'bowl', steps: ['noodles', 'chicken', 'carrot', 'broth'] },
  { id: 'mushroom-rice', name: 'Mushroom Rice Bowl', vessel: 'bowl', steps: ['rice', 'mushroom', 'egg', 'greens'] },
  { id: 'steak-dinner', name: 'Steak Dinner', vessel: 'plate', steps: ['steak', 'potato', 'carrot', 'mushroom'] },
  { id: 'fish-plate', name: 'Grilled Fish Plate', vessel: 'plate', steps: ['fish', 'rice', 'greens', 'tomato'] },
  { id: 'sausage-breakfast', name: 'Sausage Breakfast', vessel: 'plate', steps: ['sausage', 'egg', 'potato', 'bread'] },
  { id: 'cheese-omelette', name: 'Cheese Omelette', vessel: 'plate', steps: ['egg', 'cheese', 'pepper', 'greens'] },
  { id: 'avocado-toast', name: 'Avocado Toast', vessel: 'board', steps: ['bread', 'avocado', 'egg', 'tomato'] },
  { id: 'blt', name: 'BLT Sandwich', vessel: 'board', steps: ['bread', 'bacon', 'lettuce', 'tomato'] },
  { id: 'berry-pancakes', name: 'Berry Pancakes', vessel: 'plate', steps: ['dough', 'berries', 'honey', 'cream'] },
  { id: 'pasta-alfredo', name: 'Pasta Alfredo', vessel: 'bowl', steps: ['pasta', 'cream', 'cheese', 'mushroom'] },
  { id: 'spicy-pasta', name: 'Spicy Pasta', vessel: 'bowl', steps: ['pasta', 'tomato', 'pepper', 'sausage'] },
  { id: 'fried-rice', name: 'Fried Rice', vessel: 'bowl', steps: ['rice', 'egg', 'carrot', 'shrimp'] },
  { id: 'chicken-rice', name: 'Chicken Rice Bowl', vessel: 'bowl', steps: ['rice', 'chicken', 'pepper', 'greens'] },
  { id: 'steak-sandwich', name: 'Steak Sandwich', vessel: 'board', steps: ['bread', 'steak', 'onion', 'cheese'] },
  { id: 'breakfast-plate', name: 'Breakfast Plate', vessel: 'plate', steps: ['egg', 'bacon', 'potato', 'tomato'] },
  { id: 'fish-basket', name: 'Fish Fry Basket', vessel: 'plate', steps: ['fish', 'potato', 'lettuce'] },
  { id: 'choco-bake', name: 'Choco Berry Bake', vessel: 'plate', steps: ['dough', 'choco', 'berries', 'cream'] },
  { id: 'garden-salad', name: 'Garden Salad', vessel: 'bowl', steps: ['greens', 'lettuce', 'tomato', 'avocado', 'onion'] },
  { id: 'carrot-soup', name: 'Carrot Soup', vessel: 'bowl', steps: ['carrot', 'broth', 'cream', 'pepper'] },
  { id: 'shrimp-plate', name: 'Shrimp Fry Plate', vessel: 'plate', steps: ['shrimp', 'rice', 'pepper', 'greens'] },
  { id: 'ladle-special', name: "Rosa's Ladle Special", vessel: 'bowl', steps: ['noodles', 'broth', 'egg', 'mushroom', 'shrimp'] },
];
export const RECIPE = Object.fromEntries(RECIPES.map((r) => [r.id, r]));

/** Recipes unlocked by the start of a day (day 1 first). */
export function unlockedRecipes(day) {
  return RECIPES.slice(0, Math.min(RECIPES.length, 6 + day * 2));
}

/** The dish of the day: one recipe per day, deterministic, paying double. */
export function dishOfTheDay(day) {
  return RECIPES[(day * 7 + 3) % RECIPES.length].id;
}

/** Customer types: patience in seconds, tip rate on the dish price, and their lines. */
export const CUSTOMERS = [
  { id: 'auntie', name: 'Auntie May', patience: 95, tip: 0.15, skin: '#f2c49b', hair: '#e8e4da', cloth: '#8a5fb0', lines: { hi: 'Just like home, dear.', wait: 'Take your time…', happy: 'Lovely, dear!', angry: 'Oh dear, too slow.' } },
  { id: 'tourist', name: 'Tourist', patience: 80, tip: 0.2, skin: '#e8b088', hair: '#5a3a22', cloth: '#3f8fbf', lines: { hi: 'I heard this place is famous!', wait: 'My tour bus…', happy: 'Worth the trip!', angry: 'The bus left without me!' } },
  { id: 'office', name: 'Office Worker', patience: 55, tip: 0.1, skin: '#f2c49b', hair: '#2e2a26', cloth: '#4a5568', lines: { hi: 'Lunch break — quick one!', wait: 'My meeting starts soon…', happy: 'Fast! Thanks!', angry: 'I am late now.' } },
  { id: 'grandpa', name: 'Grandpa Joe', patience: 110, tip: 0.12, skin: '#eec39a', hair: '#f4f1ea', cloth: '#5f7d4f', lines: { hi: 'The famous diner!', wait: 'No rush, sonny.', happy: 'Fine cooking!', angry: 'Even I am faster.' } },
  { id: 'kid', name: 'Kid', patience: 70, tip: 0.05, skin: '#f6cd9f', hair: '#8a5a2a', cloth: '#d95436', lines: { hi: 'I am starving!', wait: 'Is it ready yet?', happy: 'Yum yum yum!', angry: 'Too slowww.' } },
  { id: 'critic', name: 'Food Critic', patience: 75, tip: 0.35, skin: '#eec39a', hair: '#3a3630', cloth: '#2e2a33', lines: { hi: 'Impress me.', wait: 'I am taking notes…', happy: 'Remarkable. Truly.', angry: 'My review will show this.' } },
];
/** The named regular: returns on set days, fills a loyalty heart per serve. */
export const REGULAR = { id: 'marco', name: 'Marco', patience: 90, tip: 0.25, skin: '#d99e66', hair: '#241d18', cloth: '#b03a2e', days: [2, 4, 6, 8, 10, 12], lines: { hi: 'Rosa! My usual table.', wait: 'For you, I wait.', happy: 'You never miss, Rosa.', angry: 'Even I cannot wait forever.' } };
export const CUSTOMER = Object.fromEntries([...CUSTOMERS, REGULAR].map((c) => [c.id, c]));

/**
 * The 8 shop upgrades, each with 3 levels. `buff(level)` states the total effect at a
 * level in plain numbers; duration buffs are flat seconds shaved off cooking times.
 */
export const UPGRADES = [
  { id: 'knives', name: 'Sharp Knives', icon: 'knife', prices: [35, 70, 120], unit: 'prep', text: (l) => `Chopping −${l}s`, next: (l) => `Chopping −${l + 1}s` },
  { id: 'grillmaster', name: 'Grill Master', icon: 'flame', prices: [40, 80, 130], unit: 'grill', text: (l) => `Grilling −${l}s`, next: (l) => `Grilling −${l + 1}s` },
  { id: 'fryerpro', name: 'Fryer Pro', icon: 'fries', prices: [40, 80, 130], unit: 'fry', text: (l) => `Frying −${l}s`, next: (l) => `Frying −${l + 1}s` },
  { id: 'stoveswift', name: 'Stove Swift', icon: 'pot', prices: [40, 80, 130], unit: 'boil', text: (l) => `Boiling −${l}s`, next: (l) => `Boiling −${l + 1}s` },
  { id: 'ovenheat', name: 'Oven Heat', icon: 'oven', prices: [35, 70, 120], unit: 'bake', text: (l) => `Baking −${l}s`, next: (l) => `Baking −${l + 1}s` },
  { id: 'pantrymastery', name: 'Pantry Mastery', icon: 'star', prices: [60, 120, 200], unit: 'all', text: (l) => `All cooking −${l}s`, next: (l) => `All cooking −${l + 1}s` },
  { id: 'bigtray', name: 'Big Prep Tray', icon: 'tray', prices: [30, 60, 100], unit: 'tray', text: (l) => `Tray holds ${3 + l}`, next: (l) => `Tray holds ${3 + l + 1}` },
  { id: 'helperhands', name: 'Helper Hands', icon: 'helper', prices: [80, 140, 220], unit: 'helper', text: (l) => (l === 0 ? 'No helper yet' : `Helper stirs every ${[0, 6, 4.5, 3][l]}s`), next: (l) => `Helper stirs every ${[0, 6, 4.5, 3][l + 1]}s` },
];
export const UPGRADE = Object.fromEntries(UPGRADES.map((u) => [u.id, u]));
export const MAX_LEVEL = 3;
/** Helper stir interval in seconds by Helper Hands level (0 = no helper). */
export const HELPER_INTERVAL = [0, 6, 4.5, 3];

/** Decor: bought once, permanent small boosts, and drawn in the diner once owned. */
export const DECOR = [
  { id: 'plant', name: 'Window Plant', icon: 'plant', price: 45, text: 'Patience +6s', patience: 6, tipPct: 0 },
  { id: 'painting', name: 'Sunset Painting', icon: 'painting', price: 55, text: 'Tips +5%', patience: 0, tipPct: 0.05 },
  { id: 'lamps', name: 'Warm Lamps', icon: 'lamp', price: 65, text: 'Patience +6s', patience: 6, tipPct: 0 },
  { id: 'stools', name: 'Velvet Stools', icon: 'stool', price: 75, text: 'Tips +8%', patience: 0, tipPct: 0.08 },
];
export const DECOR_BY_ID = Object.fromEntries(DECOR.map((d) => [d.id, d]));

/** Story scenes: skippable dialogue cards (before day 1, mid-campaign, before the final day, and the win). */
export const STORY = {
  intro: [
    ['Rosa', 'Twelve days, Rosa. Twelve days to repay the loan…'],
    ['Mr. Bank', 'Or the diner is mine, madam. Sign here — no? Then cook.'],
    ['Rosa', 'Then watch me cook, Mr. Bank. This ladle has never missed.'],
  ],
  mid: [
    ['Marco', 'Halfway, Rosa! The whole street talks about your soup.'],
    ['Rosa', 'Half the loan is gone, Marco. The bank can wait its turn.'],
    ['Mr. Bank', 'Hmph. Six days left. Do not celebrate yet.'],
  ],
  final: [
    ['Mr. Bank', 'The last day. One goal between you and my diner.'],
    ['Rosa', 'Then bring your appetite, banker. Today we finish this.'],
  ],
  win: [
    ['Rosa', 'Paid. Every last coin. The Copper Ladle stays mine!'],
    ['Marco', 'I knew it the day I first tasted that soup.'],
    ['Mr. Bank', '…A remarkable kitchen, madam. Remarkable.'],
  ],
};

/** Achievement definitions: id, name, and the line shown when earned. */
export const ACHIEVEMENTS = [
  { id: 'first-serve', name: 'First Serve', icon: 'coin', text: 'Serve your first dish' },
  { id: 'perfect-10', name: 'Golden Touch', icon: 'star', text: 'Serve 10 PERFECT dishes' },
  { id: 'combo-9', name: 'Full House', icon: 'flame', text: 'Reach a ×3 combo' },
  { id: 'fever-first', name: 'Fever Pitch', icon: 'flame', text: 'Trigger FEVER mode' },
  { id: 'loyal', name: 'Loyal Friend', icon: 'heart', text: "Fill Marco's heart meter" },
  { id: 'rich', name: 'Coin Counter', icon: 'coin', text: 'Earn $500 across the campaign' },
  { id: 'stars-18', name: 'Star Collector', icon: 'star', text: 'Earn 18 stars' },
  { id: 'endless-3', name: 'Night Owl', icon: 'lamp', text: 'Reach endless wave 3' },
  { id: 'champion', name: 'Diner Saved', icon: 'painting', text: 'Win the 12-day campaign' },
];
