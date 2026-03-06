/**
 * GameGrid — 8×8 board with integrated touch tracking.
 *
 * When a piece is selected:
 *   • Moving finger over the grid shows a ghost of the piece in real-time.
 *   • Lifting the finger places the piece (if valid position).
 *   • Invalid positions show a red ghost.
 *
 * This uses a PanResponder overlay on top of the visual grid so the user
 * simply slides their finger to aim and lifts to place — no "tap on exact cell" needed.
 */
import React, { useRef, useCallback } from 'react';
import { View, StyleSheet, PanResponder, Text } from 'react-native';
import {
  Grid, canPlace, getPlacementCells, getValidPlacements,
  isObstacle, isLocked, isBonusEmpty, isBonusFilled, getColorIndex,
  CELL_OBSTACLE_BASE,
} from '../game/engine';
import { Piece } from '../game/pieces';
import { SIZES, COLORS } from '../theme';

const { GRID_ROWS, GRID_COLS, CELL_SIZE, CELL_GAP } = SIZES;
const CELL_TOTAL = CELL_SIZE + CELL_GAP;
const GRID_PADDING = 4;

interface Props {
  grid: Grid;
  activePiece: Piece | null;
  hoverRow: number | null;
  hoverCol: number | null;
  clearingRows: number[];
  clearingCols: number[];
  onHoverChange: (row: number | null, col: number | null) => void;
  onPlace: (row: number, col: number) => void;
  onLayout?: () => void;
}

export const GameGrid = React.memo(function GameGrid({
  grid, activePiece, hoverRow, hoverCol,
  clearingRows, clearingCols, onHoverChange, onPlace,
}: Props) {
  const gridRef = useRef<View>(null);
  const originRef = useRef<{ x: number; y: number } | null>(null);

  // Refs so PanResponder always sees current values (avoids stale closures)
  const activePieceRef = useRef(activePiece);
  const onHoverRef = useRef(onHoverChange);
  const onPlaceRef = useRef(onPlace);
  activePieceRef.current = activePiece;
  onHoverRef.current = onHoverChange;
  onPlaceRef.current = onPlace;

  const touchToCell = (pageX: number, pageY: number) => {
    if (!originRef.current) return null;
    const relX = pageX - originRef.current.x - GRID_PADDING;
    const relY = pageY - originRef.current.y - GRID_PADDING;
    const col = Math.floor(relX / CELL_TOTAL);
    const row = Math.floor(relY / CELL_TOTAL);
    if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) return null;
    return { row, col };
  };

  const measureGrid = () => {
    gridRef.current?.measure((_x, _y, _w, _h, pageX, pageY) => {
      originRef.current = { x: pageX, y: pageY };
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => activePieceRef.current !== null,
      onMoveShouldSetPanResponder: () => activePieceRef.current !== null,

      onPanResponderGrant: (e) => {
        measureGrid();
        const cell = touchToCell(e.nativeEvent.pageX, e.nativeEvent.pageY);
        if (cell) onHoverRef.current(cell.row, cell.col);
      },
      onPanResponderMove: (e) => {
        const cell = touchToCell(e.nativeEvent.pageX, e.nativeEvent.pageY);
        onHoverRef.current(cell ? cell.row : null, cell ? cell.col : null);
      },
      onPanResponderRelease: (e) => {
        const cell = touchToCell(e.nativeEvent.pageX, e.nativeEvent.pageY);
        if (cell) onPlaceRef.current(cell.row, cell.col);
        onHoverRef.current(null, null);
      },
      onPanResponderTerminate: () => {
        onHoverRef.current(null, null);
      },
    })
  ).current;

  // Compute highlights
  const highlightSet = React.useMemo(() => {
    if (!activePiece || hoverRow === null || hoverCol === null) return new Set<string>();
    if (!canPlace(grid, activePiece, hoverRow, hoverCol)) return new Set<string>();
    return new Set(getPlacementCells(activePiece, hoverRow, hoverCol).map(([r, c]) => `${r},${c}`));
  }, [activePiece, hoverRow, hoverCol, grid]);

  const invalidSet = React.useMemo(() => {
    if (!activePiece || hoverRow === null || hoverCol === null) return new Set<string>();
    if (canPlace(grid, activePiece, hoverRow, hoverCol)) return new Set<string>();
    // Show the piece shape as invalid (red)
    const cells = getPlacementCells(activePiece, hoverRow, hoverCol);
    return new Set(
      cells
        .filter(([r, c]) => r >= 0 && r < GRID_ROWS && c >= 0 && c < GRID_COLS)
        .map(([r, c]) => `${r},${c}`)
    );
  }, [activePiece, hoverRow, hoverCol, grid]);

  const validSet = React.useMemo(() => {
    if (!activePiece) return new Set<string>();
    const s = new Set<string>();
    getValidPlacements(grid, activePiece).forEach(([r, c]) =>
      getPlacementCells(activePiece, r, c).forEach(([cr, cc]) => s.add(`${cr},${cc}`))
    );
    return s;
  }, [activePiece, grid]);

  return (
    <View
      ref={gridRef}
      style={styles.grid}
      onLayout={() => setTimeout(measureGrid, 80)}
    >
      {/* Visual grid cells */}
      {grid.map((rowArr, r) => (
        <View key={r} style={styles.row}>
          {rowArr.map((cellValue, c) => {
            const key = `${r},${c}`;
            const isHL = highlightSet.has(key);
            const isInv = !isHL && invalidSet.has(key);
            const isValid = !isHL && !isInv && activePiece !== null && validSet.has(key);
            const isClearing = clearingRows.includes(r) || clearingCols.includes(c);
            const obstacle = isObstacle(cellValue);
            const locked = isLocked(cellValue);
            const bonusEmpty = isBonusEmpty(cellValue);
            const bonusFill = isBonusFilled(cellValue);
            const colorIdx = getColorIndex(cellValue);
            const color = colorIdx >= 0 ? COLORS.blocks[colorIdx % COLORS.blocks.length] : undefined;
            const glow = colorIdx >= 0 ? COLORS.blockGlow[colorIdx % COLORS.blockGlow.length] : undefined;

            return (
              <View
                key={key}
                style={[
                  styles.cell,
                  // Filled normal block
                  colorIdx >= 0 && !bonusFill && !isClearing && {
                    backgroundColor: color,
                    shadowColor: glow, shadowOpacity: 0.7,
                    shadowRadius: 5, elevation: 4,
                  },
                  // Bonus-filled (golden border)
                  bonusFill && !isClearing && {
                    backgroundColor: color,
                    shadowColor: COLORS.gold, shadowOpacity: 1,
                    shadowRadius: 8, elevation: 6,
                    borderWidth: 1.5, borderColor: COLORS.gold,
                  },
                  // Empty
                  cellValue === -1 && !isHL && !isInv && !isValid && styles.emptyCell,
                  // Bonus empty
                  bonusEmpty && !isHL && styles.bonusCell,
                  // Obstacle
                  obstacle && styles.obstacleCell,
                  // Locked
                  locked && styles.lockedCell,
                  // Ghost valid (green-purple)
                  isHL && styles.ghostValid,
                  // Ghost invalid (red)
                  isInv && styles.ghostInvalid,
                  // Valid zone hint (subtle)
                  isValid && styles.validHint,
                  // Clearing flash (gold)
                  isClearing && colorIdx >= 0 && styles.clearing,
                ]}
              >
                {obstacle && <Text style={styles.obstacleHp}>{cellValue - CELL_OBSTACLE_BASE}</Text>}
                {locked && <Text style={styles.lockIcon}>🔒</Text>}
                {bonusEmpty && !isHL && <Text style={styles.bonusStar}>⭐</Text>}
              </View>
            );
          })}
        </View>
      ))}

      {/* Transparent touch overlay — always active, responder decides based on activePieceRef */}
      <View
        style={StyleSheet.absoluteFill}
        {...panResponder.panHandlers}
      />
    </View>
  );
});

