import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, StyleSheet, Text, TouchableOpacity,
  Animated, SafeAreaView, Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useGameState } from '../hooks/useGameState';
import { GameGrid } from '../components/GameGrid';
import { PieceTray } from '../components/PieceTray';
import { FloatingScore } from '../components/FloatingScore';
import { LevelUpModal } from '../components/LevelUpModal';
import { COLORS } from '../theme';
import { canPlace } from '../game/engine';
import { getNextLevel, getProgressToNextLevel } from '../game/levels';
import { markTutorialDone } from '../game/storage';

interface Props {
  highScore: number;
  onHighScoreChange: (s: number) => void;
  onBackToMenu: () => void;
  skipTutorial: boolean;
}

export function GameScreen({ highScore, onHighScoreChange, onBackToMenu, skipTutorial }: Props) {
  const { state, startGame, placePieceAt, dismissLevelUp, removePopup } = useGameState(highScore);
  const slotRefs = useRef<(View | null)[]>([null, null, null]);

  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [hoverRow, setHoverRow] = useState<number | null>(null);
  const [hoverCol, setHoverCol] = useState<number | null>(null);
  const [clearingRows, setClearingRows] = useState<number[]>([]);
  const [clearingCols, setClearingCols] = useState<number[]>([]);
  const [tutorialDone, setTutorialDone] = useState(skipTutorial);

  const gameoverOpacity = useRef(new Animated.Value(0)).current;
  const gameoverScale = useRef(new Animated.Value(0.8)).current;
  const scoreScale = useRef(new Animated.Value(1)).current;
  const prevScore = useRef(0);

  const haptic = useCallback((t: 'light' | 'medium' | 'error' | 'select') => {
    if (Platform.OS === 'web') return;
    if (t === 'error') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    else if (t === 'medium') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    else if (t === 'select') Haptics.selectionAsync();
    else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  useEffect(() => { startGame(highScore); }, []);

  useEffect(() => {
    if (state.highScore > highScore) onHighScoreChange(state.highScore);
  }, [state.highScore]);

  // Score pop animation
  useEffect(() => {
    if (state.score !== prevScore.current) {
      prevScore.current = state.score;
      Animated.sequence([
        Animated.timing(scoreScale, { toValue: 1.3, duration: 80, useNativeDriver: true }),
        Animated.spring(scoreScale, { toValue: 1, useNativeDriver: true, tension: 400 }),
      ]).start();
    }
  }, [state.score]);

  // Deselect used piece
  useEffect(() => {
    if (selectedIdx !== null && state.pieces[selectedIdx] === null) {
      setSelectedIdx(null); setHoverRow(null); setHoverCol(null);
    }
  }, [state.pieces]);

  // Game over animation
  useEffect(() => {
    if (state.status === 'gameover') {
      Animated.parallel([
        Animated.timing(gameoverOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(gameoverScale, { toValue: 1, useNativeDriver: true, tension: 160 }),
      ]).start();
      haptic('error');
    } else {
      gameoverOpacity.setValue(0);
      gameoverScale.setValue(0.8);
    }
  }, [state.status]);

  // Line clear animation
  useEffect(() => {
    if (state.lastClearInfo && (state.lastClearInfo.rows.length || state.lastClearInfo.cols.length)) {
      setClearingRows(state.lastClearInfo.rows);
      setClearingCols(state.lastClearInfo.cols);
      haptic('medium');
      const t = setTimeout(() => { setClearingRows([]); setClearingCols([]); }, 380);
      return () => clearTimeout(t);
    }
  }, [state.lastClearInfo]);

  const handleSelectPiece = useCallback((idx: number) => {
    if (!state.pieces[idx]) return;
    setSelectedIdx(prev => {
      if (prev === idx) { setHoverRow(null); setHoverCol(null); return null; }
      setHoverRow(null); setHoverCol(null);
      return idx;
    });
    haptic('select');
    if (!tutorialDone) { setTutorialDone(true); markTutorialDone().catch(() => {}); }
  }, [state.pieces, tutorialDone]);

  const handleHoverChange = useCallback((row: number | null, col: number | null) => {
    setHoverRow(row);
    setHoverCol(col);
  }, []);

  const handlePlace = useCallback((row: number, col: number) => {
    if (selectedIdx === null) return;
    const piece = state.pieces[selectedIdx];
    if (!piece) return;
    if (!canPlace(state.grid, piece, row, col)) { haptic('light'); return; }
    placePieceAt(selectedIdx, row, col);
    haptic('medium');
    setSelectedIdx(null);
    setHoverRow(null);
    setHoverCol(null);
  }, [selectedIdx, state.pieces, state.grid, placePieceAt]);

  const activePiece = selectedIdx !== null ? (state.pieces[selectedIdx] ?? null) : null;
  const nextLevel = getNextLevel(state.score);
  const progress = getProgressToNextLevel(state.score);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.root}>

        {/* ── HEADER ── */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onBackToMenu}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.backBtn}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>

          <View style={styles.scorePair}>
            <View style={styles.scoreCard}>
              <Text style={styles.scoreCardLabel}>SCORE</Text>
              <Animated.Text style={[styles.scoreCardNum, { transform: [{ scale: scoreScale }] }]}>
                {state.score.toLocaleString()}
              </Animated.Text>
            </View>
            <View style={[styles.scoreCard, styles.bestCard]}>
              <Text style={styles.scoreCardLabel}>BEST</Text>
              <Text style={[styles.scoreCardNum, { color: COLORS.gold }]}>
                {state.highScore.toLocaleString()}
              </Text>
            </View>
          </View>

          {state.combo > 1 ? (
            <View style={styles.comboBadge}>
              <Text style={styles.comboText}>🔥×{state.combo}</Text>
            </View>
          ) : (
            <View style={{ width: 52 }} />
          )}
        </View>

        {/* ── LEVEL BAR ── */}
        <View style={styles.levelRow}>
          <View style={[styles.levelPill, { borderColor: state.level.color + '80' }]}>
            <View style={[styles.levelDot, { backgroundColor: state.level.color }]} />
            <Text style={[styles.levelTxt, { color: state.level.color }]}>
              Lv.{state.level.level} {state.level.name}
            </Text>
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, {
              backgroundColor: state.level.color,
              width: `${Math.round(progress * 100)}%` as any,
            }]} />
          </View>
          {nextLevel && (
            <Text style={styles.nextTxt}>{nextLevel.scoreThreshold.toLocaleString()}</Text>
          )}
        </View>

        {/* ── GRID ── */}
        <View style={styles.gridWrap}>
          <GameGrid
            grid={state.grid}
            activePiece={activePiece}
            hoverRow={hoverRow}
            hoverCol={hoverCol}
            clearingRows={clearingRows}
            clearingCols={clearingCols}
            onHoverChange={handleHoverChange}
            onPlace={handlePlace}
          />
          {state.scorePopups.map(p => (
            <FloatingScore key={p.id} id={p.id} value={p.value} label={p.label} onDone={removePopup} />
          ))}
        </View>

        {/* ── STEP INDICATOR ── */}
        {state.status === 'playing' && (
          <View style={styles.stepRow}>
            <StepChip
              n={1} label={selectedIdx === null ? 'TAP PIECE' : 'PIECE SELECTED'}
              active={selectedIdx === null} done={selectedIdx !== null}
            />
            <View style={styles.stepArrow}><Text style={styles.stepArrowTxt}>→</Text></View>
            <StepChip
              n={2} label="TAP GRID"
              active={selectedIdx !== null} done={false}
            />
          </View>
        )}

        {/* ── TRAY ── */}
        {state.status === 'playing' && (
          <PieceTray
            pieces={state.pieces}
            selectedIndex={selectedIdx}
            onSelectPiece={handleSelectPiece}
          />
        )}

        {/* ── LEVEL UP ── */}
        <LevelUpModal level={state.level} visible={state.leveledUp} onContinue={dismissLevelUp} />

        {/* ── GAME OVER ── */}
        {state.status === 'gameover' && (
          <Animated.View style={[styles.overlay, { opacity: gameoverOpacity }]}>
            <Animated.View style={[styles.goCard, { transform: [{ scale: gameoverScale }] }]}>
              <Text style={styles.goLabel}>GAME OVER</Text>
              <Text style={styles.goScore}>{state.score.toLocaleString()}</Text>
              <Text style={styles.goPts}>points</Text>

              <View style={styles.goStats}>
                <GoStat label="Lines" value={`${state.totalLines}`} />
                <View style={styles.goStatDivider} />
                <GoStat label="Level" value={`${state.level.level}`} />
                <View style={styles.goStatDivider} />
                <GoStat label="Combo" value={`×${state.combo}`} />
              </View>

              {state.score > 0 && state.score >= state.highScore && (
                <Text style={styles.newBest}>⭐ NEW BEST!</Text>
              )}

              <TouchableOpacity style={styles.replayBtn} onPress={() => startGame(state.highScore)}>
                <Text style={styles.replayTxt}>PLAY AGAIN</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onBackToMenu} style={styles.goMenuBtn}>
                <Text style={styles.goMenuTxt}>← Menu</Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
}

