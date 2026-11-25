// The Copper Ladle's rules engine: pure logic on plain objects, no DOM and no canvas, so
// the same code the browser plays is the code the test suite proves. It owns cooking over
// time (Change 1), orders and payouts, the combo and FEVER, and the leveled upgrade buffs
// (Change 3) — every duration in the game comes from the single cookDuration() below.

import {
  CLICK_SHAVE_SECONDS, COMBO_MULTS, COMBO_PERFECT_STEP, COMBO_TIERS, COMBO_WINDOW,
  DAY_GOALS, DAY_SECONDS, DIFFICULTY, FEVER_COMBO, FEVER_SECONDS, GOOD_HOLD_FRACTION,
  LOYALTY_BONUS, LOYALTY_HEARTS, MIN_COOK_SECONDS, PERFECT_HOLD_FRACTION, PHONE_PAYOUT,
  PHONE_SECONDS, STAR_2, STAR_3, STATION_SLOTS, TRAY_BASE_SLOTS,
} from './config.js';
import {
  CUSTOMER, CUSTOMERS, DECOR_BY_ID, DRINK, ING, PROCESS_STATION, RECIPE, REGULAR,
  UPGRADE, dishOfTheDay, unlockedRecipes, HELPER_INTERVAL, MAX_LEVEL,
} from './data.js';

/** A small deterministic RNG (mulberry32): same seed, same service, every run. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The campaign-long state: progress, purse, upgrade levels, decor, stars, achievements. */
export function createGame(seedBase = 1) {
  return {
    seedBase,
    difficulty: 'normal',
    levels: { knives: 0, grillmaster: 0, fryerpro: 0, stoveswift: 0, ovenheat: 0, pantrymastery: 0, bigtray: 0, helperhands: 0 },
    decorOwned: {},
    stars: {},
    bestEarned: {},
    dayUnlocked: 1,
    totalEarned: 0,
    totalSpent: 0,
    repaid: 0,
    hearts: 0,
    loyaltyPaid: false,
    perfectServes: 0,
    achievements: {},
    campaignWon: false,
    endlessBest: 0,
    tutorialDone: false,
  };
}

/** Coins the player can spend in the night shop right now. */
export function purse(game) {
  return game.totalEarned - game.totalSpent;
}

/** Total stars earned across the campaign (of 36). */
export function totalStars(game) {
  return Object.values(game.stars).reduce((a, b) => a + b, 0);
}

// --------------------------------------------------------------------------- buffs

/** Which station upgrade shaves seconds off a process (Pantry Mastery shaves all). */
const PROCESS_UPGRADE = { prep: 'knives', grill: 'grillmaster', fry: 'fryerpro', boil: 'stoveswift', bake: 'ovenheat' };

/** Flat seconds shaved off a process by the current upgrade levels. */
export function flatSecondsFor(process, levels) {
  if (process === 'none') return 0;
  let flat = (levels.pantrymastery || 0) * 1;
  const up = PROCESS_UPGRADE[process];
  if (up) flat += (levels[up] || 0) * 1;
  return flat;
}

/**
 * THE single duration function. An ingredient's effective cooking time in seconds:
 * its own base time, minus the flat-second buffs, scaled by difficulty, never below
 * the 2-second floor. Ingredients that need no cooking return 0.
 */
export function cookDuration(id, levels, difficulty) {
  const src = ING[id] || DRINK[id];
  if (!src || src.cook === 0) return 0;
  const flat = flatSecondsFor(src.process, levels);
  return Math.max(MIN_COOK_SECONDS, (src.cook - flat) * DIFFICULTY[difficulty].time);
}

/** Mise en place tray capacity at the current Big Prep Tray level. */
export function traySlots(game) {
  return TRAY_BASE_SLOTS + (game.levels.bigtray || 0);
}

/** Patience bonus in seconds from owned decor. */
export function decorPatience(game) {
  return Object.keys(game.decorOwned).reduce((s, id) => s + (DECOR_BY_ID[id]?.patience || 0), 0);
}
/** Tip multiplier bonus (a fraction) from owned decor. */
export function decorTipPct(game) {
  return Object.keys(game.decorOwned).reduce((s, id) => s + (DECOR_BY_ID[id]?.tipPct || 0), 0);
}

