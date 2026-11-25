// Logic tests for The Copper Ladle: Golden Hour. Run with `node tests/logic.test.mjs`.
// They import the game's own modules (game/src/) and prove the design's promises:
// per-ingredient passive cooking times, the PERFECT hold with no burning, exact upgrade
// buff math, the dish–ingredient sync rule for every recipe and variation, and two
// simulated players — one who never clicks a cooking item, one who does — each winning
// all 12 days on Normal.

import {
  COMBO_WINDOW, DAY_GOALS, FEVER_SECONDS, LOYALTY_BONUS, PHONE_PAYOUT,
} from '../game/src/config.js';
import {
  CUSTOMER, DRINK, ING, INGREDIENTS, RECIPES, RECIPE, REGULAR, UPGRADE,
} from '../game/src/data.js';
import {
  addDirect, attachDrink, buyDecor, buyUpgrade, comboMult, cookDuration, createDay,
  createGame, dishPrice, effectiveSteps, finishDay, flatSecondsFor, itemDoneness,
  itemQuality, nextStepOf, purse, serveDish, servePhone, starsFor, startCook, tapItem,
  targetOf, tick, trashItem, traySlots, useTray,
} from '../game/src/engine.js';

let passed = 0;
let failed = 0;
function ok(cond, label) {
  if (cond) { passed += 1; return; }
  failed += 1;
  console.error(`FAIL: ${label}`);
}
function eq(a, b, label) { ok(a === b, `${label} (got ${a}, want ${b})`); }
function close(a, b, label) { ok(Math.abs(a - b) < 1e-9, `${label} (got ${a}, want ${b})`); }

const NO_LEVELS = { knives: 0, grillmaster: 0, fryerpro: 0, stoveswift: 0, ovenheat: 0, pantrymastery: 0, bigtray: 0, helperhands: 0 };
function levels(patch) { return { ...NO_LEVELS, ...patch }; }

/** Push a hand-made waiting customer with a chosen order onto a day. */
function forceCustomer(day, game, typeId, recipeId, opts = {}) {
  const type = CUSTOMER[typeId];
  const recipe = RECIPE[recipeId];
  const steps = effectiveSteps(recipe, opts.variation || null);
  const c = {
    uid: 9000 + day.customers.length + Math.floor(Math.random() * 0),
    typeId,
    order: { recipeId, steps, variation: opts.variation || null, drinkId: opts.drinkId || null },
    steps,
    dish: [],
    dishQuality: [],
    drinkServed: false,
    patience: type.patience,
    patienceMax: type.patience,
    state: 'waiting',
    bubbleT: 3,
    mood: 'hi',
  };
  c.uid = 50000 + forceCustomer.n++;
  day.customers.push(c);
  return c;
}
forceCustomer.n = 0;

/** Cook one step fully (passive time only) and plate it onto the target. */
function cookAndPlate(day, game, targetId, ingId) {
  const item = startCook(day, game, ingId);
  if (!item) return false;
  let guard = 0;
  while (item.elapsed < item.duration && guard++ < 200) tick(day, game, 0.5);
  day.selected = targetId;
  return tapItem(day, game, item.uid);
}

/** Build a target's whole dish, step by step, with passive cooking only. */
function completeDish(day, game, targetId) {
  const target = targetOf(day, targetId);
  let guard = 0;
  while (target && target.dish.length < target.steps.length && guard++ < 300) {
    const next = nextStepOf(target);
    if (ING[next].process === 'none') {
      day.selected = targetId;
      if (!addDirect(day, next)) return false;
      continue;
    }
    const ti = day.tray.findIndex((t) => t.id === next);
    if (ti >= 0) {
      day.selected = targetId;
      if (!useTray(day, ti)) return false;
      continue;
    }
    if (!cookAndPlate(day, game, targetId, next)) return false;
  }
  return target && target.dish.length === target.steps.length;
}

// ---------------------------------------------------------- cook-time table (Change 1)
{
  const cooked = INGREDIENTS.filter((i) => i.cook > 0);
  const times = cooked.map((i) => i.cook);
  eq(Math.min(...times), 3, 'fastest ingredient cooks in 3s');
  eq(Math.max(...times), 11, 'slowest ingredient (steak) cooks in 11s');
  ok(times.every((t) => t >= 3 && t <= 12), 'every cook time lies in 3–12s');
  ok(new Set(times).size >= 6, 'cook times are varied, not one flat number');
  eq(INGREDIENTS.length, 29, '29 pantry ingredients');
  eq(RECIPES.length, 26, '26 recipes');
}

