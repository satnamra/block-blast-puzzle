import { Piece } from './pieces';
import { SIZES } from '../theme';

const { GRID_COLS, GRID_ROWS } = SIZES;

// Cell encoding:
// -1         = empty normal cell
// 0-9        = filled with color
// 100+       = OBSTACLE (HP = value - 100, e.g. 101 = obstacle with 1 HP left)
// 200        = LOCKED (indestructible, never clears)
// 300        = BONUS ZONE (empty, but gives 3x when filled+cleared)
// 400+       = BONUS ZONE filled (400 + colorIndex)

export const CELL_OBSTACLE_BASE = 100;
export const CELL_LOCKED = 200;
export const CELL_BONUS_BASE = 300;
export const CELL_BONUS_FILLED_BASE = 400;

export type Grid = number[][];

export function isObstacle(v: number) { return v >= 100 && v < 200; }
export function isLocked(v: number) { return v === 200; }
export function isBonusEmpty(v: number) { return v === 300; }
export function isBonusFilled(v: number) { return v >= 400 && v < 500; }
export function isEmpty(v: number) { return v === -1 || v === 300; }
export function isFilled(v: number) { return !isEmpty(v) && !isObstacle(v) && !isLocked(v); }
export function getColorIndex(v: number): number {
  if (v >= 400 && v < 500) return v - 400;
  if (v >= 0 && v < 100) return v;
  return -1;
}

export function createEmptyGrid(): Grid {
  return Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(-1));
}

export function createPreFilledGrid(
  obstacleCount: number,
  lockedCount: number,
  bonusCount: number
): Grid {
  const grid = createEmptyGrid();
  const positions: [number, number][] = [];
  for (let r = 0; r < GRID_ROWS; r++)
    for (let c = 0; c < GRID_COLS; c++)
      positions.push([r, c]);

  // Shuffle
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  let idx = 0;
  for (let i = 0; i < obstacleCount && idx < positions.length; i++, idx++) {
    const [r, c] = positions[idx];
    grid[r][c] = CELL_OBSTACLE_BASE + 2; // 2 HP obstacle
  }
  for (let i = 0; i < lockedCount && idx < positions.length; i++, idx++) {
    const [r, c] = positions[idx];
    grid[r][c] = CELL_LOCKED;
  }
  for (let i = 0; i < bonusCount && idx < positions.length; i++, idx++) {
    const [r, c] = positions[idx];
    grid[r][c] = CELL_BONUS_BASE;
  }

  return grid;
}

export function canPlace(grid: Grid, piece: Piece, row: number, col: number): boolean {
  const shape = piece.shape;
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const gr = row + r, gc = col + c;
      if (gr < 0 || gr >= GRID_ROWS || gc < 0 || gc >= GRID_COLS) return false;
      const v = grid[gr][gc];
      // Can only place on empty or bonus-empty cells
      if (!isEmpty(v)) return false;
    }
  }
  return true;
}

export function placePiece(grid: Grid, piece: Piece, row: number, col: number): Grid {
  const newGrid = grid.map(r => [...r]);
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (!piece.shape[r][c]) continue;
      const v = newGrid[row + r][col + c];
      if (isBonusEmpty(v)) {
        newGrid[row + r][col + c] = CELL_BONUS_FILLED_BASE + piece.colorIndex;
      } else {
        newGrid[row + r][col + c] = piece.colorIndex;
      }
    }
  }
  return newGrid;
}

export interface ClearResult {
  grid: Grid;
  linesCleared: number;
  cellsCleared: number;
  clearedRows: number[];
  clearedCols: number[];
  bonusCellsCleared: number;
  obstaclesDamaged: number;
}

function rowClearable(grid: Grid, r: number): boolean {
  // A row clears if every cell is: filled color OR bonus-filled (NOT empty, obstacle, locked)
  return grid[r].every(v => isFilled(v) || isBonusFilled(v));
}

function colClearable(grid: Grid, c: number): boolean {
  return grid.every(row => isFilled(row[c]) || isBonusFilled(row[c]));
}