// --------------------------------------------------------------------------- recipes & prices

/** A recipe's steps after an order variation: 'no' removes one step, 'extra' doubles one. */
export function effectiveSteps(recipe, variation) {
  const steps = [...recipe.steps];
  if (!variation) return steps;
  if (variation.kind === 'no') steps.splice(variation.index, 1);
  if (variation.kind === 'extra') steps.splice(variation.index, 0, recipe.steps[variation.index]);
  return steps;
}

/** The menu price of a dish (the dish of the day pays double, applied at serve time). */
export function dishPrice(recipe) {
  let sum = 10;
  for (const id of recipe.steps) {
    const ing = ING[id];
    sum += ing.cook > 0 ? 2.2 + ing.cook * 0.5 : 1.5;
  }
  return Math.round(sum);
}

/** Stars a day's earnings earn: 1 at the goal, 2 at 125%, 3 at 160%, else 0. */
export function starsFor(earned, goal) {
  if (earned >= goal * STAR_3) return 3;
  if (earned >= goal * STAR_2) return 2;
  if (earned >= goal) return 1;
  return 0;
}

// --------------------------------------------------------------------------- the day

let uidCounter = 1;

/** A fresh day of service (or one endless wave when opts.endless is set). */
export function createDay(game, dayNum, opts = {}) {
  const endless = !!opts.endless;
  const wave = opts.wave || 0;
  const goal = endless
    ? 260 + (wave - 1) * 140
    : Math.round(DAY_GOALS[dayNum - 1] * DIFFICULTY[game.difficulty].goal);
  return {
    num: dayNum,
    endless,
    wave,
    goal,
    dotd: dishOfTheDay(endless ? wave : dayNum),
    timeLeft: DAY_SECONDS,
    elapsed: 0,
    over: false,
    rng: mulberry32(game.seedBase * 7919 + (endless ? 100000 + wave : dayNum * 131)),
    customers: [],
    items: [],
    tray: [],
    phone: null,
    selected: null,
    combo: 0,
    comboT: 0,
    feverT: 0,
    feverArmed: true,
    earned: 0,
    served: 0,
    lost: 0,
    nextCustomerIn: 1.2,
    nextPhoneIn: 24,
    marcoSpawned: false,
    helperT: 3,
    events: [],
    popups: [],
  };
}

function emit(day, type, data = {}) {
  day.events.push({ type, ...data });
}

/** The thing a dish is being built for: a waiting customer, or the phone order. */
export function targetOf(day, id) {
  if (id === 'phone') return day.phone;
  return day.customers.find((c) => c.uid === id) || null;
}

/** Steps still to plate for a target, and the next one needed. */
export function nextStepOf(target) {
  if (!target) return null;
  return target.steps[target.dish.length] || null;
}

function spawnInterval(day) {
  if (day.endless) return Math.max(6.5, 11 - day.wave * 0.5);
  return Math.max(7, 12.5 - day.num * 0.45);
}

function makeOrder(day, game, isPhone) {
  const pool = unlockedRecipes(day.endless ? 12 : day.num);
  const recipe = pool[Math.floor(day.rng() * pool.length)];
  let variation = null;
  if (!isPhone && day.num >= 2 && recipe.steps.length >= 3 && day.rng() < 0.3) {
    variation = { kind: day.rng() < 0.5 ? 'no' : 'extra', index: Math.floor(day.rng() * recipe.steps.length) };
  }
  return {
    recipeId: recipe.id,
    steps: effectiveSteps(recipe, variation),
    variation,
    drinkId: !isPhone && day.rng() < 0.3 ? ['coffee', 'juice', 'tea'][Math.floor(day.rng() * 3)] : null,
  };
}

