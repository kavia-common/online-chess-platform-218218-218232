/**
 * Internal piece representation:
 * { color: "w" | "b", type: "p"|"n"|"b"|"r"|"q"|"k" }
 */

const GLYPHS = {
  w: { k: "♔", q: "♕", r: "♖", b: "♗", n: "♘", p: "♙" },
  b: { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" },
};

// PUBLIC_INTERFACE
export function pieceToGlyph(piece) {
  /** Convert a piece object into a Unicode chess glyph. */
  if (!piece) return "";
  return GLYPHS[piece.color]?.[piece.type] ?? "";
}
