/**
 * Coordinates:
 * - r: 0..7 (0 = rank 8)
 * - c: 0..7 (0 = file a)
 */

// PUBLIC_INTERFACE
export function coordsToAlgebraic(r, c) {
  /** Convert internal board coordinates to algebraic like "e4". */
  const file = String.fromCharCode("a".charCodeAt(0) + c);
  const rank = String(8 - r);
  return `${file}${rank}`;
}

// PUBLIC_INTERFACE
export function algebraicToCoords(sq) {
  /** Convert algebraic like "e4" to internal coords {r,c}. */
  if (!sq || sq.length !== 2) return null;
  const file = sq[0].toLowerCase();
  const rank = sq[1];
  const c = file.charCodeAt(0) - "a".charCodeAt(0);
  const r = 8 - Number(rank);
  if (c < 0 || c > 7 || r < 0 || r > 7) return null;
  return { r, c };
}

// PUBLIC_INTERFACE
export function boardIndexToCoords(idx) {
  /** Convert 0..63 index to internal coords. */
  const r = Math.floor(idx / 8);
  const c = idx % 8;
  return { r, c };
}

// PUBLIC_INTERFACE
export function coordsToBoardIndex(r, c) {
  /** Convert internal coords to 0..63 index. */
  return r * 8 + c;
}