function spawnCustomer(day, game) {
  const seatCount = 5;
  const busy = day.customers.filter((c) => c.state === 'waiting').length;
  if (busy >= seatCount) return;
  let type = CUSTOMERS[Math.floor(day.rng() * CUSTOMERS.length)];
  if (!day.endless && REGULAR.days.includes(day.num) && !day.marcoSpawned && day.elapsed > 18) {
    type = REGULAR;
    day.marcoSpawned = true;
  }
  const order = makeOrder(day, game, false);
  const patienceMax = Math.round(type.patience * DIFFICULTY[game.difficulty].patience) + decorPatience(game);
  const customer = {
    uid: uidCounter++,
    typeId: type.id,
    order,
    steps: order.steps,
    dish: [],
    dishQuality: [],
    drinkServed: false,
    patience: patienceMax,
    patienceMax,
    state: 'waiting',
    bubbleT: 2 + day.rng() * 3,
    mood: 'hi',
  };
  day.customers.push(customer);
  emit(day, 'arrive', { uid: customer.uid });
  if (!day.selected) day.selected = customer.uid;
}

function spawnPhone(day, game) {
  const order = makeOrder(day, game, true);
  day.phone = {
    recipeId: order.recipeId,
    steps: order.steps,
    dish: [],
    dishQuality: [],
    timeLeft: PHONE_SECONDS,
    payout: PHONE_PAYOUT,
  };
  emit(day, 'phone-ring');
}

// --------------------------------------------------------------------------- cooking actions

/** Items currently on a station. */
export function stationItems(day, station) {
  return day.items.filter((i) => i.station === station);
}

/**
 * Put an ingredient (or drink) on its station to cook. It cooks passively from this
 * moment — no clicks required. Returns the item, or null when the station is full or
 * the ingredient needs no cooking (those go straight onto a dish with addDirect).
 */
export function startCook(day, game, id) {
  const src = ING[id] || DRINK[id];
  if (!src || src.process === 'none') return null;
  const station = PROCESS_STATION[src.process];
  if (stationItems(day, station).length >= STATION_SLOTS[station]) {
    emit(day, 'denied');
    return null;
  }
  const item = {
    uid: uidCounter++,
    id,
    station,
    elapsed: 0,
    duration: cookDuration(id, game.levels, game.difficulty),
    pinged: false,
  };
  day.items.push(item);
  emit(day, 'place', { uid: item.uid, station });
  return item;
}

/** Doneness of a cooking item, 0–100. */
export function itemDoneness(item) {
  if (item.duration <= 0) return 100;
  return Math.min(100, (item.elapsed / item.duration) * 100);
}

/**
 * An item's quality right now: 'raw'/'cooking' while it cooks; once done it holds
 * 'perfect' for 40% of its cook duration, then 'good', then 'plain'. Never 'burnt'.
 */
export function itemQuality(item) {
  if (item.elapsed < item.duration) return itemDoneness(item) < 50 ? 'raw' : 'cooking';
  const over = item.elapsed - item.duration;
  if (over <= PERFECT_HOLD_FRACTION * item.duration) return 'perfect';
  if (over <= GOOD_HOLD_FRACTION * item.duration) return 'good';
  return 'plain';
}

/** Clicking a cooking item flips/stirs it: a small optional shave off its remaining time. */
export function clickItem(day, uid) {
  const item = day.items.find((i) => i.uid === uid);
  if (!item) return false;
  const wasDone = item.elapsed >= item.duration;
  item.elapsed += CLICK_SHAVE_SECONDS;
  if (!wasDone && item.elapsed >= item.duration && !item.pinged) {
    item.pinged = true;
    emit(day, 'perfect-enter', { uid });
  }
  emit(day, 'flip', { uid, station: item.station });
  return true;
}

function removeItem(day, item) {
  day.items = day.items.filter((i) => i !== item);
}

/** Add a no-cooking ingredient straight onto the selected target's dish, if it is next. */
export function addDirect(day, ingId) {
  const target = targetOf(day, day.selected);
  if (!target || ING[ingId]?.process !== 'none') return false;
  if (nextStepOf(target) !== ingId) {
    emit(day, 'denied');
    return false;
  }
  target.dish.push(ingId);
  target.dishQuality.push('none');
  emit(day, 'plate', { ing: ingId });
  return true;
}

