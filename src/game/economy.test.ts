import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addXpAndCheckLevel,
  buyIngredientPack,
  calculateDrinkQuality,
  calculateOrderPayment,
  claimMissionReward,
  consumeIngredientsForDrink,
  createInitialGameState,
  getTimeOfDayInfo,
  hasRequiredIngredients,
  purchaseUpgrade,
  syncMissions,
} from './economy';
import { Order } from './types';

test('drink quality rewards exact ingredients, cleanliness, and brass kettle upgrade', () => {
  const perfectScore = calculateDrinkQuality({
    targetDrinkId: 'mint_tea',
    selectedDrinkId: 'mint_tea',
    addedIngredients: { tea: 1, sugar: 2, mint: 1, water: 1, cups: 1 },
    brewMeterAccuracy: 1,
    tableDirty: false,
    hasBrassKettleUpgrade: true,
  });
  assert.equal(perfectScore, 100);

  const dirtyWrongScore = calculateDrinkQuality({
    targetDrinkId: 'mint_tea',
    selectedDrinkId: 'black_coffee',
    addedIngredients: { coffee: 1 },
    brewMeterAccuracy: 0.2,
    tableDirty: true,
    hasBrassKettleUpgrade: false,
  });
  assert.ok(dirtyWrongScore < 40);
});

test('inventory checks block preparation when ingredients are missing and consume accurately', () => {
  const initial = createInitialGameState();
  const res = consumeIngredientsForDrink(initial.inventory, 'mint_tea');
  assert.equal(res.ok, true);
  assert.equal(res.nextInventory.tea, initial.inventory.tea - 1);
  assert.equal(res.nextInventory.mint, initial.inventory.mint - 1);
  assert.equal(res.nextInventory.sugar, initial.inventory.sugar - 2);

  const emptyInv = { ...initial.inventory, mint: 0 };
  const blocked = hasRequiredIngredients(emptyInv, 'mint_tea');
  assert.equal(blocked.ok, false);
  assert.deepEqual(blocked.missing, ['mint']);
});

test('order payment grants tips for high quality & patience and updates XP/levels', () => {
  const order: Order = {
    id: 'ord_1',
    customerId: 'cust_1',
    customerNameAr: 'المعلم عتريس',
    customerNameEn: 'El-Moallem',
    tableId: 1,
    drinkId: 'black_coffee',
    quantity: 1,
    price: 25,
    status: 'delivered',
    createdAt: 10,
  };

  const payment = calculateOrderPayment({
    order,
    quality: 92,
    patienceLeft: 70,
    tipMultiplier: 1.5,
  });
  assert.equal(payment.pricePaid, 25);
  assert.ok(payment.tip > 0);
  assert.equal(payment.reputationDelta, 2);

  const lvl = addXpAndCheckLevel(90, 1, 35);
  assert.equal(lvl.leveledUp, true);
  assert.equal(lvl.level, 2);
  assert.equal(lvl.xp, 25);
});

test('buying supplies & upgrades updates economy, storage capacity, and mission completion', () => {
  let state = createInitialGameState();
  state.economy.balance = 1000;

  const bought = buyIngredientPack(state, 'tea');
  assert.equal(bought.ok, true);
  assert.equal(bought.state.inventory.tea, state.inventory.tea + 15);
  assert.equal(bought.state.economy.balance, 965);

  const upg = purchaseUpgrade(bought.state, 'storage_rack');
  assert.equal(upg.ok, true);
  assert.equal(upg.state.storageCapacity, 120);
  assert.equal(upg.state.upgrades.storage_rack, true);

  const tbl = purchaseUpgrade(upg.state, 'table_5');
  assert.equal(tbl.ok, true);
  const synced = syncMissions(tbl.state);
  const tableMission = synced.missions.find((m) => m.id === 'main_buy_table');
  assert.equal(tableMission?.completed, true);

  const claimed = claimMissionReward(synced, 'main_buy_table');
  assert.equal(claimed.ok, true);
  assert.equal(claimed.state.economy.balance, synced.economy.balance + (tableMission?.rewardEgp ?? 0));
});

test('time of day phases map cleanly across morning, afternoon, evening, and night', () => {
  assert.equal(getTimeOfDayInfo(510).phase, 'morning');
  assert.equal(getTimeOfDayInfo(840).phase, 'afternoon');
  assert.equal(getTimeOfDayInfo(1110).phase, 'evening');
  assert.equal(getTimeOfDayInfo(1320).phase, 'night');
});
