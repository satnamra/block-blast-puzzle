import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { TutorialStep } from '../hooks/useTutorial';
import { COLORS } from '../theme';

interface Props {
  step: TutorialStep;
  onSkip: () => void;
  onClearLineInfoSeen: () => void;
}

const STEPS: Record<TutorialStep, { title: string; body: string; arrow?: 'down' } | null> = {
  select_piece: {
    title: '1. Select a piece',
    body: 'Tap any colored block below to pick it up.',
    arrow: 'down',
  },
  place_piece: {
    title: '2. Place it on the grid',
    body: 'Now tap any highlighted cell on the grid above.',
    arrow: 'down',
  },
  clear_line: {
    title: '3. Clear lines = points!',
    body: 'Fill an entire ROW or COLUMN to clear it.\n\n1 line = +100 pts\n2 lines = +300 pts\nCOMBO = extra bonus!',
  },
  done: null,
};

export function TutorialOverlay({ step, onSkip, onClearLineInfoSeen }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const info = STEPS[step];

  useEffect(() => {
    if (info) {
      opacity.setValue(0);
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    }
  }, [step]);

  if (!info) return null;

  return (
    <Animated.View style={[styles.container, { opacity }]} pointerEvents="box-none">
      <View style={styles.card}>
        <Text style={styles.title}>{info.title}</Text>
        <Text style={styles.body}>{info.body}</Text>

        {step === 'clear_line' && (
          <TouchableOpacity style={styles.gotItBtn} onPress={onClearLineInfoSeen}>
            <Text style={styles.gotItText}>GOT IT!</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.skipBtn} onPress={onSkip}>
          <Text style={styles.skipText}>Skip tutorial</Text>
        </TouchableOpacity>
      </View>

      {info.arrow === 'down' && (
        <View style={styles.arrowDown} />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 120,
    left: 16,
    right: 16,
    zIndex: 200,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: COLORS.primary,
    width: '100%',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    color: COLORS.primary,
    fontWeight: '900',
    fontSize: 16,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  body: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 22,
  },
  gotItBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 14,
  },
  gotItText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 1,
  },
  skipBtn: {
    marginTop: 10,
    alignItems: 'center',
  },
  skipText: {
    color: COLORS.textMuted,
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  arrowDown: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 14,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: COLORS.primary,
    marginTop: 2,
  },
});