/**
 * Click a finished cooking item: a drink attaches to the selected customer's order;
 * an ingredient plates onto the selected dish when it is the next step, and otherwise
 * waits in the mise en place tray. Unfinished items are flipped instead (see clickItem).
 */
export function tapItem(day, game, uid) {
  const item = day.items.find((i) => i.uid === uid);
  if (!item) return false;
  if (item.elapsed < item.duration) return clickItem(day, uid);
  const quality = itemQuality(item);
  if (DRINK[item.id]) return attachDrink(day, item);
  const target = targetOf(day, day.selected);
  if (target && nextStepOf(target) === item.id) {
    target.dish.push(item.id);
    target.dishQuality.push(quality);
    removeItem(day, item);
    emit(day, 'plate', { ing: item.id, quality });
    return true;
  }
  if (day.tray.length < traySlots(game)) {
    day.tray.push({ id: item.id, quality });
    removeItem(day, item);
    emit(day, 'tray', { ing: item.id });
    return true;
  }
  emit(day, 'denied');
  return false;
}

/** Attach a finished drink to the selected customer's order (pays at once), or, when
 *  served alone to a waiting customer who did not order it, as a patience boost. */
export function attachDrink(day, item) {
  const target = targetOf(day, day.selected);
  if (target && target.order && target.state === 'waiting') {
    if (target.order.drinkId === item.id && !target.drinkServed) {
      target.drinkServed = true;
      day.earned += DRINK[item.id].price;
      removeItem(day, item);
      emit(day, 'drink', { amount: DRINK[item.id].price });
      return true;
    }
    if (!target.order.drinkId) {
      target.patience = Math.min(target.patienceMax, target.patience + target.patienceMax * 0.2);
      removeItem(day, item);
      emit(day, 'drink-boost');
      return true;
    }
  }
  emit(day, 'denied');
  return false;
}

/** Plate a tray item onto the selected dish when it is the next step. */
export function useTray(day, index) {
  const entry = day.tray[index];
  const target = targetOf(day, day.selected);
  if (!entry || !target) return false;
  if (nextStepOf(target) !== entry.id) {
    emit(day, 'denied');
    return false;
  }
  target.dish.push(entry.id);
  target.dishQuality.push(entry.quality);
  day.tray.splice(index, 1);
  emit(day, 'plate', { ing: entry.id, quality: entry.quality });
  return true;
}

/** Throw a cooking item away — the only way food ever leaves by neglect of quality. */
export function trashItem(day, uid) {
  const item = day.items.find((i) => i.uid === uid);
  if (!item) return false;
  removeItem(day, item);
  emit(day, 'trash');
  return true;
}

/** The payout multiplier the current combo earns. */
export function comboMult(day) {
  let mult = 1;
  COMBO_TIERS.forEach((tier, i) => {
    if (day.combo >= tier) mult = COMBO_MULTS[i];
  });
  return mult;
}

/** Dish quality multiplier from its plated steps, and whether the serve is PERFECT. */
export function dishQualityOf(target) {
  let mult = 1;
  let cooked = 0;
  let allPerfect = true;
  target.dishQuality.forEach((q) => {
    if (q === 'none') return;
    cooked += 1;
    if (q === 'perfect') mult = Math.min(mult, 1.15);
    else if (q === 'good') mult = Math.min(mult, 1);
    else { mult = Math.min(mult, 0.85); allPerfect = false; }
    if (q !== 'perfect') allPerfect = false;
  });
  return { mult: cooked === 0 ? 1 : mult, perfect: cooked > 0 && allPerfect };
}

function growCombo(day, game, perfect) {
  day.combo += perfect ? COMBO_PERFECT_STEP : 1;
  day.comboT = COMBO_WINDOW;
  if (day.combo >= COMBO_TIERS[2]) award(game, day, 'combo-9');
  if (day.combo >= FEVER_COMBO && day.feverT <= 0 && day.feverArmed) {
    day.feverT = FEVER_SECONDS;
    day.feverArmed = false;
    emit(day, 'fever');
    award(game, day, 'fever-first');
  }
}

function award(game, day, id) {
  if (game.achievements[id]) return;
  game.achievements[id] = true;
  emit(day, 'achievement', { id });
}

