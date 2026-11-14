import { createInitialGameState, GAME_SAVE_VERSION } from './economy';
import { GameState } from './types';

const STORAGE_KEY = 'baladi_coffeehouse_save_v1';

export function saveGameState(state: GameState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function loadGameState(): GameState {
  const fallback = createInitialGameState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<GameState>;
    if (!parsed || parsed.version !== GAME_SAVE_VERSION) {
      return fallback;
    }

    return {
      ...fallback,
      ...parsed,
      upgrades: { ...fallback.upgrades, ...(parsed.upgrades ?? {}) },
      inventory: { ...fallback.inventory, ...(parsed.inventory ?? {}) },
      economy: {
        ...fallback.economy,
        ...(parsed.economy ?? {}),
        salesHistory: Array.isArray(parsed.economy?.salesHistory)
          ? parsed.economy.salesHistory.slice(0, 40)
          : [],
      },
      employees: Array.isArray(parsed.employees) && parsed.employees.length > 0
        ? parsed.employees
        : fallback.employees,
      missions: Array.isArray(parsed.missions) && parsed.missions.length > 0
        ? parsed.missions
        : fallback.missions,
      stats: { ...fallback.stats, ...(parsed.stats ?? {}) },
      settings: {
        ...fallback.settings,
        ...(parsed.settings ?? {}),
        audio: {
          ...fallback.settings.audio,
          ...(parsed.settings?.audio ?? {}),
        },
      },
    };
  } catch {
    return fallback;
  }
}

export function clearGameSave(): GameState {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  return createInitialGameState();
}
