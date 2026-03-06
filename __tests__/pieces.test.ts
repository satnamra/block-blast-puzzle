import { generatePiece, generatePieces, PIECE_TEMPLATES } from '../src/game/pieces';

describe('generatePiece', () => {
  test('returns a piece with valid shape', () => {
    const p = generatePiece();
    expect(p.shape).toBeDefined();
    expect(p.shape.length).toBeGreaterThan(0);
    expect(p.shape[0].length).toBeGreaterThan(0);
  });

  test('colorIndex is 0-9', () => {
    for (let i = 0; i < 50; i++) {
      const p = generatePiece();
      expect(p.colorIndex).toBeGreaterThanOrEqual(0);
      expect(p.colorIndex).toBeLessThan(10);
    }
  });

  test('shape is a valid boolean matrix', () => {
    const p = generatePiece();
    p.shape.forEach(row => {
      row.forEach(cell => expect(typeof cell).toBe('boolean'));
    });
  });
});

describe('generatePieces', () => {
  test('generates exactly N pieces', () => {
    expect(generatePieces(3).length).toBe(3);
    expect(generatePieces(1).length).toBe(1);
  });

  test('all pieces have shapes', () => {
    const pieces = generatePieces(5);
    pieces.forEach(p => {
      expect(p.shape).toBeDefined();
      expect(p.shape.length).toBeGreaterThan(0);
    });
  });
});

describe('PIECE_TEMPLATES', () => {
  test('all templates have at least one true cell', () => {
    PIECE_TEMPLATES.forEach((t, i) => {
      const hasCells = t.some(row => row.some(cell => cell));
      expect(hasCells).toBe(true);
    });
  });

  test('all templates have consistent row length', () => {
    PIECE_TEMPLATES.forEach(t => {
      const width = t[0].length;
      t.forEach(row => expect(row.length).toBe(width));
    });
  });
});