/** Serve the selected customer's completed dish. Pays price × quality × combo × FEVER, plus tip. */
export function serveDish(day, game) {
  const c = targetOf(day, day.selected);
  if (!c || !c.order || c.state !== 'waiting') return false;
  if (c.dish.length < c.steps.length) {
    emit(day, 'denied');
    return false;
  }
  const recipe = RECIPE[c.order.recipeId];
  const { mult, perfect } = dishQualityOf(c);
  let price = dishPrice(recipe);
  if (c.order.recipeId === day.dotd) price *= 2;
  const base = price * mult * comboMult(day) * (day.feverT > 0 ? 2 : 1);
  const patienceFrac = c.patience / c.patienceMax;
  let tip = price * CUSTOMER[c.typeId].tip * (patienceFrac >= 0.5 ? 1 : 0.4) * (1 + decorTipPct(game));
  if (perfect) tip += 2;
  const total = Math.round(base) + Math.round(tip);
  day.earned += total;
  day.served += 1;
  c.state = 'served';
  c.mood = 'happy';
  if (perfect) {
    game.perfectServes += 1;
    if (game.perfectServes >= 10) award(game, day, 'perfect-10');
  }
  award(game, day, 'first-serve');
  if (c.typeId === 'marco') {
    game.hearts = Math.min(LOYALTY_HEARTS, game.hearts + 1);
    if (game.hearts >= LOYALTY_HEARTS && !game.loyaltyPaid) {
      game.loyaltyPaid = true;
      day.earned += LOYALTY_BONUS;
      emit(day, 'loyalty', { amount: LOYALTY_BONUS });
      award(game, day, 'loyal');
    }
  }
  emit(day, 'serve', { amount: total, perfect, uid: c.uid });
  day.popups.push({ text: `+$${total}${perfect ? ' PERFECT!' : ''}`, uid: c.uid, t: 1.6 });
  growCombo(day, game, perfect);
  day.selected = null;
  return true;
}

/** Serve the phone order's completed dish to the phone panel for its flat payout. */
export function servePhone(day, game) {
  const p = day.phone;
  if (!p || p.dish.length < p.steps.length) {
    emit(day, 'denied');
    return false;
  }
  const amount = p.payout * (day.feverT > 0 ? 2 : 1);
  day.earned += amount;
  day.served += 1;
  emit(day, 'serve-phone', { amount });
  day.popups.push({ text: `+$${amount}`, uid: 'phone', t: 1.6 });
  growCombo(day, game, false);
  day.phone = null;
  day.selected = null;
  return true;
}

// --------------------------------------------------------------------------- the shop

/** Buy the next level of an upgrade. Returns true when the purchase happened. */
export function buyUpgrade(game, id) {
  const up = UPGRADE[id];
  const level = game.levels[id] || 0;
  if (!up || level >= MAX_LEVEL) return false;
  const price = up.prices[level];
  if (purse(game) < price) return false;
  game.totalSpent += price;
  game.levels[id] = level + 1;
  return true;
}

/** Buy a decor piece (once). Returns true when the purchase happened. */
export function buyDecor(game, id) {
  const decor = DECOR_BY_ID[id];
  if (!decor || game.decorOwned[id]) return false;
  if (purse(game) < decor.price) return false;
  game.totalSpent += decor.price;
  game.decorOwned[id] = true;
  return true;
}

// --------------------------------------------------------------------------- time

