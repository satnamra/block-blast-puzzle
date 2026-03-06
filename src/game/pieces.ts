export type PieceShape = boolean[][];

export interface Piece {
  shape: PieceShape;
  colorIndex: number;
}

// Order matters — indices used by levels.ts
export const PIECE_TEMPLATES: PieceShape[] = [
  // 0: 1x1 dot
  [[true]],
  // 1: 1x2 horizontal
  [[true, true]],
  // 2: 2x1 vertical
  [[true], [true]],
  // 3: 1x3
  [[true, true, true]],
  // 4: 3x1
  [[true], [true], [true]],
  // 5: 1x4
  [[true, true, true, true]],
  // 6: 4x1
  [[true], [true], [true], [true]],
  // 7: 2x2 square
  [[true, true], [true, true]],
  // 8: L
  [[true, false], [true, false], [true, true]],
  // 9: J
  [[false, true], [false, true], [true, true]],
  // 10: L flipped
  [[true, true], [true, false], [true, false]],
  // 11: J flipped
  [[true, true], [false, true], [false, true]],
  // 12: T
  [[true, true, true], [false, true, false]],
  // 13: T rotated
  [[false, true, false], [true, true, true]],
  // 14: S
  [[false, true, true], [true, true, false]],
  // 15: Z
  [[true, true, false], [false, true, true]],
  // 16: corner TL
  [[true, false], [true, true]],
  // 17: corner TR
  [[false, true], [true, true]],
  // 18: corner BL
  [[true, true], [false, true]],
  // 19: corner BR
  [[true, true], [true, false]],
  // 20: Plus
  [[false, true, false], [true, true, true], [false, true, false]],
  // 21: 3x3 full
  [[true, true, true], [true, true, true], [true, true, true]],
];

let _colorCounter = 0;

export function generatePiece(allowedIndices?: number[]): Piece {
  const pool = allowedIndices ?? PIECE_TEMPLATES.map((_, i) => i);
  const shapeIdx = pool[Math.floor(Math.random() * pool.length)];
  const colorIndex = _colorCounter % 10;
  _colorCounter++;
  return { shape: PIECE_TEMPLATES[shapeIdx], colorIndex };
}

export function generatePieces(count: number, allowedIndices?: number[]): Piece[] {
  return Array.from({ length: count }, () => generatePiece(allowedIndices));
}
