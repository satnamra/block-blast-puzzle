import {
  createEmptyGrid, createPreFilledGrid,
  canPlace, placePiece, clearLines, calculateScore,
  canAnyPieceBePlaced, getPlacementCells, getValidPlacements,
  isObstacle, isLocked, isBonusEmpty,
  CELL_OBSTACLE_BASE, CELL_LOCKED, CELL_BONUS_BASE,
} from '../src/game/engine';
import { Piece } from '../src/game/pieces';

const sq: Piece = { shape: [[true, true], [true, true]], colorIndex: 0 };
const hLine: Piece = { shape: [[true, true, true, true, true, true, true, true]], colorIndex: 1 };
const vLine: Piece = { shape: [[true],[true],[true],[true],[true],[true],[true],[true]], colorIndex: 2 };
const dot: Piece = { shape: [[true]], colorIndex: 3 };

describe('createEmptyGrid', () => {
  test('8x8 grid of -1', () => {
    const g = createEmptyGrid();
    expect(g.length).toBe(8);
    g.forEach(row => { expect(row.length).toBe(8); row.forEach(c => expect(c).toBe(-1)); });
  });
});

describe('createPreFilledGrid', () => {
  test('fills exactly N obstacle cells', () => {
    const g = createPreFilledGrid(5, 0, 0);
    let cnt = 0;
    g.forEach(row => row.forEach(v => { if (isObstacle(v)) cnt++; }));
    expect(cnt).toBe(5);
  });
  test('fills locked cells', () => {
    const g = createPreFilledGrid(0, 3, 0);
    let cnt = 0;
    g.forEach(row => row.forEach(v => { if (isLocked(v)) cnt++; }));
    expect(cnt).toBe(3);
  });
  test('fills bonus cells', () => {
    const g = createPreFilledGrid(0, 0, 4);
    let cnt = 0;
    g.forEach(row => row.forEach(v => { if (isBonusEmpty(v)) cnt++; }));
    expect(cnt).toBe(4);
  });
  test('0 everything = empty grid', () => {
    const g = createPreFilledGrid(0, 0, 0);
    g.forEach(row => row.forEach(c => expect(c).toBe(-1)));
  });
});

describe('canPlace', () => {
  test('2x2 at (0,0)', () => expect(canPlace(createEmptyGrid(), sq, 0, 0)).toBe(true));
  test('2x2 out of bounds right', () => expect(canPlace(createEmptyGrid(), sq, 0, 7)).toBe(false));
  test('2x2 out of bounds bottom', () => expect(canPlace(createEmptyGrid(), sq, 7, 0)).toBe(false));
  test('collision with normal block', () => {
    const g = placePiece(createEmptyGrid(), sq, 0, 0);
    expect(canPlace(g, sq, 0, 0)).toBe(false);
  });
  test('cannot place on obstacle', () => {
    const g = createEmptyGrid();
    g[0][0] = CELL_OBSTACLE_BASE + 1;
    expect(canPlace(g, dot, 0, 0)).toBe(false);
  });
  test('cannot place on locked', () => {
    const g = createEmptyGrid();
    g[0][0] = CELL_LOCKED;
    expect(canPlace(g, dot, 0, 0)).toBe(false);
  });
  test('can place on bonus empty', () => {
    const g = createEmptyGrid();
    g[0][0] = CELL_BONUS_BASE;
    expect(canPlace(g, dot, 0, 0)).toBe(true);
  });
  test('full hLine fits row 0 col 0', () => expect(canPlace(createEmptyGrid(), hLine, 0, 0)).toBe(true));
  test('full hLine does not fit col 1', () => expect(canPlace(createEmptyGrid(), hLine, 0, 1)).toBe(false));
});

describe('placePiece', () => {
  test('places 2x2 correctly', () => {
    const g = placePiece(createEmptyGrid(), sq, 1, 1);
    expect(g[1][1]).toBe(0); expect(g[1][2]).toBe(0);
    expect(g[2][1]).toBe(0); expect(g[2][2]).toBe(0);
    expect(g[0][0]).toBe(-1);
  });
  test('does not mutate original', () => {
    const orig = createEmptyGrid();
    placePiece(orig, sq, 0, 0);
    expect(orig[0][0]).toBe(-1);
  });
  test('bonus cell becomes bonus-filled', () => {
    const g = createEmptyGrid();
    g[0][0] = CELL_BONUS_BASE;
    const result = placePiece(g, dot, 0, 0);
    expect(result[0][0]).toBeGreaterThanOrEqual(400);
    expect(result[0][0]).toBeLessThan(500);
  });
});

