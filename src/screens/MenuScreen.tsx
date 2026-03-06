import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, Animated, Dimensions,
} from 'react-native';
import { getStats, GameStats } from '../game/storage';
import { COLORS } from '../theme';

const { width: W, height: H } = Dimensions.get('window');

// Floating block particle
function Particle({ color, delay }: { color: string; delay: number }) {
  const y = useRef(new Animated.Value(H + 40)).current;
  const x = useRef(new Animated.Value(Math.random() * W)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const size = 14 + Math.random() * 18;

  useEffect(() => {
    const startX = Math.random() * W;
    x.setValue(startX);
    const loop = () => {
      y.setValue(H + 40);
      opacity.setValue(0);
      rotate.setValue(0);
      Animated.sequence([
        Animated.delay(delay + Math.random() * 2000),
        Animated.parallel([
          Animated.timing(y, { toValue: -60, duration: 6000 + Math.random() * 4000, useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(opacity, { toValue: 0.35, duration: 800, useNativeDriver: true }),
            Animated.delay(3000),
            Animated.timing(opacity, { toValue: 0, duration: 1200, useNativeDriver: true }),
          ]),
          Animated.timing(rotate, { toValue: 1, duration: 6000, useNativeDriver: true }),
        ]),
      ]).start(() => loop());
    };
    loop();
  }, []);

  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        width: size, height: size,
        borderRadius: 4,
        backgroundColor: color,
        transform: [{ translateY: y }, { rotate: spin }],
        left: x as any,
        opacity,
      }}
    />
  );
}

function ParticleField() {
  const particles = [
    { color: COLORS.blocks[0], delay: 0 },
    { color: COLORS.blocks[1], delay: 600 },
    { color: COLORS.blocks[2], delay: 1200 },
    { color: COLORS.blocks[3], delay: 300 },
    { color: COLORS.blocks[4], delay: 900 },
    { color: COLORS.blocks[5], delay: 1500 },
    { color: COLORS.blocks[6], delay: 200 },
    { color: COLORS.blocks[7], delay: 800 },
    { color: COLORS.blocks[8], delay: 400 },
    { color: COLORS.blocks[9], delay: 1100 },
    { color: COLORS.blocks[0], delay: 1700 },
    { color: COLORS.blocks[3], delay: 700 },
  ];
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p, i) => <Particle key={i} color={p.color} delay={p.delay} />)}
    </View>
  );
}

interface Props { onPlay: () => void }

export function MenuScreen({ onPlay }: Props) {
  const [stats, setStats] = useState<GameStats | null>(null);

  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const bottomOpacity = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    getStats().then(setStats);

    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, useNativeDriver: true, tension: 100, friction: 8 }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
      Animated.timing(bottomOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();

    // Button pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.04, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const pressIn = () =>
    Animated.spring(btnScale, { toValue: 0.93, useNativeDriver: true, tension: 400 }).start();
  const pressOut = () =>
    Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, tension: 400 }).start();

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.root}>
        <ParticleField />

        {/* ── LOGO AREA ── */}
        <View style={s.top}>
          <Animated.View style={[s.logoWrap, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
            {/* 2×4 mini block grid */}
            <View style={s.blockRow}>
              {[0,1,2,3].map(i => <View key={i} style={[s.lb, { backgroundColor: COLORS.blocks[i] }]} />)}
            </View>
            <View style={s.blockRow}>
              {[4,5,6,7].map(i => <View key={i} style={[s.lb, { backgroundColor: COLORS.blocks[i] }]} />)}
            </View>

            <Text style={s.title}>BLOCK BLAST</Text>
          </Animated.View>
        </View>

        {/* ── CENTER: high score ── */}
        <Animated.View style={[s.middle, { opacity: bottomOpacity }]}>
          {stats && stats.highScore > 0 && (
            <View style={s.hsWrap}>
              <Text style={s.hsLabel}>BEST SCORE</Text>
              <Text style={s.hsValue}>{stats.highScore.toLocaleString()}</Text>
            </View>
          )}
        </Animated.View>

        {/* ── PLAY BUTTON ── */}
        <Animated.View style={[s.btnArea, { opacity: bottomOpacity }]}>
          <Animated.View style={{ transform: [{ scale: Animated.multiply(btnScale, pulse) }] }}>
            <TouchableOpacity
              style={s.playBtn}
              onPress={onPlay}
              onPressIn={pressIn}
              onPressOut={pressOut}
              activeOpacity={1}
            >
              <Text style={s.playText}>PLAY</Text>
            </TouchableOpacity>
          </Animated.View>

          {stats && stats.totalGames > 0 && (
            <Animated.View style={[s.miniStats, { opacity: bottomOpacity }]}>
              <Text style={s.miniStat}>{stats.totalGames} games</Text>
              <View style={s.miniDot} />
              <Text style={s.miniStat}>{stats.totalLines} lines</Text>
              <View style={s.miniDot} />
              <Text style={s.miniStat}>Lv.{stats.maxLevel} best</Text>
            </Animated.View>
          )}
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 32,
  },

  // Logo
  top: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  logoWrap: { alignItems: 'center' },
  blockRow: { flexDirection: 'row', marginBottom: 5 },
  lb: {
    width: 32, height: 32, borderRadius: 8,
    marginHorizontal: 4,
    shadowOpacity: 0.6, shadowRadius: 10, elevation: 6,
  },
  title: {
    fontSize: 44,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 6,
    marginTop: 22,
    textShadowColor: 'rgba(124,58,237,0.8)',
    textShadowRadius: 24,
    textShadowOffset: { width: 0, height: 0 },
  },

  // High score
  middle: { alignItems: 'center', paddingBottom: 8 },
  hsWrap: { alignItems: 'center' },
  hsLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 3,
    marginBottom: 4,
  },
  hsValue: {
    color: COLORS.gold,
    fontSize: 42,
    fontWeight: '900',
    textShadowColor: 'rgba(245,158,11,0.4)',
    textShadowRadius: 16,
    textShadowOffset: { width: 0, height: 0 },
  },

  // Play button
  btnArea: { alignItems: 'center', width: '100%', paddingHorizontal: 40 },
  playBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 28,
    paddingVertical: 22,
    paddingHorizontal: 80,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.8,
    shadowRadius: 28,
    elevation: 18,
  },
  playText: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 6,
  },
  miniStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  miniStat: { color: COLORS.textMuted, fontSize: 12, fontWeight: '500' },
  miniDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: COLORS.gridLine },
});
