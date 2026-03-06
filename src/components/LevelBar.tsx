import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LevelConfig } from '../game/levels';
import { COLORS } from '../theme';

interface Props {
  level: LevelConfig;
  progress: number; // 0-1
  nextThreshold: number | null;
  score: number;
}

export function LevelBar({ level, progress, nextThreshold, score }: Props) {
  const widthAnim = useRef(new Animated.Value(progress)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: progress,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={[styles.badge, { backgroundColor: level.color + '22', borderColor: level.color }]}>
          <Text style={[styles.levelNum, { color: level.color }]}>Lv.{level.level}</Text>
          <Text style={[styles.levelName, { color: level.color }]}>{level.name}</Text>
        </View>

        <View style={styles.barWrap}>
          <View style={styles.barBg}>
            <Animated.View
              style={[
                styles.barFill,
                {
                  backgroundColor: level.color,
                  width: widthAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                },
              ]}
            />
          </View>
          {nextThreshold !== null && (
            <Text style={styles.nextLabel}>→ {nextThreshold.toLocaleString()}</Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  badge: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignItems: 'center',
    minWidth: 56,
  },
  levelNum: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  levelName: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  barWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  barBg: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.bgCard,
    borderRadius: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.gridLine,
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  nextLabel: {
    fontSize: 9,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
});
