// Screenshot staging: ?shot=<scene>&seed=<n> builds a real game state through the
// engine's own functions and poses it for the kit's screenshot capture, so the
// screenshots show the genuine game, mid-action.

import { createGame, createDay, startCook } from './engine.js';
import { RECIPE } from './data.js';

let shotUid = 9000;
function makeCustomer(day, typeId, recipeId, drinkId, patience, patienceMax) {
  const steps = [...RECIPE[recipeId].steps];
  const c = {
    uid: shotUid++,
    typeId,
    order: { recipeId, steps, variation: null, drinkId },
    steps,
    dish: [],
    dishQuality: [],
    drinkServed: false,
    patience,
    patienceMax,
    state: 'waiting',
    bubbleT: 3,
    mood: 'hi',
  };
  day.customers.push(c);
  return c;
}
function cookAt(day, game, id, elapsed) {
  const item = startCook(day, game, id);
  if (item) item.elapsed = elapsed;
  return item;
}

export function stageShot(S, scene, seed) {
  const game = createGame(seed);
  game.seenStory = ['intro', 'mid', 'final'];
  S.game = game;
  S.t = 3.7; // a fixed, lively animation phase for every capture
  shotUid = 9000;

  if (scene === 'service' || scene === 'assembly') {
    const day = createDay(game, scene === 'service' ? 3 : 2);
    day.customers = [];
    day.selected = null;
    day.nextCustomerIn = 9999;
    day.nextPhoneIn = 9999;
    S.day = day;
    if (scene === 'service') {
      const c1 = makeCustomer(day, 'auntie', 'classic-burger', null, 78, 95);
      const c2 = makeCustomer(day, 'tourist', 'shrimp-noodles', 'coffee', 40, 85);
      const c3 = makeCustomer(day, 'office', 'chicken-rice', null, 88, 100);
      c2.mood = 'wait';
      S.seatOf = new Map([[c1.uid, 0], [c2.uid, 2], [c3.uid, 4]]);
      // c1's burger half built on the plating board: bun + PERFECT patty + cheese of 5
      c1.dish = ['bun', 'patty', 'cheese'];
      c1.dishQuality = ['none', 'perfect', 'none'];
      day.selected = c1.uid;
      // an item glowing in its PERFECT zone on the stove (c2's noodles)
      const noodles = cookAt(day, game, 'noodles', 0);
      noodles.elapsed = noodles.duration + 1.2;
      // more cooking in flight: fries mid-fry, chicken on the grill
      cookAt(day, game, 'fries', 2.6);
      cookAt(day, game, 'chicken', 3.1);
      // a finished component waits in the mise en place tray
      day.tray.push({ id: 'greens', quality: 'perfect' });
      // a phone order ticks down on the side panel
      day.phone = {
        recipeId: 'tomato-soup', steps: [...RECIPE['tomato-soup'].steps],
        dish: [], dishQuality: [], timeLeft: 31, payout: 26,
      };
      day.combo = 5;
      day.comboT = 8;
      day.earned = 86;
      day.timeLeft = 74;
    } else {
      // assembly: one burger a single layer from done, shown large in the plating panel
      const c1 = makeCustomer(day, 'kid', 'classic-burger', null, 90, 100);
      const c2 = makeCustomer(day, 'grandpa', 'tomato-soup', null, 70, 110);
      S.seatOf = new Map([[c1.uid, 2], [c2.uid, 0]]);
      c1.dish = ['bun', 'patty', 'cheese', 'lettuce'];
      c1.dishQuality = ['none', 'perfect', 'none', 'none'];
      day.selected = c1.uid;
      cookAt(day, game, 'tomato', 1.4); // the final layer, chopping on the prep board
      day.earned = 40;
      day.timeLeft = 95;
    }
    S.screen = 'service';
    return;
  }
  if (scene === 'shop') {
    game.totalEarned = 1500;
    game.totalSpent = 860; // purse = $640
    game.levels = { knives: 2, grillmaster: 1, fryerpro: 0, stoveswift: 0, ovenheat: 1, pantrymastery: 1, bigtray: 3, helperhands: 0 };
    game.decorOwned = { plant: true };
    S.screen = 'shop';
    return;
  }
  if (scene === 'summary') {
    game.repaid = 1250;
    game.totalEarned = 1518;
    game.totalSpent = 1250; // purse = $268
    S.result = {
      day: 5, wave: 0, endless: false, goal: 210, earned: 268, stars: 2,
      served: 14, perfects: 5, bestCombo: 9, walkouts: 1, won: true, campaignWon: false,
    };
    S.summaryT = 1.7; // all three stars have popped in
    // a settled scatter of celebration confetti over the panel
    const colors = ['#f4c542', '#e74c3c', '#7ed37e', '#7fb3d5', '#f0a0c0'];
    for (let i = 0; i < 42; i++) {
      S.confetti.push({
        x: 350 + ((i * 173) % 580), y: 130 + ((i * 211) % 480),
        vx: 0, vy: 0, rot: (i * 1.7) % 6.3, vr: 0,
        color: colors[i % colors.length], age: 0.4,
      });
    }
    S.screen = 'summary';
    return;
  }
  if (scene === 'ladder') {
    game.dayUnlocked = 6;
    game.stars = { 1: 3, 2: 2, 3: 3, 4: 1, 5: 2 };
    game.repaid = 940;
    game.totalEarned = 940;
    S.screen = 'ladder';
    return;
  }
  S.screen = 'title';
}