// ---------------------------------------------------------- duration + buff math (Changes 1 & 3)
{
  eq(cookDuration('steak', NO_LEVELS, 'normal'), 11, 'steak base duration is its own 11s');
  eq(cookDuration('egg', NO_LEVELS, 'normal'), 3, 'egg base duration is its own 3s');
  eq(cookDuration('bun', NO_LEVELS, 'normal'), 0, 'no-cook ingredients take 0s');
  eq(cookDuration('patty', levels({ pantrymastery: 1 }), 'normal'), 7, 'Pantry Mastery Lv1 shaves exactly 1s off everything');
  eq(cookDuration('patty', levels({ pantrymastery: 1, grillmaster: 1 }), 'normal'), 6, 'station + pantry buffs stack to exactly 2s off');
  eq(cookDuration('lettuce', levels({ knives: 1 }), 'normal'), 2, 'Sharp Knives Lv1: lettuce 3s → 2s');
  eq(cookDuration('egg', levels({ fryerpro: 3, pantrymastery: 3 }), 'normal'), 2, 'the 2s floor holds under 6s of buffs');
  eq(cookDuration('noodles', levels({ stoveswift: 2 }), 'normal'), 5, 'Stove Swift Lv2: noodles 7s → 5s');
  close(cookDuration('patty', NO_LEVELS, 'relaxed'), 8 * 0.85, 'Relaxed scales durations by 0.85 through the same function');
  eq(flatSecondsFor('brew', levels({ pantrymastery: 2 })), 2, 'drinks get the pantry buff only');
  eq(flatSecondsFor('none', levels({ pantrymastery: 3 })), 0, 'no-cook ingredients are never buffed');
}

// ---------------------------------------------------------- passive cooking + quality (Change 1)
{
  const game = createGame(42);
  const day = createDay(game, 1);
  const egg = startCook(day, game, 'egg');
  ok(egg, 'egg placed on the fryer');
  eq(egg.duration, 3, 'egg duration is 3s');
  tick(day, game, 1.5);
  eq(itemDoneness(egg), 50, 'halfway at half its time, with zero clicks');
  eq(itemQuality(egg), 'cooking', 'still cooking at 50%');
  tick(day, game, 1.5);
  eq(itemDoneness(egg), 100, 'done at exactly its 3s, with zero clicks');
  eq(itemQuality(egg), 'perfect', 'freshly done is PERFECT');
  tick(day, game, 1.2);
  eq(itemQuality(egg), 'perfect', 'PERFECT holds for 40% of the cook time after done');
  tick(day, game, 0.1);
  eq(itemQuality(egg), 'good', 'then steps down to good');
  tick(day, game, 100000);
  eq(itemQuality(egg), 'plain', 'ages to plain — and never burns');
  ok(day.items.includes(egg), 'an ancient item is still there: no removal by neglect');
  ok(trashItem(day, egg.uid), 'only the Trash button discards it');
  ok(!day.items.includes(egg), 'trashed item is gone');
}
{
  // Clicking is a small optional shave, exactly 0.6s.
  const game = createGame(43);
  const day = createDay(game, 1);
  const steak = startCook(day, game, 'steak');
  tapItem(day, game, steak.uid); // a tap on a cooking item flips it
  close(steak.elapsed, 0.6, 'one click shaves exactly 0.6s');
}

