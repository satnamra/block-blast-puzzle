import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { COLORS } from '../theme';

interface Props {
  score: number;
  highScore: number;
  combo: number;
}

export function ScoreDisplay({ score, highScore, combo }: Props) {
  const scoreScale = useRef(new Animated.Value(1)).current;
  const prevScore = useRef(score);

  useEffect(() => {
    if (score !== prevScore.current) {
      prevScore.current = score;
      Animated.sequence([
        Animated.timing(scoreScale, { toValue: 1.25, duration: 80, useNativeDriver: true }),
        Animated.spring(scoreScale, { toValue: 1, useNativeDriver: true, tension: 400 }),
      ]).start();
    }
  }, [score]);

  return (
    <View style={styles.container}>
      <View style={styles.scoreBox}>
        <Text style={styles.label}>SCORE</Text>
        <Animated.Text style={[styles.score, { transform: [{ scale: scoreScale }] }]}>
          {score.toLocaleString()}
        </Animated.Text>
      </View>

      {combo > 1 && (
        <View style={styles.comboBox}>
          <Text style={styles.comboText}>🔥 x{combo}</Text>
        </View>
      )}

      <View style={styles.scoreBox}>
        <Text style={styles.label}>BEST</Text>
        <Text style={[styles.score, { color: COLORS.gold }]}>
          {highScore.toLocaleString()}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  scoreBox: {
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 6,
    minWidth: 100,
    borderWidth: 1,
    borderColor: COLORS.gridLine,
  },
  label: {
    fontSize: 9,
    color: COLORS.textMuted,
    fontWeight: '700',
    letterSpacing: 2,
  },
  score: {
    fontSize: 20,
    color: COLORS.text,
    fontWeight: '800',
    marginTop: 1,
  },
  comboBox: {
    backgroundColor: 'rgba(255,101,132,0.15)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  comboText: {
    color: COLORS.accent,
    fontWeight: '800',
    fontSize: 15,
  },
});