/** Advance the day by dt seconds: cooking, patience, spawns, combo, FEVER, the helper. */
export function tick(day, game, dt) {
  if (day.over) return;
  day.elapsed += dt;
  day.timeLeft = Math.max(0, DAY_SECONDS - day.elapsed);

  // Spawns.
  day.nextCustomerIn -= dt;
  if (day.nextCustomerIn <= 0) {
    spawnCustomer(day, game);
    day.nextCustomerIn = spawnInterval(day) * (0.75 + day.rng() * 0.5);
  }
  day.nextPhoneIn -= dt;
  if (day.nextPhoneIn <= 0) {
    if (!day.phone) spawnPhone(day, game);
    day.nextPhoneIn = 38 + day.rng() * 14;
  }

  // Cooking: passive, twice as fast in FEVER.
  const speed = day.feverT > 0 ? 2 : 1;
  for (const item of day.items) {
    const was = item.elapsed;
    item.elapsed += dt * speed;
    if (was < item.duration && item.elapsed >= item.duration && !item.pinged) {
      item.pinged = true;
      emit(day, 'perfect-enter', { uid: item.uid });
    }
  }

  // The helper stirs the slowest cooking item on his interval.
  const interval = HELPER_INTERVAL[game.levels.helperhands || 0];
  if (interval > 0) {
    day.helperT -= dt;
    if (day.helperT <= 0) {
      day.helperT = interval;
      const cooking = day.items.filter((i) => i.elapsed < i.duration);
      if (cooking.length) {
        cooking.sort((a, b) => a.elapsed / a.duration - b.elapsed / b.duration);
        cooking[0].elapsed += 1;
        emit(day, 'helper', { uid: cooking[0].uid });
      }
    }
  }

  // Patience and walkouts.
  for (const c of day.customers) {
    if (c.state !== 'waiting') continue;
    c.patience -= dt;
    c.bubbleT -= dt;
    if (c.bubbleT <= 0) {
      c.bubbleT = 4 + day.rng() * 4;
      c.mood = c.patience / c.patienceMax > 0.45 ? 'hi' : 'wait';
    }
    if (c.patience <= 0) {
      c.state = 'left';
      c.mood = 'angry';
      day.lost += 1;
      day.combo = 0;
      day.comboT = 0;
      day.feverArmed = true;
      emit(day, 'walkout', { uid: c.uid });
      if (day.selected === c.uid) day.selected = null;
    }
  }
  // Served and departed customers linger briefly (a wave, a popup), then leave the scene.
  for (const c of day.customers) {
    if (c.state !== 'waiting') c.goneT = (c.goneT ?? 1.4) - dt;
  }
  day.customers = day.customers.filter((c) => c.state === 'waiting' || (c.goneT ?? 1) > 0);

  // Phone countdown: expiry costs nothing but the opportunity.
  if (day.phone) {
    day.phone.timeLeft -= dt;
    if (day.phone.timeLeft <= 0) {
      day.phone = null;
      if (day.selected === 'phone') day.selected = null;
      emit(day, 'phone-expire');
    }
  }

  // Combo and FEVER timers.
  if (day.comboT > 0) {
    day.comboT -= dt;
    if (day.comboT <= 0 && day.combo > 0) {
      day.combo = 0;
      emit(day, 'combo-break');
    }
  }
  if (day.combo < FEVER_COMBO) day.feverArmed = true;
  if (day.feverT > 0) day.feverT = Math.max(0, day.feverT - dt);

  // Popups age.
  for (const p of day.popups) p.t -= dt;
  day.popups = day.popups.filter((p) => p.t > 0);

  if (day.timeLeft <= 0) day.over = true;
}

/** Settle a finished day into the campaign: stars, purse, loan, unlocks, achievements. */
export function finishDay(game, day) {
  const stars = starsFor(day.earned, day.goal);
  game.totalEarned += day.earned;
  game.repaid = Math.min(5450, game.repaid + day.earned);
  if (game.totalEarned >= 500) award(game, day, 'rich');
  if (day.endless) {
    if (stars > 0) {
      game.endlessBest = Math.max(game.endlessBest, day.wave);
      if (day.wave >= 3) award(game, day, 'endless-3');
    }
    return { stars, won: stars > 0 };
  }
  const key = day.num;
  if (stars > (game.stars[key] || 0)) game.stars[key] = stars;
  game.bestEarned[key] = Math.max(game.bestEarned[key] || 0, day.earned);
  const won = stars > 0;
  if (won) {
    game.dayUnlocked = Math.max(game.dayUnlocked, Math.min(12, day.num + 1));
    if (day.num === 12) {
      game.campaignWon = true;
      award(game, day, 'champion');
    }
  }
  if (totalStars(game) >= 18) award(game, day, 'stars-18');
  return { stars, won };
}
