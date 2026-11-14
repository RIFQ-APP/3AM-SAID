import { DRINKS, INITIAL_EMPLOYEES, INITIAL_MISSIONS, INGREDIENTS, UPGRADES } from './catalog';
import {
  DrinkId,
  GameState,
  IngredientId,
  InventoryState,
  Mission,
  Order,
  TimeOfDay,
  UpgradeId,
} from './types';

export const GAME_SAVE_VERSION = 1;

export function createInitialGameState(): GameState {
  return {
    version: GAME_SAVE_VERSION,
    day: 1,
    clockMinutes: 480, // 8:00 AM
    xp: 0,
    level: 1,
    reputation: 30,
    satisfaction: 82,
    storageCapacity: 60,
    upgrades: {
      table_5: false,
      table_6: false,
      wood_chairs: false,
      brass_kettle: false,
      storage_rack: false,
      wall_decor: false,
      big_tv: false,
      brass_lanterns: false,
    },
    inventory: {
      tea: 22,
      coffee: 16,
      sugar: 34,
      mint: 14,
      milk: 10,
      water: 40,
      cups: 36,
      herbs: 12,
      cleaning: 15,
    },
    economy: {
      balance: 450,
      totalEarned: 0,
      dailyRevenue: 0,
      dailyExpenses: 0,
      dailyTips: 0,
      salesHistory: [],
    },
    employees: INITIAL_EMPLOYEES.map((e) => ({ ...e })),
    missions: INITIAL_MISSIONS.map((m) => ({ ...m })),
    stats: {
      customersServed: 0,
      teaPrepared: 0,
      coffeePrepared: 0,
      regularsServed: 0,
      tablesCleaned: 0,
      ordersCompleted: 0,
      perfectDrinks: 0,
      tipsReceived: 0,
      complaintsToday: 0,
      eventsHandled: 0,
    },
    settings: {
      language: 'ar',
      graphics: 'medium',
      cameraSensitivity: 1.0,
      audio: {
        muted: false,
        music: 0.45,
        sfx: 0.75,
        voices: 0.7,
        ambience: 0.55,
      },
    },
  };
}

export function getXpForNextLevel(level: number): number {
  return 100 + (level - 1) * 75;
}

export function addXpAndCheckLevel(
  xp: number,
  level: number,
  gainedXp: number
): { xp: number; level: number; leveledUp: boolean } {
  let currentXp = xp + Math.max(0, Math.round(gainedXp));
  let currentLevel = level;
  let leveledUp = false;

  while (currentXp >= getXpForNextLevel(currentLevel)) {
    currentXp -= getXpForNextLevel(currentLevel);
    currentLevel += 1;
    leveledUp = true;
  }

  return { xp: currentXp, level: currentLevel, leveledUp };
}

export function hasRequiredIngredients(
  inventory: InventoryState,
  drinkId: DrinkId
): { ok: boolean; missing: IngredientId[] } {
  const recipe = DRINKS[drinkId];
  const missing: IngredientId[] = [];
  (Object.entries(recipe.ingredients) as [IngredientId, number][]).forEach(([ing, qty]) => {
    if ((inventory[ing] ?? 0) < qty) {
      missing.push(ing);
    }
  });
  return { ok: missing.length === 0, missing };
}

export function consumeIngredientsForDrink(
  inventory: InventoryState,
  drinkId: DrinkId
): { ok: boolean; nextInventory: InventoryState; missing: IngredientId[] } {
  const check = hasRequiredIngredients(inventory, drinkId);
  if (!check.ok) {
    return { ok: false, nextInventory: inventory, missing: check.missing };
  }
  const nextInventory: InventoryState = { ...inventory };
  const recipe = DRINKS[drinkId];
  (Object.entries(recipe.ingredients) as [IngredientId, number][]).forEach(([ing, qty]) => {
    nextInventory[ing] = Math.max(0, nextInventory[ing] - qty);
  });
  return { ok: true, nextInventory, missing: [] };
}

