// Shared constants for The Copper Ladle: Golden Hour. Every number the design promises
// (combo tiers, the PERFECT hold, star thresholds, the cooking floor) lives here so the
// game, the staging and the tests all read the same values.

export const VIEW_W = 1280;
export const VIEW_H = 800;

/** Seconds a day of service lasts. */
export const DAY_SECONDS = 150;

/** Combo: a serve within this many seconds of the last one keeps the chain alive. */
export const COMBO_WINDOW = 10;
/** Combo counts at which the payout multiplier steps up. */
export const COMBO_TIERS = [3, 6, 9];
export const COMBO_MULTS = [1.5, 2, 3];
/** A perfect serve grows the combo by this much instead of 1. */
export const COMBO_PERFECT_STEP = 2;

/** FEVER starts when the combo reaches this count. */
export const FEVER_COMBO = 8;
export const FEVER_SECONDS = 20;

/**
 * Quality after an item finishes cooking: it holds PERFECT for this fraction of its own
 * cook duration, then steps down to good, then to plain. It never burns and is never
 * removed by waiting — only the Trash button discards food.
 */
export const PERFECT_HOLD_FRACTION = 0.4;
export const GOOD_HOLD_FRACTION = 1.4;

/** Clicking a cooking item (a flip or a stir) shaves this many seconds off its wait. */
export const CLICK_SHAVE_SECONDS = 0.6;

/** No cooking duration, after every buff, ever goes below this many seconds. */
export const MIN_COOK_SECONDS = 2;

/** Stars for a day: 1 at the goal, 2 at this multiple, 3 at this multiple. */
export const STAR_2 = 1.25;
export const STAR_3 = 1.6;

/** The loan Rosa must repay: the sum of the twelve day goals. */
export const LOAN_TOTAL = 5450;
/** The twelve day goals, day 1 first. */
export const DAY_GOALS = [70, 110, 150, 210, 280, 360, 450, 550, 660, 780, 870, 960];

/** Difficulty multipliers: Relaxed lowers goals, stretches patience, cooks a touch faster. */
export const DIFFICULTY = {
  normal: { label: 'Normal', goal: 1, patience: 1, time: 1 },
  relaxed: { label: 'Relaxed', goal: 0.8, patience: 1.4, time: 0.85 },
};

/** Station slot capacities before any tray/space help. */
export const STATION_SLOTS = { prep: 3, grill: 3, fryer: 3, stove: 3, oven: 2, drinks: 3 };
/** Mise en place tray slots at helper level 0 (the Big Prep Tray upgrade adds more). */
export const TRAY_BASE_SLOTS = 3;

/** Phone takeaway orders: flat payout and the seconds on their countdown. */
export const PHONE_PAYOUT = 26;
export const PHONE_SECONDS = 45;
/** The named regular's loyalty bonus when his heart meter fills. */
export const LOYALTY_BONUS = 150;
export const LOYALTY_HEARTS = 5;

/** Aggregate of the tuning constants, for screens that read several at once. */
export const CONFIG = {
  DAY_SECONDS, COMBO_WINDOW, TRAY_BASE_SLOTS, PHONE_PAYOUT, PHONE_SECONDS,
  LOAN_TOTAL, STAR_2, STAR_3,
};
