import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Piece } from '../game/pieces';
import { COLORS, SIZES } from '../theme';

const PC = SIZES.PIECE_CELL;
const PG = SIZES.PIECE_GAP;

interface SlotProps {
  piece: Piece | null;
  isSelected: boolean;
  onPress: () => void;
}

function Slot({ piece, isSelected, onPress }: SlotProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isSelected) {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1.08, useNativeDriver: true, tension: 300 }),
        Animated.timing(glow, { toValue: 1, duration: 200, useNativeDriver: false }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 300 }),
        Animated.timing(glow, { toValue: 0, duration: 200, useNativeDriver: false }),
      ]).start();
    }
  }, [isSelected]);

  if (!piece) {
    return (
      <View style={[styles.slot, styles.slotEmpty]}>
        <View style={styles.checkWrap}>
          <Animated.Text style={styles.check}>✓</Animated.Text>
        </View>
      </View>
    );
  }

  const color = COLORS.blocks[piece.colorIndex % COLORS.blocks.length];
  const blockGlow = COLORS.blockGlow[piece.colorIndex % COLORS.blockGlow.length];

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Animated.View
        style={[
          styles.slot,
          isSelected && styles.slotSelected,
          { transform: [{ scale }] },
        ]}
      >
        <View style={styles.pieceWrap}>
          {piece.shape.map((row, r) => (
            <View key={r} style={{ flexDirection: 'row' }}>
              {row.map((filled, c) => (
                <View
                  key={c}
                  style={{
                    width: PC, height: PC, margin: PG / 2,
                    borderRadius: 4,
                    backgroundColor: filled ? color : 'transparent',
                    shadowColor: filled ? blockGlow : undefined,
                    shadowOpacity: filled ? 0.9 : 0,
                    shadowRadius: 5,
                    elevation: filled ? 3 : 0,
                  }}
                />
              ))}
            </View>
          ))}
        </View>
        {isSelected && <View style={styles.selectedBar} />}
      </Animated.View>
    </TouchableOpacity>
  );
}

interface Props {
  pieces: (Piece | null)[];
  selectedIndex: number | null;
  onSelectPiece: (index: number) => void;
}

export function PieceTray({ pieces, selectedIndex, onSelectPiece }: Props) {
  return (
    <View style={styles.tray}>
      {pieces.map((piece, i) => (
        <Slot
          key={i}
          piece={piece}
          isSelected={selectedIndex === i}
          onPress={() => piece && onSelectPiece(i)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tray: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 8,
  },
  slot: {
    width: 96, height: 96,
    backgroundColor: COLORS.bgCard,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.gridLine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotEmpty: { opacity: 0.25 },
  slotSelected: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    backgroundColor: 'rgba(124,58,237,0.1)',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.6,
    shadowRadius: 14,
    elevation: 8,
  },
  pieceWrap: { alignItems: 'center', justifyContent: 'center' },
  selectedBar: {
    position: 'absolute', bottom: 7,
    width: 22, height: 3,
    backgroundColor: COLORS.primary, borderRadius: 2,
  },
  checkWrap: { opacity: 0.5 },
  check: { fontSize: 22, color: COLORS.success },
});
