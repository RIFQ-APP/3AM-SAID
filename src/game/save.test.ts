import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialGameState } from './economy';
import { clearGameSave, loadGameState, saveGameState } from './save';

test('save and load preserve the complete game state and player preferences', () => {
  const values = new Map<string, string>();
  const previousStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');

  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    },
  });

  try {
    const state = createInitialGameState();
    state.settings.graphics = 'low';
    state.settings.language = 'en';
    state.settings.audio.muted = true;
    state.clockMinutes = 975;
    state.reputation = 88;
    state.satisfaction = 91;
    state.economy.balance = 777;

    saveGameState(state);
    const loaded = loadGameState();

    assert.equal(loaded.settings.graphics, 'low');
    assert.equal(loaded.settings.language, 'en');
    assert.equal(loaded.settings.audio.muted, true);
    assert.equal(loaded.clockMinutes, 975);
    assert.equal(loaded.reputation, 88);
    assert.equal(loaded.satisfaction, 91);
    assert.equal(loaded.economy.balance, 777);

    clearGameSave();
    assert.equal(values.size, 0);
  } finally {
    if (previousStorage) {
      Object.defineProperty(globalThis, 'localStorage', previousStorage);
    } else {
      Reflect.deleteProperty(globalThis, 'localStorage');
    }
  }
});