export function calculateDrinkQuality(params: {
  targetDrinkId: DrinkId;
  selectedDrinkId: DrinkId;
  addedIngredients: Partial<Record<IngredientId, number>>;
  brewMeterAccuracy: number; // 0..1 (1 = dead center sweet spot)
  tableDirty: boolean;
  hasBrassKettleUpgrade: boolean;
}): number {
  const {
    targetDrinkId,
    selectedDrinkId,
    addedIngredients,
    brewMeterAccuracy,
    tableDirty,
    hasBrassKettleUpgrade,
  } = params;

  const targetRecipe = DRINKS[targetDrinkId];
  let score = 40; // base

  // Matching requested drink
  if (targetDrinkId === selectedDrinkId) {
    score += 20;
  } else {
    score -= 25;
  }

  // Ingredient accuracy
  const requiredEntries = Object.entries(targetRecipe.ingredients) as [IngredientId, number][];
  let ingPoints = 0;
  const maxIngPoints = 25;
  const perIng = maxIngPoints / Math.max(1, requiredEntries.length);

  for (const [ing, reqQty] of requiredEntries) {
    const provided = addedIngredients[ing] ?? 0;
    if (provided === reqQty) {
      ingPoints += perIng;
    } else if (provided > 0) {
      ingPoints += perIng * 0.5;
    }
  }
  score += ingPoints;

  // Brew timing / stirring accuracy
  score += Math.max(0, Math.min(1, brewMeterAccuracy)) * 20;

  // Cleanliness & equipment bonus
  if (tableDirty) score -= 12;
  if (hasBrassKettleUpgrade) score += 10;

  return Math.max(15, Math.min(100, Math.round(score)));
}

export function calculateOrderPayment(params: {
  order: Order;
  quality: number;
  patienceLeft: number; // 0..100
  tipMultiplier: number;
}): {
  pricePaid: number;
  tip: number;
  reputationDelta: number;
  satisfactionDelta: number;
  xpEarned: number;
} {
  const { order, quality, patienceLeft, tipMultiplier } = params;
  const pricePaid = order.price;

  // Tip only if quality >= 65 and patienceLeft >= 25
  let tip = 0;
  if (quality >= 85 && patienceLeft >= 40) {
    tip = Math.round((4 + (quality - 80) * 0.25) * tipMultiplier);
  } else if (quality >= 68 && patienceLeft >= 25) {
    tip = Math.round(2 * tipMultiplier);
  }

  const reputationDelta =
    quality >= 85 ? 2 : quality >= 65 ? 1 : quality >= 45 ? 0 : -2;

  const satisfactionDelta =
    quality >= 85 ? 4 : quality >= 65 ? 2 : quality >= 45 ? -1 : -5;

  const xpEarned = Math.round(18 + quality * 0.2 + (order.isStrange ? 12 : 0));

  return {
    pricePaid,
    tip,
    reputationDelta,
    satisfactionDelta,
    xpEarned,
  };
}

export function buyIngredientPack(
  state: GameState,
  ingredientId: IngredientId
): { ok: boolean; state: GameState; reason?: 'insufficient_funds' | 'storage_full' } {
  const meta = INGREDIENTS[ingredientId];
  if (state.economy.balance < meta.packPrice) {
    return { ok: false, state, reason: 'insufficient_funds' };
  }
  const currentQty = state.inventory[ingredientId];
  if (currentQty >= state.storageCapacity) {
    return { ok: false, state, reason: 'storage_full' };
  }
  const nextQty = Math.min(state.storageCapacity, currentQty + meta.packQty);
  return {
    ok: true,
    state: {
      ...state,
      inventory: {
        ...state.inventory,
        [ingredientId]: nextQty,
      },
      economy: {
        ...state.economy,
        balance: state.economy.balance - meta.packPrice,
        dailyExpenses: state.economy.dailyExpenses + meta.packPrice,
      },
    },
  };
}

export function purchaseUpgrade(
  state: GameState,
  upgradeId: UpgradeId
): { ok: boolean; state: GameState; reason?: 'already_owned' | 'locked_level' | 'insufficient_funds' } {
  if (state.upgrades[upgradeId]) {
    return { ok: false, state, reason: 'already_owned' };
  }
  const item = UPGRADES.find((u) => u.id === upgradeId);
  if (!item) return { ok: false, state, reason: 'already_owned' };
  if (state.level < item.unlockLevel) {
    return { ok: false, state, reason: 'locked_level' };
  }
  if (state.economy.balance < item.price) {
    return { ok: false, state, reason: 'insufficient_funds' };
  }

  const nextCapacity =
    upgradeId === 'storage_rack' ? 120 : state.storageCapacity;

  const nextState: GameState = {
    ...state,
    storageCapacity: nextCapacity,
    reputation: Math.min(100, state.reputation + item.reputationBonus),
    upgrades: {
      ...state.upgrades,
      [upgradeId]: true,
    },
    economy: {
      ...state.economy,
      balance: state.economy.balance - item.price,
      dailyExpenses: state.economy.dailyExpenses + item.price,
    },
  };

  return {
    ok: true,
    state: syncMissions(nextState),
  };
}

