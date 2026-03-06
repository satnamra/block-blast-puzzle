import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { LevelConfig } from '../game/levels';
import { COLORS } from '../theme';

interface Props {
  level: LevelConfig;
  visible: boolean;
  onContinue: () => void;
}

export function LevelUpModal({ level, visible, onContinue }: Props) {
  const scale = useRef(new Animated.Value(0.5)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scale.setValue(0.5);
      opacity.setValue(0);
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200, friction: 8 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.overlay} pointerEvents="auto">
      <Animated.View style={[styles.card, { transform: [{ scale }], opacity }]}>
        <Text style={styles.sub}>LEVEL UP!</Text>
        <Text style={[styles.level, { color: level.color }]}>Level {level.level}</Text>
        <Text style={[styles.name, { color: level.color }]}>{level.name}</Text>
        <Text style={styles.desc}>{level.description}</Text>

        <TouchableOpacity
          style={[styles.btn, { backgroundColor: level.color }]}
          onPress={onContinue}
        >
          <Text style={styles.btnText}>CONTINUE</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(13,13,26,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 300,
  },
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    minWidth: 260,
    borderWidth: 1,
    borderColor: COLORS.gridLine,
  },
  sub: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 3,
    marginBottom: 4,
  },
  level: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: 2,
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 12,
    letterSpacing: 1,
  },
  desc: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  btn: {
    borderRadius: 12,
    paddingHorizontal: 36,
    paddingVertical: 12,
  },
  btnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 2,
  },
});