function StepChip({ n, label, active, done }: { n: number; label: string; active: boolean; done: boolean }) {
  return (
    <View style={[chip.wrap, active && chip.wrapActive, done && chip.wrapDone]}>
      <View style={[chip.num, active && chip.numActive, done && chip.numDone]}>
        <Text style={chip.numTxt}>{done ? '✓' : n}</Text>
      </View>
      <Text style={[chip.label, active && chip.labelActive]}>{label}</Text>
    </View>
  );
}

function GoStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={{ color: COLORS.text, fontSize: 24, fontWeight: '900' }}>{value}</Text>
      <Text style={{ color: COLORS.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

const chip = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.bgCard, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: COLORS.gridLine,
  },
  wrapActive: { borderColor: COLORS.primary, backgroundColor: 'rgba(124,58,237,0.1)' },
  wrapDone: { borderColor: COLORS.success + '80', backgroundColor: 'rgba(16,185,129,0.08)' },
  num: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: COLORS.bgCardHigh,
    alignItems: 'center', justifyContent: 'center',
  },
  numActive: { backgroundColor: COLORS.primary },
  numDone: { backgroundColor: COLORS.success },
  numTxt: { color: '#fff', fontSize: 10, fontWeight: '900' },
  label: { color: COLORS.textMuted, fontSize: 11, fontWeight: '700' },
  labelActive: { color: COLORS.text },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  root: { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', width: '100%',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 10,
  },
  backBtn: { width: 36, alignItems: 'flex-start' },
  backIcon: { color: COLORS.textSub, fontSize: 22 },

  scorePair: { flexDirection: 'row', gap: 8 },
  scoreCard: {
    alignItems: 'center', backgroundColor: COLORS.bgCard,
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 6,
    borderWidth: 1, borderColor: COLORS.gridLine, minWidth: 88,
  },
  bestCard: {},
  scoreCardLabel: { color: COLORS.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 2 },
  scoreCardNum: { color: COLORS.text, fontSize: 22, fontWeight: '900', marginTop: 1 },

  comboBadge: {
    backgroundColor: 'rgba(236,72,153,0.12)', borderRadius: 12,
    paddingHorizontal: 8, paddingVertical: 4, width: 52, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.accent + '80',
  },
  comboText: { color: COLORS.accent, fontSize: 12, fontWeight: '800' },

  levelRow: {
    flexDirection: 'row', alignItems: 'center',
    width: '100%', paddingHorizontal: 16,
    gap: 8, marginBottom: 10,
  },
  levelPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 20, borderWidth: 1,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  levelDot: { width: 6, height: 6, borderRadius: 3 },
  levelTxt: { fontSize: 11, fontWeight: '800' },
  progressBg: {
    flex: 1, height: 5, backgroundColor: COLORS.bgCardHigh,
    borderRadius: 3, overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 3 },
  nextTxt: { color: COLORS.textMuted, fontSize: 9, fontWeight: '600' },

  gridWrap: { position: 'relative', marginBottom: 10 },

  stepRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 8, marginBottom: 8, paddingHorizontal: 16,
  },
  stepArrow: {},
  stepArrowTxt: { color: COLORS.textMuted, fontSize: 14 },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,28,0.94)',
    alignItems: 'center', justifyContent: 'center', zIndex: 500,
  },
  goCard: {
    backgroundColor: COLORS.bgCard, borderRadius: 28,
    padding: 32, alignItems: 'center', width: 300,
    borderWidth: 1, borderColor: COLORS.gridLine,
    shadowColor: COLORS.primary, shadowOpacity: 0.25,
    shadowRadius: 30, elevation: 20,
  },
  goLabel: { color: COLORS.accent, fontSize: 11, fontWeight: '800', letterSpacing: 4 },
  goScore: { color: COLORS.text, fontSize: 64, fontWeight: '900', lineHeight: 72 },
  goPts: { color: COLORS.textMuted, fontSize: 11, letterSpacing: 3, marginBottom: 20 },
  goStats: {
    flexDirection: 'row', width: '100%', marginBottom: 16,
    backgroundColor: COLORS.bgGrid, borderRadius: 16,
    paddingVertical: 14, paddingHorizontal: 8,
    borderWidth: 1, borderColor: COLORS.gridLine,
  },
  goStatDivider: { width: 1, backgroundColor: COLORS.gridLine },
  newBest: { color: COLORS.gold, fontWeight: '800', fontSize: 14, letterSpacing: 1, marginBottom: 16 },
  replayBtn: {
    backgroundColor: COLORS.primary, borderRadius: 16,
    paddingHorizontal: 52, paddingVertical: 16, width: '100%', alignItems: 'center',
    shadowColor: COLORS.primary, shadowOpacity: 0.5, shadowRadius: 15, elevation: 8,
  },
  replayTxt: { color: '#fff', fontWeight: '900', fontSize: 17, letterSpacing: 2 },
  goMenuBtn: { marginTop: 12, padding: 4 },
  goMenuTxt: { color: COLORS.textMuted, fontSize: 13, fontWeight: '600' },
});