// ---------------------------------------------------------- dish–ingredient sync (hard rule)
{
  const multiset = (arr) => arr.slice().sort().join(',');
  for (const recipe of RECIPES) {
    eq(multiset(effectiveSteps(recipe, null)), multiset(recipe.steps), `${recipe.id}: plain steps match the recipe`);
    recipe.steps.forEach((ing, index) => {
      const no = effectiveSteps(recipe, { kind: 'no', index });
      const wantNo = recipe.steps.filter((_, i) => i !== index);
      eq(multiset(no), multiset(wantNo), `${recipe.id}: 'no ${ing}' removes exactly that layer`);
      const extra = effectiveSteps(recipe, { kind: 'extra', index });
      eq(extra.length, recipe.steps.length + 1, `${recipe.id}: 'extra ${ing}' adds exactly one layer`);
      eq(extra.filter((x) => x === ing).length, recipe.steps.filter((x) => x === ing).length + 1, `${recipe.id}: 'extra ${ing}' doubles exactly that layer`);
      ok(extra.every((x) => recipe.steps.includes(x)), `${recipe.id}: variation never invents an ingredient`);
    });
  }
  // And a full simulated build of every recipe plates exactly its defined layers.
  for (const recipe of RECIPES) {
    const game = createGame(7);
    const day = createDay(game, 12);
    const c = forceCustomer(day, game, 'grandpa', recipe.id);
    ok(completeDish(day, game, c.uid), `${recipe.id}: builds to completion`);
    eq(c.dish.join(','), recipe.steps.join(','), `${recipe.id}: plated layers are exactly the recipe, in order`);
  }
}

// ---------------------------------------------------------- combo, FEVER, payouts
{
  const g = createGame(5);
  const d = createDay(g, 1);
  const mults = [0, 1, 2, 3, 5, 6, 8, 9, 12].map((n) => { d.combo = n; return comboMult(d); });
  eq(mults.join(','), '1,1,1,1.5,1.5,2,2,3,3', 'combo multiplier tiers at 3/6/9');
}
function servedTotal(fever) {
  const game = createGame(9);
  const day = createDay(game, 3);
  const c = forceCustomer(day, game, 'auntie', 'classic-burger');
  c.dish = [...c.steps];
  c.dishQuality = c.steps.map(() => 'good');
  day.selected = c.uid;
  if (fever) day.feverT = 10;
  const before = day.earned;
  serveDish(day, game);
  return day.earned - before;
}
{
  const price = dishPrice(RECIPE['classic-burger']);
  const tip = Math.round(price * CUSTOMER.auntie.tip);
  eq(servedTotal(false), Math.round(price * 1) + tip, 'plain serve pays price + tip');
  eq(servedTotal(true), Math.round(price * 2) + tip, 'FEVER serve pays double the price part');
  const game = createGame(11);
  const day = createDay(game, 3);
  const c = forceCustomer(day, game, 'auntie', dishOfDotdRecipe(day));
  function dishOfDotdRecipe(d) { return d.dotd; }
  c.dish = [...c.steps];
  c.dishQuality = c.steps.map(() => 'good');
  day.selected = c.uid;
  const before = day.earned;
  serveDish(day, game);
  const dotdPrice = dishPrice(RECIPE[day.dotd]) * 2;
  eq(day.earned - before, Math.round(dotdPrice) + Math.round(dotdPrice * CUSTOMER.auntie.tip), 'dish of the day pays double');
}
{
  // Combo grows 1 per serve, 2 per PERFECT serve; FEVER fires at 8; the window breaks it.
  const game = createGame(13);
  const day = createDay(game, 3);
  const serveOne = (perfect) => {
    const c = forceCustomer(day, game, 'tourist', 'blt');
    c.dish = [...c.steps];
    c.dishQuality = c.steps.map(() => (perfect ? 'perfect' : 'good'));
    day.selected = c.uid;
    serveDish(day, game);
  };
  serveOne(false);
  eq(day.combo, 1, 'combo grows by 1 per serve');
  serveOne(true);
  eq(day.combo, 3, 'a PERFECT serve grows the combo by 2');
  serveOne(true); serveOne(true);
  eq(day.combo, 7, 'combo at 7 after two more perfect serves');
  serveOne(true);
  ok(day.feverT > 0, 'FEVER starts when the combo reaches 8+');
  close(day.feverT, FEVER_SECONDS, 'FEVER lasts its full 20s');
  day.feverT = 0;
  tick(day, game, COMBO_WINDOW + 0.5);
  eq(day.combo, 0, 'combo breaks when its window lapses');
  ok(day.events.some((e) => e.type === 'combo-break'), 'combo break is announced');
}
{
  // FEVER doubles cooking speed.
  const game = createGame(15);
  const day = createDay(game, 1);
  const steak = startCook(day, game, 'steak');
  day.feverT = 10;
  tick(day, game, 2);
  close(steak.elapsed, 4, 'in FEVER an item cooks twice as fast');
}
{
  // A walkout breaks the combo.
  const game = createGame(17);
  const day = createDay(game, 1);
  day.combo = 5;
  const c = forceCustomer(day, game, 'office', 'blt');
  c.patience = 0.2;
  tick(day, game, 0.5);
  eq(c.state, 'left', 'an out-of-patience customer walks out');
  eq(day.combo, 0, 'a walkout breaks the combo');
}