const CS = CELL_SIZE;
const CG = CELL_GAP;

const styles = StyleSheet.create({
  grid: {
    backgroundColor: COLORS.bgGrid,
    borderRadius: 16,
    padding: GRID_PADDING,
    borderWidth: 1.5,
    borderColor: COLORS.gridLine,
    shadowColor: '#7C3AED',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  row: { flexDirection: 'row' },
  cell: {
    width: CS, height: CS,
    margin: CG / 2,
    borderRadius: SIZES.BORDER_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCell: {
    backgroundColor: '#11112A',
    borderWidth: 1, borderColor: '#1C1C36',
  },
  bonusCell: {
    backgroundColor: 'rgba(245,158,11,0.07)',
    borderWidth: 1.5, borderColor: 'rgba(245,158,11,0.35)',
    borderStyle: 'dashed',
  },
  bonusStar: { fontSize: 10 },
  obstacleCell: {
    backgroundColor: '#2D3748',
    borderWidth: 1.5, borderColor: '#4A5568',
    shadowColor: '#718096', shadowOpacity: 0.3, shadowRadius: 3, elevation: 2,
  },
  obstacleHp: { color: '#CBD5E0', fontSize: 12, fontWeight: '900' },
  lockedCell: {
    backgroundColor: '#1A1A35',
    borderWidth: 2, borderColor: '#3D3D60',
  },
  lockIcon: { fontSize: 10 },
  // Ghost where piece WILL be placed
  ghostValid: {
    backgroundColor: 'rgba(124,58,237,0.75)',
    borderWidth: 1.5, borderColor: '#A78BFA',
    shadowColor: '#7C3AED', shadowOpacity: 1,
    shadowRadius: 10, elevation: 8,
  },
  // Ghost where piece CANNOT be placed
  ghostInvalid: {
    backgroundColor: 'rgba(239,68,68,0.45)',
    borderWidth: 1.5, borderColor: 'rgba(239,68,68,0.9)',
  },
  // Subtle hint that piece can go here
  validHint: {
    backgroundColor: '#11112A',
    borderWidth: 1, borderColor: 'rgba(124,58,237,0.3)',
  },
  clearing: {
    backgroundColor: '#F59E0B',
    shadowColor: '#F59E0B', shadowOpacity: 1,
    shadowRadius: 14, elevation: 10,
  },
});
