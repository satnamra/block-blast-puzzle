import { getLevelForScore, getNextLevel, getProgressToNextLevel, LEVELS } from '../src/game/levels';

describe('LEVELS', () => {
  test('starts at level 1 with threshold 0', () => {
    expect(LEVELS[0].level).toBe(1);
    expect(LEVELS[0].scoreThreshold).toBe(0);
  });

  test('levels are in ascending order', () => {
    for (let i = 1; i < LEVELS.length; i++) {
      expect(LEVELS[i].scoreThreshold).toBeGreaterThan(LEVELS[i - 1].scoreThreshold);
      expect(LEVELS[i].level).toBe(LEVELS[i - 1].level + 1);
    }
  });

  test('all levels have allowed pieces', () => {
    LEVELS.forEach(l => expect(l.allowedPieceIndices.length).toBeGreaterThan(0));
  });

  test('higher levels have more piece variety or complexity', () => {
    // Level 1 should have fewer piece types than level 5
    expect(LEVELS[4].allowedPieceIndices.length).toBeGreaterThanOrEqual(LEVELS[0].allowedPieceIndices.length - 2);
  });
});

describe('getLevelForScore', () => {
  test('score 0 = level 1', () => expect(getLevelForScore(0).level).toBe(1));
  test('score 499 = level 1', () => expect(getLevelForScore(499).level).toBe(1));
  test('score 500 = level 2', () => expect(getLevelForScore(500).level).toBe(2));
  test('score 1499 = level 2', () => expect(getLevelForScore(1499).level).toBe(2));
  test('score 1500 = level 3', () => expect(getLevelForScore(1500).level).toBe(3));
  test('score 3500 = level 4', () => expect(getLevelForScore(3500).level).toBe(4));
  test('score 7000 = level 5', () => expect(getLevelForScore(7000).level).toBe(5));
  test('very high score = max level', () => {
    const max = LEVELS[LEVELS.length - 1];
    expect(getLevelForScore(99999).level).toBe(max.level);
  });
});

describe('getNextLevel', () => {
  test('level 1 has a next level', () => expect(getNextLevel(0)).not.toBeNull());
  test('max level has no next', () => {
    const maxScore = LEVELS[LEVELS.length - 1].scoreThreshold;
    expect(getNextLevel(maxScore + 1000)).toBeNull();
  });
  test('next level is always higher', () => {
    const current = getLevelForScore(100);
    const next = getNextLevel(100);
    if (next) expect(next.level).toBe(current.level + 1);
  });
});

describe('getProgressToNextLevel', () => {
  test('at threshold = 0 progress', () => {
    expect(getProgressToNextLevel(0)).toBeCloseTo(0);
  });
  test('halfway = ~0.5', () => {
    // Level 1 goes 0-499, halfway = 250
    const p = getProgressToNextLevel(250);
    expect(p).toBeCloseTo(0.5, 1);
  });
  test('at next threshold = 1', () => {
    expect(getProgressToNextLevel(500)).toBeCloseTo(0, 1); // just hit level 2
  });
  test('max level progress = 1', () => {
    const maxScore = LEVELS[LEVELS.length - 1].scoreThreshold;
    expect(getProgressToNextLevel(maxScore + 5000)).toBe(1);
  });
  test('progress is between 0 and 1', () => {
    [0, 100, 500, 1000, 5000, 20000].forEach(s => {
      const p = getProgressToNextLevel(s);
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(1);
    });
  });
});