// ---------------------------------------------------------- variations, drinks, tray, phone
{
  const game = createGame(19);
  const day = createDay(game, 4);
  const c = forceCustomer(day, game, 'kid', 'classic-burger', { variation: { kind: 'no', index: 2 } });
  eq(c.steps.length, 4, "'no cheese' order has one fewer step");
  ok(completeDish(day, game, c.uid), 'varied dish builds');
  day.selected = c.uid;
  ok(serveDish(day, game), 'varied dish serves and scores');
}
{
  const game = createGame(21);
  const day = createDay(game, 2);
  const c = forceCustomer(day, game, 'tourist', 'blt', { drinkId: 'coffee' });
  const coffee = startCook(day, game, 'coffee');
  let guard = 0;
  while (coffee.elapsed < coffee.duration && guard++ < 60) tick(day, game, 0.5);
  day.selected = c.uid;
  const before = day.earned;
  ok(tapItem(day, game, coffee.uid), 'finished drink attaches to its order');
  eq(day.earned - before, DRINK.coffee.price, 'the drink pays its price');
  ok(c.drinkServed, 'drink marked served');
  const c2 = forceCustomer(day, game, 'auntie', 'blt');
  const juice = startCook(day, game, 'juice');
  guard = 0;
  while (juice.elapsed < juice.duration && guard++ < 60) tick(day, game, 0.5);
  day.selected = c2.uid;
  const pMax = c2.patienceMax;
  c2.patience = pMax * 0.5;
  ok(tapItem(day, game, juice.uid), 'a drink served alone still lands');
  close(c2.patience, pMax * 0.7, 'a lone drink boosts patience by 20% of max');
}
{
  const game = createGame(23);
  const day = createDay(game, 2);
  const c = forceCustomer(day, game, 'auntie', 'tomato-soup');
  day.selected = c.uid;
  const shrimp = startCook(day, game, 'shrimp'); // not in this order at all
  let guard = 0;
  while (shrimp.elapsed < shrimp.duration && guard++ < 60) tick(day, game, 0.5);
  ok(tapItem(day, game, shrimp.uid), 'an unneeded finished item is accepted…');
  eq(day.tray.length, 1, '…into the mise en place tray');
  eq(traySlots(game), 3, 'tray holds 3 at level 0');
  const c2 = forceCustomer(day, game, 'kid', 'shrimp-plate');
  day.selected = c2.uid;
  ok(useTray(day, 0), 'the tray item plates when its dish needs it');
  eq(c2.dish[0], 'shrimp', 'tray item became the dish layer');
}
{
  const game = createGame(25);
  const day = createDay(game, 2);
  day.nextPhoneIn = 0.01;
  tick(day, game, 0.1);
  ok(day.phone, 'a phone order rings in');
  ok(completeDish(day, game, 'phone'), 'the phone dish builds');
  const before = day.earned;
  day.selected = 'phone';
  ok(servePhone(day, game), 'the phone order serves to the panel');
  eq(day.earned - before, PHONE_PAYOUT, 'the phone pays its flat $26');
  day.nextPhoneIn = 0.01;
  tick(day, game, 0.1);
  const earnedNow = day.earned;
  day.phone.timeLeft = 0.05;
  tick(day, game, 0.2);
  eq(day.phone, null, 'an expired phone order vanishes');
  eq(day.earned, earnedNow, 'expiry costs nothing');
}