export function syncMissions(state: GameState): GameState {
  const tablesBought =
    (state.upgrades.table_5 ? 1 : 0) + (state.upgrades.table_6 ? 1 : 0);
  const employeesHired = state.employees.filter((e) => e.hired).length;

  const nextMissions: Mission[] = state.missions.map((m) => {
    let progress = m.progress;
    switch (m.metric) {
      case 'customers_served':
        progress = state.stats.customersServed;
        break;
      case 'total_earned':
        progress = state.economy.totalEarned;
        break;
      case 'tables_bought':
        progress = tablesBought;
        break;
      case 'employees_hired':
        progress = employeesHired;
        break;
      case 'reputation_level':
        progress = state.reputation;
        break;
      case 'equipment_upgraded':
        progress = state.upgrades.brass_kettle ? 1 : 0;
        break;
      case 'tea_prepared':
        progress = state.stats.teaPrepared;
        break;
      case 'regulars_served':
        progress = state.stats.regularsServed;
        break;
      case 'tables_cleaned':
        progress = state.stats.tablesCleaned;
        break;
      case 'orders_completed':
        progress = state.stats.ordersCompleted;
        break;
      case 'first_tip':
        progress = state.stats.tipsReceived;
        break;
      case 'perfect_drinks':
        progress = state.stats.perfectDrinks;
        break;
      case 'no_complaints_day':
        progress = state.stats.complaintsToday === 0 && state.day > 1 ? 1 : 0;
        break;
    }
    const clamped = Math.min(m.target, progress);
    return {
      ...m,
      progress: clamped,
      completed: clamped >= m.target,
    };
  });

  return {
    ...state,
    missions: nextMissions,
  };
}

export function claimMissionReward(
  state: GameState,
  missionId: string
): { ok: boolean; state: GameState } {
  const target = state.missions.find((m) => m.id === missionId);
  if (!target || !target.completed || target.claimed) {
    return { ok: false, state };
  }

  const leveled = addXpAndCheckLevel(state.xp, state.level, target.rewardXp);

  return {
    ok: true,
    state: {
      ...state,
      xp: leveled.xp,
      level: leveled.level,
      economy: {
        ...state.economy,
        balance: state.economy.balance + target.rewardEgp,
      },
      missions: state.missions.map((m) =>
        m.id === missionId ? { ...m, claimed: true } : m
      ),
    },
  };
}

export function getTimeOfDayInfo(clockMinutes: number): {
  phase: TimeOfDay;
  labelAr: string;
  labelEn: string;
  formattedTime: string;
  spawnIntervalSec: number;
} {
  const wrapped = ((Math.floor(clockMinutes) % 1440) + 1440) % 1440;
  const hours24 = Math.floor(wrapped / 60);
  const mins = wrapped % 60;
  const period = hours24 >= 12 ? 'م' : 'ص';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const formattedTime = `${hours12}:${mins.toString().padStart(2, '0')} ${period}`;

  if (hours24 >= 6 && hours24 < 12) {
    return {
      phase: 'morning',
      labelAr: 'الصباح',
      labelEn: 'Morning',
      formattedTime,
      spawnIntervalSec: 11,
    };
  }
  if (hours24 >= 12 && hours24 < 17) {
    return {
      phase: 'afternoon',
      labelAr: 'الضهر',
      labelEn: 'Afternoon',
      formattedTime,
      spawnIntervalSec: 10,
    };
  }
  if (hours24 >= 17 && hours24 < 21) {
    return {
      phase: 'evening',
      labelAr: 'المغرب',
      labelEn: 'Evening',
      formattedTime,
      spawnIntervalSec: 7.5,
    };
  }
  return {
    phase: 'night',
    labelAr: 'السهرة',
    labelEn: 'Night',
    formattedTime,
    spawnIntervalSec: 8.5,
  };
}
