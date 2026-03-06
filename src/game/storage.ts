import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  HIGH_SCORE: 'high_score_v2',
  TOTAL_GAMES: 'total_games_v2',
  TOTAL_LINES: 'total_lines_v2',
  BEST_COMBO: 'best_combo_v2',
  MAX_LEVEL: 'max_level_v2',
  TUTORIAL_DONE: 'tutorial_done_v2',
};

export interface GameStats {
  highScore: number;
  totalGames: number;
  totalLines: number;
  bestCombo: number;
  maxLevel: number;
}

export async function getStats(): Promise<GameStats> {
  const vals = await AsyncStorage.multiGet([
    KEYS.HIGH_SCORE, KEYS.TOTAL_GAMES, KEYS.TOTAL_LINES, KEYS.BEST_COMBO, KEYS.MAX_LEVEL
  ]);
  const map = Object.fromEntries(vals.map(([k, v]) => [k, v ? parseInt(v, 10) : 0]));
  return {
    highScore: map[KEYS.HIGH_SCORE] ?? 0,
    totalGames: map[KEYS.TOTAL_GAMES] ?? 0,
    totalLines: map[KEYS.TOTAL_LINES] ?? 0,
    bestCombo: map[KEYS.BEST_COMBO] ?? 0,
    maxLevel: map[KEYS.MAX_LEVEL] ?? 1,
  };
}

export async function saveGameResult(score: number, linesCleared: number, bestCombo: number, maxLevel: number): Promise<void> {
  const stats = await getStats();
  await AsyncStorage.multiSet([
    [KEYS.HIGH_SCORE, String(Math.max(stats.highScore, score))],
    [KEYS.TOTAL_GAMES, String(stats.totalGames + 1)],
    [KEYS.TOTAL_LINES, String(stats.totalLines + linesCleared)],
    [KEYS.BEST_COMBO, String(Math.max(stats.bestCombo, bestCombo))],
    [KEYS.MAX_LEVEL, String(Math.max(stats.maxLevel, maxLevel))],
  ]);
}

export async function isTutorialDone(): Promise<boolean> {
  const val = await AsyncStorage.getItem(KEYS.TUTORIAL_DONE);
  return val === '1';
}

export async function markTutorialDone(): Promise<void> {
  await AsyncStorage.setItem(KEYS.TUTORIAL_DONE, '1');
}

export async function resetStats(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(KEYS));
}
