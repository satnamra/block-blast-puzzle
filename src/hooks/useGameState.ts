import { useState, useCallback, useRef } from 'react';
import {
  Grid, createEmptyGrid, createPreFilledGrid,
  canPlace, placePiece, clearLines, calculateScore,
  canAnyPieceBePlaced, spawnObstacle,
} from '../game/engine';
import { Piece, generatePieces } from '../game/pieces';
import { getLevelForScore, getNextLevel, LevelConfig } from '../game/levels';
import { saveGameResult } from '../game/storage';

export type GameStatus = 'idle' | 'playing' | 'gameover';

export interface ScorePopup {
  id: number;
  value: number;
  label: string;
}

export interface GameState {
  grid: Grid;
  pieces: (Piece | null)[];
  score: number;
  highScore: number;
  combo: number;
  totalLines: number;
  status: GameStatus;
  level: LevelConfig;
  leveledUp: boolean;
  lastClearInfo: { rows: number[]; cols: number[] } | null;
  scorePopups: ScorePopup[];
}

const PIECE_SLOTS = 3;
let popupId = 0;

export function useGameState(initialHighScore: number) {
  const [state, setState] = useState<GameState>({
    grid: createEmptyGrid(),
    pieces: generatePieces(PIECE_SLOTS),
    score: 0,
    highScore: initialHighScore,
    combo: 0,
    totalLines: 0,
    status: 'idle',
    level: getLevelForScore(0),
    leveledUp: false,
    lastClearInfo: null,
    scorePopups: [],
  });

  const comboRef = useRef(0);
  const totalLinesRef = useRef(0);
  const maxLevelRef = useRef(1);
  const placementCountRef = useRef(0); // for obstacle spawning

  const startGame = useCallback((hs: number) => {
    comboRef.current = 0;
    totalLinesRef.current = 0;
    maxLevelRef.current = 1;
    placementCountRef.current = 0;
    const lvl = getLevelForScore(0);
    const grid = createPreFilledGrid(lvl.obstacleCount, lvl.lockedCount, lvl.bonusCount);
    setState({
      grid,
      pieces: generatePieces(PIECE_SLOTS, lvl.allowedPieceIndices),
      score: 0,
      highScore: hs,
      combo: 0,
      totalLines: 0,
      status: 'playing',
      level: lvl,
      leveledUp: false,
      lastClearInfo: null,
      scorePopups: [],
    });
  }, []);

  const placePieceAt = useCallback((pieceIndex: number, row: number, col: number) => {
    setState(prev => {
      if (prev.status !== 'playing') return prev;
      const piece = prev.pieces[pieceIndex];
      if (!piece || !canPlace(prev.grid, piece, row, col)) return prev;

      placementCountRef.current++;

      let newGrid = placePiece(prev.grid, piece, row, col);

      // Possibly spawn obstacle at this level
      const lvlConfig = prev.level;
      if (
        lvlConfig.obstacleSpawnEvery > 0 &&
        placementCountRef.current % lvlConfig.obstacleSpawnEvery === 0
      ) {
        newGrid = spawnObstacle(newGrid, 1);
      }

      const clearResult = clearLines(newGrid);
      const didClear = clearResult.linesCleared > 0;
      const newCombo = didClear ? comboRef.current + 1 : 0;
      comboRef.current = newCombo;

      const earned = calculateScore(
        clearResult.linesCleared, newCombo,
        clearResult.cellsCleared, clearResult.bonusCellsCleared
      );
      totalLinesRef.current += clearResult.linesCleared;

      const newPieces = [...prev.pieces] as (Piece | null)[];
      newPieces[pieceIndex] = null;

      const newScore = prev.score + earned;
      const newHighScore = Math.max(prev.highScore, newScore);
      const newLevel = getLevelForScore(newScore);
      const leveledUp = newLevel.level > prev.level.level;

      if (newLevel.level > maxLevelRef.current) {
        maxLevelRef.current = newLevel.level;
      }

      const allUsed = newPieces.every(p => p === null);
      let filledPieces = allUsed
        ? generatePieces(PIECE_SLOTS, newLevel.allowedPieceIndices)
        : newPieces;

      const isGameOver = !canAnyPieceBePlaced(clearResult.grid, filledPieces);

      if (isGameOver) {
        saveGameResult(newScore, totalLinesRef.current, comboRef.current, maxLevelRef.current).catch(() => {});
      }

      // Score popups
      const newPopups: ScorePopup[] = [];
      if (earned > 0) {
        let label = '';
        if (clearResult.linesCleared >= 3) label = `${clearResult.linesCleared} LINES!!!`;
        else if (clearResult.linesCleared === 2) label = '2 LINES!';
        else if (newCombo > 1) label = `COMBO ×${newCombo}`;
        else if (clearResult.bonusCellsCleared > 0) label = '⭐ BONUS!';
        else label = '1 LINE';
        newPopups.push({ id: ++popupId, value: earned, label });
      }

      return {
        ...prev,
        grid: clearResult.grid,
        pieces: filledPieces,
        score: newScore,
        highScore: newHighScore,
        combo: newCombo,
        totalLines: totalLinesRef.current,
        status: isGameOver ? 'gameover' : 'playing',
        level: newLevel,
        leveledUp,
        lastClearInfo: didClear
          ? { rows: clearResult.clearedRows, cols: clearResult.clearedCols }
          : null,
        scorePopups: [...prev.scorePopups, ...newPopups],
      };
    });
  }, []);

  const dismissLevelUp = useCallback(() => {
    setState(prev => ({ ...prev, leveledUp: false }));
  }, []);

  const removePopup = useCallback((id: number) => {
    setState(prev => ({ ...prev, scorePopups: prev.scorePopups.filter(p => p.id !== id) }));
  }, []);

  return { state, startGame, placePieceAt, dismissLevelUp, removePopup };
}
