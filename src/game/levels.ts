export interface LevelConfig {
  level: number;
  name: string;
  scoreThreshold: number;
  allowedPieceIndices: number[];
  // Grid setup at game start
  obstacleCount: number;   // obstacle blocks (multi-HP, need line to destroy)
  lockedCount: number;     // indestructible locked tiles
  bonusCount: number;      // bonus zone cells (3x points)
  // Ongoing difficulty
  obstacleSpawnEvery: number; // spawn obstacle every N placements (0 = never)
  color: string;
  description: string;
}

export const LEVELS: LevelConfig[] = [
  {
    level: 1, name: 'Beginner', scoreThreshold: 0,
    allowedPieceIndices: [0, 1, 2, 3, 4, 7, 16, 17, 18, 19],
    obstacleCount: 0, lockedCount: 0, bonusCount: 0,
    obstacleSpawnEvery: 0,
    color: '#22C55E', description: 'Learn the basics',
  },
  {
    level: 2, name: 'Rising', scoreThreshold: 500,
    allowedPieceIndices: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 16, 17, 18, 19],
    obstacleCount: 0, lockedCount: 0, bonusCount: 3,
    obstacleSpawnEvery: 0,
    color: '#3B82F6', description: '⭐ Bonus zones appear',
  },
  {
    level: 3, name: 'Skilled', scoreThreshold: 1500,
    allowedPieceIndices: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
    obstacleCount: 3, lockedCount: 0, bonusCount: 3,
    obstacleSpawnEvery: 0,
    color: '#EAB308', description: '🪨 Obstacle blocks — clear their row to destroy them',
  },
  {
    level: 4, name: 'Expert', scoreThreshold: 3500,
    allowedPieceIndices: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
    obstacleCount: 4, lockedCount: 2, bonusCount: 4,
    obstacleSpawnEvery: 8, // new obstacle every 8 placements
    color: '#F97316', description: '🔒 Locked tiles + obstacles spawn during play',
  },
  {
    level: 5, name: 'Master', scoreThreshold: 7000,
    allowedPieceIndices: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
    obstacleCount: 5, lockedCount: 3, bonusCount: 5,
    obstacleSpawnEvery: 5,
    color: '#EF4444', description: '💀 Obstacles spawn faster. High stakes!',
  },
  {
    level: 6, name: 'Legend', scoreThreshold: 13000,
    allowedPieceIndices: [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21],
    obstacleCount: 6, lockedCount: 4, bonusCount: 6,
    obstacleSpawnEvery: 3,
    color: '#8B5CF6', description: '👑 Complex pieces, frequent obstacles. Legend mode!',
  },
];

export function getLevelForScore(score: number): LevelConfig {
  let current = LEVELS[0];
  for (const lvl of LEVELS) {
    if (score >= lvl.scoreThreshold) current = lvl;
    else break;
  }
  return current;
}

export function getNextLevel(score: number): LevelConfig | null {
  const current = getLevelForScore(score);
  return LEVELS.find(l => l.level === current.level + 1) ?? null;
}

export function getProgressToNextLevel(score: number): number {
  const current = getLevelForScore(score);
  const next = getNextLevel(score);
  if (!next) return 1;
  const range = next.scoreThreshold - current.scoreThreshold;
  const prog = score - current.scoreThreshold;
  return Math.min(1, prog / range);
}