// ---------------------------------------------------------- helper, decor, upgrades (Change 3)
{
  const game = createGame(27);
  game.levels.helperhands = 1;
  const day = createDay(game, 1);
  const steak = startCook(day, game, 'steak');
  tick(day, game, 6);
  close(steak.elapsed, 7, 'the helper stirs the slowest item once in 6s (+1s)');
  const game0 = createGame(27);
  const day0 = createDay(game0, 1);
  const steak0 = startCook(day0, game0, 'steak');
  tick(day0, game0, 6);
  close(steak0.elapsed, 6, 'with no helper hired there is no stir');
}
{
  const game = createGame(29);
  game.totalEarned = 1000;
  eq(purse(game), 1000, 'purse starts as earnings');
  ok(buyUpgrade(game, 'knives'), 'buy Sharp Knives Lv1');
  eq(game.levels.knives, 1, 'level recorded');
  eq(purse(game), 1000 - 35, 'Lv1 price charged');
  eq(cookDuration('lettuce', game.levels, 'normal'), 2, 'the bought level changes durations at once');
  ok(buyUpgrade(game, 'knives') && buyUpgrade(game, 'knives'), 'buy Lv2 and Lv3');
  eq(purse(game), 1000 - 35 - 70 - 120, 'prices rise per level: 35, 70, 120');
  ok(!buyUpgrade(game, 'knives'), 'max level cannot be exceeded');
  ok(buyDecor(game, 'plant'), 'buy the window plant');
  const day = createDay(game, 1);
  day.nextCustomerIn = 0.01;
  tick(day, game, 0.1);
  const c = day.customers[0];
  eq(c.patienceMax, CUSTOMER[c.typeId].patience + 6, 'owned decor adds its patience seconds');
  ok(!buyDecor(game, 'plant'), 'decor is bought only once');
  for (const up of Object.values(UPGRADE)) {
    ok(up.prices.length >= 3, `${up.id} has at least 3 priced levels`);
  }
}

// ---------------------------------------------------------- stars, unlocks, endless, difficulty
{
  eq(starsFor(320, 200), 3, '160% of goal earns 3 stars');
  eq(starsFor(250, 200), 2, '125% of goal earns 2 stars');
  eq(starsFor(200, 200), 1, 'the goal itself earns 1 star');
  eq(starsFor(199, 200), 0, 'under the goal earns none');
  const game = createGame(31);
  const day = createDay(game, 1);
  day.earned = DAY_GOALS[0];
  const res = finishDay(game, day);
  ok(res.won && game.dayUnlocked === 2, 'winning day 1 unlocks day 2');
  eq(game.stars[1], 1, 'the star is recorded');
  const replay = createDay(game, 1);
  replay.earned = 10;
  finishDay(game, replay);
  eq(game.stars[1], 1, 'replaying worse never lowers the best stars');
  const endless = createDay(game, 12, { endless: true, wave: 3 });
  eq(endless.goal, 260 + 2 * 140, 'endless wave goals escalate');
  endless.earned = endless.goal;
  finishDay(game, endless);
  eq(game.endlessBest, 3, 'the best endless wave is recorded');
  ok(game.achievements['endless-3'], 'wave 3 earns its achievement');
  const relaxed = createGame(33);
  relaxed.difficulty = 'relaxed';
  eq(createDay(relaxed, 1).goal, Math.round(DAY_GOALS[0] * 0.8), 'Relaxed lowers day goals to 80%');
}

// ---------------------------------------------------------- Marco's loyalty
{
  const game = createGame(35);
  let bonusSeen = 0;
  for (const dayNum of REGULAR.days.slice(0, 5)) {
    const day = createDay(game, dayNum);
    let marco = null;
    let guard = 0;
    while (!marco && guard++ < 400) {
      tick(day, game, 0.5);
      marco = day.customers.find((c) => c.typeId === 'marco' && c.state === 'waiting') || null;
    }
    ok(marco, `Marco visits on day ${dayNum}`);
    if (!marco) continue;
    ok(completeDish(day, game, marco.uid), `Marco's dish builds on day ${dayNum}`);
    day.selected = marco.uid;
    const before = day.earned;
    serveDish(day, game);
    if (day.events.some((e) => e.type === 'loyalty')) bonusSeen = day.earned - before;
  }
  eq(game.hearts, 5, 'five serves fill the heart meter');
  ok(game.loyaltyPaid, 'the loyalty bonus is paid once');
  ok(bonusSeen >= LOYALTY_BONUS, 'the fifth serve carries the $150 bonus');
  ok(game.achievements.loyal, 'the Loyal Friend achievement is earned');
}