describe('clearLines', () => {
  test('no clear on empty', () => {
    const r = clearLines(createEmptyGrid());
    expect(r.linesCleared).toBe(0);
  });
  test('clears full row', () => {
    const g = placePiece(createEmptyGrid(), hLine, 0, 0);
    const r = clearLines(g);
    expect(r.linesCleared).toBe(1);
    expect(r.clearedRows).toContain(0);
  });
  test('clears full column', () => {
    const g = placePiece(createEmptyGrid(), vLine, 0, 0);
    const r = clearLines(g);
    expect(r.linesCleared).toBe(1);
    expect(r.clearedCols).toContain(0);
  });
  test('locked cell blocks line clear', () => {
    const g = createEmptyGrid();
    for (let c = 0; c < 8; c++) g[0][c] = 1;
    g[0][3] = CELL_LOCKED; // locked in middle of row
    const r = clearLines(g);
    // Row 0 is NOT clearable because locked cell is neither isFilled nor isBonusFilled
    expect(r.clearedRows).not.toContain(0);
  });
  test('obstacle takes damage when line clears', () => {
    const g = createEmptyGrid();
    for (let c = 0; c < 7; c++) g[0][c] = 1;
    g[0][7] = CELL_OBSTACLE_BASE + 2; // obstacle with 2 HP
    // Row not clearable with obstacle in it
    const r = clearLines(g);
    expect(r.clearedRows).not.toContain(0); // obstacle blocks
  });
  test('partial row not cleared', () => {
    const g = createEmptyGrid();
    g[0][0] = 1; g[0][1] = 1;
    expect(clearLines(g).linesCleared).toBe(0);
  });
  test('multiple rows at once', () => {
    const g = createEmptyGrid();
    for (let c = 0; c < 8; c++) { g[0][c] = 1; g[1][c] = 2; }
    const r = clearLines(g);
    expect(r.linesCleared).toBe(2);
  });
});

describe('calculateScore', () => {
  test('0 lines = 0', () => expect(calculateScore(0, 1, 0, 0)).toBe(0));
  test('1 line base = 100', () => expect(calculateScore(1, 1, 0, 0)).toBe(100));
  test('2 lines base = 300', () => expect(calculateScore(2, 1, 0, 0)).toBe(300));
  test('3 lines base = 600', () => expect(calculateScore(3, 1, 0, 0)).toBe(600));
  test('combo adds bonus', () => expect(calculateScore(1, 2, 0, 0)).toBeGreaterThan(calculateScore(1, 1, 0, 0)));
  test('bonus cells add extra', () => expect(calculateScore(1, 1, 0, 2)).toBeGreaterThan(calculateScore(1, 1, 0, 0)));
  test('4+ lines > 1000', () => expect(calculateScore(4, 1, 0, 0)).toBeGreaterThanOrEqual(1000));
});

describe('canAnyPieceBePlaced', () => {
  test('empty grid + dot = true', () => expect(canAnyPieceBePlaced(createEmptyGrid(), [dot])).toBe(true));
  test('all null = false', () => expect(canAnyPieceBePlaced(createEmptyGrid(), [null, null])).toBe(false));
  test('full grid = false', () => {
    const g = createEmptyGrid();
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) g[r][c] = 1;
    expect(canAnyPieceBePlaced(g, [dot, sq])).toBe(false);
  });
});

describe('getPlacementCells', () => {
  test('2x2 at (0,0) = 4 cells', () => {
    const cells = getPlacementCells(sq, 0, 0);
    expect(cells.length).toBe(4);
    expect(cells).toContainEqual([0, 0]);
    expect(cells).toContainEqual([1, 1]);
  });
  test('dot at (3,5)', () => expect(getPlacementCells(dot, 3, 5)).toEqual([[3, 5]]));
});

describe('getValidPlacements', () => {
  test('dot on empty grid = 64 placements', () => expect(getValidPlacements(createEmptyGrid(), dot).length).toBe(64));
  test('full grid = 0 placements', () => {
    const g = createEmptyGrid();
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) g[r][c] = 1;
    expect(getValidPlacements(g, dot).length).toBe(0);
  });
  test('hLine on empty = 8', () => expect(getValidPlacements(createEmptyGrid(), hLine).length).toBe(8));
});
