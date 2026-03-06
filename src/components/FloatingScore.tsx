import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { COLORS } from '../theme';

interface Props {
  id: number;
  value: number;
  label: string;
  onDone: (id: number) => void;
}

export function FloatingScore({ id, value, label, onDone }: Props) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: -80, duration: 1200, useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(600),
        Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start(() => onDone(id));
  }, []);

  const isMulti = value >= 300;
  const isCombo = label.includes('COMBO');

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        { transform: [{ translateY }], opacity },
      ]}
    >
      <Text style={[styles.label, isMulti && styles.big, isCombo && styles.combo]}>
        {label}
      </Text>
      <Text style={[styles.value, isMulti && styles.bigValue]}>
        +{value}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignSelf: 'center',
    alignItems: 'center',
    zIndex: 999,
    bottom: '40%',
  },
  label: {
    color: COLORS.success,
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 1,
    textShadowColor: 'rgba(0,230,118,0.5)',
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 0 },
  },
  value: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 13,
    opacity: 0.85,
  },
  big: {
    color: COLORS.gold,
    fontSize: 22,
    textShadowColor: 'rgba(255,215,0,0.6)',
  },
  bigValue: {
    fontSize: 16,
    color: COLORS.gold,
  },
  combo: {
    color: COLORS.accent,
    textShadowColor: 'rgba(255,101,132,0.6)',
  },
});
