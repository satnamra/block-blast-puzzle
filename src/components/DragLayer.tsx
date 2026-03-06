/**
 * DragLayer — full-screen touch capture.
 * Pieces are dragged from the tray; on release we compute which grid cell was hit.
 */
import React, { useRef, useCallback, useState, useEffect } from 'react';
import {
  View, PanResponder, StyleSheet, Dimensions,
} from 'react-native';
import { Piece } from '../game/pieces';
import { COLORS, SIZES } from '../theme';

const { CELL_SIZE, CELL_GAP, PIECE_CELL, PIECE_GAP } = SIZES;
const TOTAL_CELL = CELL_SIZE + CELL_GAP;

export interface GridLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TraySlotLayout {
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Props {
  pieces: (Piece | null)[];
  gridLayout: GridLayout | null;
  trayLayouts: TraySlotLayout[];
  onHover: (row: number | null, col: number | null) => void;
  onDrop: (pieceIndex: number, row: number, col: number) => void;
  children: React.ReactNode;
}

function touchToGrid(touchX: number, touchY: number, gridLayout: GridLayout) {
  const relX = touchX - gridLayout.x - 4; // 4 = grid padding
  const relY = touchY - gridLayout.y - 4;
  const col = Math.floor(relX / TOTAL_CELL);
  const row = Math.floor(relY / TOTAL_CELL);
  return { row, col };
}

function touchInSlot(touchX: number, touchY: number, slot: TraySlotLayout) {
  return (
    touchX >= slot.x && touchX <= slot.x + slot.width &&
    touchY >= slot.y && touchY <= slot.y + slot.height
  );
}

export function DragLayer({ pieces, gridLayout, trayLayouts, onHover, onDrop, children }: Props) {
  const dragging = useRef<{ pieceIndex: number; startX: number; startY: number } | null>(null);
  const [ghost, setGhost] = useState<{ pieceIndex: number; x: number; y: number } | null>(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (e) => {
        const { pageX, pageY } = e.nativeEvent;
        for (const slot of trayLayouts) {
          if (touchInSlot(pageX, pageY, slot) && pieces[slot.index]) {
            dragging.current = { pieceIndex: slot.index, startX: pageX, startY: pageY };
            return true;
          }
        }
        return false;
      },
      onMoveShouldSetPanResponder: () => dragging.current !== null,
      onPanResponderGrant: (e) => {
        const { pageX, pageY } = e.nativeEvent;
        if (dragging.current) {
          setGhost({ pieceIndex: dragging.current.pieceIndex, x: pageX, y: pageY });
        }
      },
      onPanResponderMove: (e) => {
        const { pageX, pageY } = e.nativeEvent;
        if (!dragging.current) return;
        setGhost({ pieceIndex: dragging.current.pieceIndex, x: pageX, y: pageY });
        if (gridLayout) {
          const { row, col } = touchToGrid(pageX, pageY, gridLayout);
          onHover(row, col);
        }
      },
      onPanResponderRelease: (e) => {
        const { pageX, pageY } = e.nativeEvent;
        if (dragging.current && gridLayout) {
          const { row, col } = touchToGrid(pageX, pageY, gridLayout);
          onDrop(dragging.current.pieceIndex, row, col);
        }
        dragging.current = null;
        setGhost(null);
        onHover(null, null);
      },
      onPanResponderTerminate: () => {
        dragging.current = null;
        setGhost(null);
        onHover(null, null);
      },
    })
  ).current;

  return (
    <View style={styles.root} {...panResponder.panHandlers}>
      {children}
      {ghost && pieces[ghost.pieceIndex] && (
        <GhostPiece
          piece={pieces[ghost.pieceIndex]!}
          x={ghost.x}
          y={ghost.y}
        />
      )}
    </View>
  );
}

function GhostPiece({ piece, x, y }: { piece: Piece; x: number; y: number }) {
  const color = COLORS.blocks[piece.colorIndex % COLORS.blocks.length];
  const glow = COLORS.blockGlow[piece.colorIndex % COLORS.blockGlow.length];
  const rows = piece.shape.length;
  const cols = piece.shape[0].length;
  const w = cols * (PIECE_CELL + PIECE_GAP);
  const h = rows * (PIECE_CELL + PIECE_GAP);

  return (
    <View
      pointerEvents="none"
      style={[
        styles.ghost,
        { left: x - w / 2, top: y - h - 20 },
      ]}
    >
      {piece.shape.map((row, r) => (
        <View key={r} style={{ flexDirection: 'row' }}>
          {row.map((filled, c) => (
            <View
              key={c}
              style={{
                width: PIECE_CELL,
                height: PIECE_CELL,
                margin: PIECE_GAP / 2,
                borderRadius: 5,
                backgroundColor: filled ? color : 'transparent',
                shadowColor: filled ? glow : undefined,
                shadowOpacity: filled ? 1 : 0,
                shadowRadius: 8,
                elevation: filled ? 6 : 0,
                opacity: 0.9,
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  ghost: {
    position: 'absolute',
    zIndex: 9999,
    pointerEvents: 'none',
  },
});