export function clearLines(grid: Grid): ClearResult {
  const newGrid = grid.map(r => [...r]);
  const clearedRows: number[] = [];
  const clearedCols: number[] = [];

  // Only clear rows/cols that are completely filled (ignoring locked/obstacle)
  for (let r = 0; r < GRID_ROWS; r++) {
    if (rowClearable(newGrid, r)) clearedRows.push(r);
  }
  for (let c = 0; c < GRID_COLS; c++) {
    if (colClearable(newGrid, c)) clearedCols.push(c);
  }

  let cellsCleared = 0;
  let bonusCellsCleared = 0;
  let obstaclesDamaged = 0;

  // Build set of cleared positions
  const clearedSet = new Set<string>();
  for (const r of clearedRows) for (let c = 0; c < GRID_COLS; c++) clearedSet.add(`${r},${c}`);
  for (const c of clearedCols) for (let r = 0; r < GRID_ROWS; r++) clearedSet.add(`${r},${c}`);

  for (const key of clearedSet) {
    const [rs, cs] = key.split(',').map(Number);
    const v = newGrid[rs][cs];
    if (isLocked(v)) continue; // locked never clears
    if (isObstacle(v)) {
      // Damage obstacle
      const hp = v - CELL_OBSTACLE_BASE;
      if (hp <= 1) {
        newGrid[rs][cs] = -1;
        obstaclesDamaged++;
        cellsCleared++;
      } else {
        newGrid[rs][cs] = CELL_OBSTACLE_BASE + (hp - 1);
        obstaclesDamaged++;
        // Row/col with obstacle still "cleared" but obstacle stays damaged
      }
    } else {
      if (isBonusFilled(v)) bonusCellsCleared++;
      cellsCleared++;
      newGrid[rs][cs] = -1;
    }
  }

  // After clearing, adjacent cells to damaged obstacles get checked
  // (obstacles block line clear — we need to re-check if a line truly cleared)
  // Re-mark rows/cols that still have obstacles as "not cleared"
  const trueClearedRows = clearedRows.filter(r =>
    newGrid[r].every(v => v === -1 || v === CELL_BONUS_BASE)
  );
  const trueClearedCols = clearedCols.filter(c =>
    newGrid.every(row => row[c] === -1 || row[c] === CELL_BONUS_BASE)
  );

  return {
    grid: newGrid,
    linesCleared: trueClearedRows.length + trueClearedCols.length,
    cellsCleared,
    clearedRows: trueClearedRows,
    clearedCols: trueClearedCols,
    bonusCellsCleared,
    obstaclesDamaged,
  };
}

export function calculateScore(
  linesCleared: number,
  combo: number,
  cellsCleared: number,
  bonusCells: number
): number {
  if (linesCleared === 0 && bonusCells === 0) return 0;
  const base = linesCleared === 0 ? 0
    : linesCleared === 1 ? 100
    : linesCleared === 2 ? 300
    : linesCleared === 3 ? 600
    : 1000 + (linesCleared - 3) * 400;
  const comboBonus = combo > 1 ? Math.floor(base * 0.5 * (combo - 1)) : 0;
  const cellBonus = cellsCleared * 2;
  const bonusBonus = bonusCells * 50; // bonus zone = 50 extra per cell
  return base + comboBonus + cellBonus + bonusBonus;
}

export function canAnyPieceBePlaced(grid: Grid, pieces: (Piece | null)[]): boolean {
  for (const piece of pieces) {
    if (!piece) continue;
    for (let r = 0; r < GRID_ROWS; r++)
      for (let c = 0; c < GRID_COLS; c++)
        if (canPlace(grid, piece, r, c)) return true;
  }
  return false;
}

export function getPlacementCells(piece: Piece, row: number, col: number): Array<[number, number]> {
  const cells: Array<[number, number]> = [];
  for (let r = 0; r < piece.shape.length; r++)
    for (let c = 0; c < piece.shape[r].length; c++)
      if (piece.shape[r][c]) cells.push([row + r, col + c]);
  return cells;
}

export function getValidPlacements(grid: Grid, piece: Piece): Array<[number, number]> {
  const valid: Array<[number, number]> = [];
  for (let r = 0; r < GRID_ROWS; r++)
    for (let c = 0; c < GRID_COLS; c++)
      if (canPlace(grid, piece, r, c)) valid.push([r, c]);
  return valid;
}

// Randomly spawn new obstacle in an empty cell (called after placing piece at high levels)
export function spawnObstacle(grid: Grid, count: number = 1): Grid {
  const newGrid = grid.map(r => [...r]);
  const empties: [number, number][] = [];
  for (let r = 0; r < GRID_ROWS; r++)
    for (let c = 0; c < GRID_COLS; c++)
      if (newGrid[r][c] === -1) empties.push([r, c]);

  for (let i = 0; i < count && empties.length > 0; i++) {
    const idx = Math.floor(Math.random() * empties.length);
    const [r, c] = empties.splice(idx, 1)[0];
    newGrid[r][c] = CELL_OBSTACLE_BASE + 1; // 1 HP
  }
  return newGrid;
}