// ---------------------------------------------------------- simulated players
/** A bot that plays a whole day through the engine's public actions only. */
function botAct(day, game, clicks) {
  const targets = [
    ...day.customers.filter((c) => c.state === 'waiting'),
    ...(day.phone ? [{ uid: 'phone', steps: day.phone.steps, dish: day.phone.dish }] : []),
  ];
  const tgt = (t) => targetOf(day, t.uid);
  // Serve anything complete; attach ready drinks.
  for (const t of targets) {
    const real = tgt(t);
    if (!real) continue;
    if (real.dish.length >= real.steps.length) {
      day.selected = t.uid;
      if (t.uid === 'phone') servePhone(day, game);
      else serveDish(day, game);
    }
  }
  for (const t of targets) {
    const real = tgt(t);
    if (!real || real.state === 'left' || real.state === 'served') continue;
    if (real.order?.drinkId && !real.drinkServed) {
      const ready = day.items.find((i) => i.id === real.order.drinkId && i.elapsed >= i.duration);
      if (ready) {
        day.selected = t.uid;
        tapItem(day, game, ready.uid);
      } else if (!day.items.some((i) => i.id === real.order.drinkId)) {
        startCook(day, game, real.order.drinkId);
      }
    }
  }
  // Plate next steps from done items or the tray; add no-cook steps directly.
  for (const t of targets) {
    const real = tgt(t);
    if (!real || real.state === 'left' || real.state === 'served') continue;
    let next = nextStepOf(real);
    let guard = 0;
    while (next && guard++ < 12) {
      if (ING[next].process === 'none') {
        day.selected = t.uid;
        if (!addDirect(day, next)) break;
      } else {
        const ti = day.tray.findIndex((x) => x.id === next);
        if (ti >= 0) {
          day.selected = t.uid;
          if (!useTray(day, ti)) break;
        } else {
          const done = day.items.find((i) => i.id === next && i.elapsed >= i.duration);
          if (!done) break;
          day.selected = t.uid;
          if (!tapItem(day, game, done.uid)) break;
        }
      }
      next = nextStepOf(real);
    }
  }
  // Move other finished items into the tray so stations stay free.
  for (const item of [...day.items]) {
    if (item.elapsed >= item.duration && !DRINK[item.id]) {
      day.selected = targets[0]?.uid ?? null;
      tapItem(day, game, item.uid);
    }
  }
  // Start cooking whatever is still needed and not already on a station.
  const needed = {};
  for (const t of targets) {
    const real = tgt(t);
    if (!real || real.state === 'left' || real.state === 'served') continue;
    for (let i = real.dish.length; i < real.steps.length; i++) {
      const id = real.steps[i];
      if (ING[id].process !== 'none') needed[id] = (needed[id] || 0) + 1;
    }
  }
  for (const [id, count] of Object.entries(needed)) {
    const inTray = day.tray.filter((x) => x.id === id).length;
    const going = day.items.filter((i) => i.id === id).length;
    for (let k = going + inTray; k < count; k++) startCook(day, game, id);
  }
  // Clear clogging finished items nobody needs.
  for (const item of [...day.items]) {
    if (item.elapsed >= item.duration && !needed[item.id] && !DRINK[item.id] && day.tray.length >= traySlots(game)) {
      trashItem(day, item.uid);
    }
  }
  if (clicks) {
    for (const item of day.items) if (item.elapsed < item.duration) tapItem(day, game, item.uid);
  }
}

function playCampaign(clicks, seed) {
  const game = createGame(seed);
  const results = [];
  for (let dayNum = 1; dayNum <= 12; dayNum++) {
    const day = createDay(game, dayNum);
    let guard = 0;
    while (!day.over && guard++ < 1200) {
      botAct(day, game, clicks);
      tick(day, game, 0.4);
    }
    const { won } = finishDay(game, day);
    results.push({ dayNum, earned: day.earned, goal: day.goal, won });
  }
  return { game, results };
}
{
  const idle = createGame(37);
  const idleDay = createDay(idle, 1);
  let guard = 0;
  while (!idleDay.over && guard++ < 600) tick(idleDay, idle, 0.5);
  eq(idleDay.earned, 0, 'a player who does nothing earns nothing');
}
{
  const { results } = playCampaign(false, 101);
  for (const r of results) {
    ok(r.won, `NO-CLICK player wins day ${r.dayNum} ($${r.earned}/$${r.goal})`);
  }
}
{
  const { game, results } = playCampaign(true, 202);
  for (const r of results) {
    ok(r.won, `ACTIVE player wins day ${r.dayNum} ($${r.earned}/$${r.goal})`);
  }
  ok(game.campaignWon, 'the active campaign is won outright');
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
