import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { COLORS, SIZES } from '../theme';

interface Props {
  colorIndex: number;
  isHighlighted: boolean;
  isValidTarget: boolean;
  isTutorialTarget: boolean;
  isClearingRow: boolean;
  isClearingCol: boolean;
}

export const GridCell = React.memo(({
  colorIndex, isHighlighted, isValidTarget, isTutorialTarget, isClearingRow, isClearingCol,
}: Props) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const prevColorRef = useRef(colorIndex);
  const isClearing = isClearingRow || isClearingCol;

  useEffect(() => {
    const wasEmpty = prevColorRef.current === -1;
    const nowFilled = colorIndex !== -1;
    prevColorRef.current = colorIndex;
    if (wasEmpty && nowFilled) {
      scaleAnim.setValue(0.5);
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 300, friction: 10 }).start();
    }
  }, [colorIndex]);

  useEffect(() => {
    if (isClearing) {
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.35, duration: 70, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0, duration: 160, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 0, useNativeDriver: true }),
      ]).start();
    }
  }, [isClearing]);

  // Tutorial pulse
  const tutorialPulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (isTutorialTarget) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(tutorialPulse, { toValue: 0.6, duration: 400, useNativeDriver: true }),
          Animated.timing(tutorialPulse, { toValue: 1, duration: 400, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      tutorialPulse.setValue(1);
    }
  }, [isTutorialTarget]);

  const isEmpty = colorIndex === -1;
  const color = isEmpty ? undefined : COLORS.blocks[colorIndex % COLORS.blocks.length];
  const glow = isEmpty ? undefined : COLORS.blockGlow[colorIndex % COLORS.blockGlow.length];

  return (
    <View style={styles.cellWrapper}>
      <Animated.View
        style={[
          styles.cell,
          !isEmpty && { backgroundColor: color, shadowColor: glow, shadowOpacity: 1, shadowRadius: 6, elevation: 4 },
          isEmpty && !isHighlighted && !isValidTarget && !isTutorialTarget && styles.emptyCell,
          isHighlighted && styles.highlighted,
          isValidTarget && styles.validTarget,
          isTutorialTarget && { opacity: tutorialPulse },
          isTutorialTarget && styles.tutorialTarget,
          { transform: [{ scale: scaleAnim }] },
        ]}
      />
    </View>
  );
});

const S = SIZES.CELL_SIZE;

const styles = StyleSheet.create({
  cellWrapper: { width: S, height: S, padding: 1 },
  cell: { flex: 1, borderRadius: 5 },
  emptyCell: {
    backgroundColor: COLORS.bgGrid,
    borderWidth: 1,
    borderColor: COLORS.gridLine,
  },
  highlighted: {
    backgroundColor: 'rgba(108,99,255,0.65)',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  validTarget: {
    backgroundColor: COLORS.bgGrid,
    borderWidth: 1,
    borderColor: 'rgba(108,99,255,0.3)',
  },
  tutorialTarget: {
    backgroundColor: 'rgba(255,215,0,0.4)',
    borderWidth: 2,
    borderColor: COLORS.gold,
  },
});
