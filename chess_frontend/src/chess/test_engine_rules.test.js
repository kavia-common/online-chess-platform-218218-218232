import { getLegalMovesForSquare, initialGameState, makeMove } from "./engine";
import { algebraicToCoords } from "./notation";

/**
 * Helper to move using algebraic coordinates like "e2" -> "e4".
 */
function moveAlg(game, fromSq, toSq, promotion = undefined) {
  const from = algebraicToCoords(fromSq);
  const to = algebraicToCoords(toSq);
  if (!from || !to) throw new Error(`Bad square(s): ${fromSq} -> ${toSq}`);

  const result = makeMove(game, { from, to, promotion });
  return result;
}

function legalTargetsAlg(game, fromSq) {
  const from = algebraicToCoords(fromSq);
  const moves = getLegalMovesForSquare(game, from);
  return moves.map((m) => ({
    to: m.to,
    toAlg: String.fromCharCode("a".charCodeAt(0) + m.to.c) + String(8 - m.to.r),
    isCastle: !!m.isCastle,
    isEnPassant: !!m.isEnPassant,
    promotionRequired: !!m.promotionRequired,
  }));
}

describe("chess engine rules", () => {
  test("prevents castling while in check", () => {
    let g = initialGameState();

    // Create check on white king (classic): 1.f3 e5 2.g4 Qh4+
    g = moveAlg(g, "f2", "f3").game;
    g = moveAlg(g, "e7", "e5").game;
    g = moveAlg(g, "g2", "g4").game;
    g = moveAlg(g, "d8", "h4").game;

    expect(g.inCheck).toBe(true);

    const kingMoves = legalTargetsAlg(g, "e1");
    expect(kingMoves.some((m) => m.isCastle)).toBe(false);
  });

  test("detects checkmate (Fool's mate)", () => {
    let g = initialGameState();

    // 1. f3
    let r = moveAlg(g, "f2", "f3");
    expect(r.ok).toBe(true);
    g = r.game;

    // ... e5
    r = moveAlg(g, "e7", "e5");
    expect(r.ok).toBe(true);
    g = r.game;

    // 2. g4
    r = moveAlg(g, "g2", "g4");
    expect(r.ok).toBe(true);
    g = r.game;

    // ... Qh4#
    r = moveAlg(g, "d8", "h4");
    expect(r.ok).toBe(true);
    g = r.game;

    expect(g.result.type).toBe("checkmate");
    expect(g.result.winner).toBe("b");
    expect(g.moveList[g.moveList.length - 1]).toMatch(/#$/);
  });

  test("allows castling king-side when path is clear and rights intact", () => {
    let g = initialGameState();

    // Clear path for white king-side castle.
    g = moveAlg(g, "g1", "f3").game;
    g = moveAlg(g, "a7", "a6").game;
    g = moveAlg(g, "g2", "g3").game;
    g = moveAlg(g, "a6", "a5").game;
    g = moveAlg(g, "f1", "g2").game;
    g = moveAlg(g, "a5", "a4").game;

    const kingMoves = legalTargetsAlg(g, "e1");
    expect(kingMoves.some((m) => m.isCastle && m.toAlg === "g1")).toBe(true);

    const r = moveAlg(g, "e1", "g1");
    expect(r.ok).toBe(true);
    g = r.game;

    // After castling: king on g1, rook on f1.
    const g1 = algebraicToCoords("g1");
    const f1 = algebraicToCoords("f1");
    expect(g.board[g1.r][g1.c]).toEqual({ color: "w", type: "k" });
    expect(g.board[f1.r][f1.c]).toEqual({ color: "w", type: "r" });
    expect(g.moveList[g.moveList.length - 1]).toBe("O-O");
  });

  test("en passant capture is legal immediately after a 2-square pawn advance", () => {
    let g = initialGameState();

    // 1. e4 a6
    // 2. e5 d5 (sets enPassant=d6)
    // 3. exd6 e.p.
    g = moveAlg(g, "e2", "e4").game;
    g = moveAlg(g, "a7", "a6").game;
    g = moveAlg(g, "e4", "e5").game;
    g = moveAlg(g, "d7", "d5").game;

    expect(g.enPassant).toBe("d6");

    const pawnMoves = legalTargetsAlg(g, "e5");
    expect(pawnMoves.some((m) => m.isEnPassant && m.toAlg === "d6")).toBe(true);

    const r = moveAlg(g, "e5", "d6");
    expect(r.ok).toBe(true);
    g = r.game;

    // Captured pawn removed from d5; capturing pawn on d6.
    const d5 = algebraicToCoords("d5");
    const d6 = algebraicToCoords("d6");
    expect(g.board[d5.r][d5.c]).toBeNull();
    expect(g.board[d6.r][d6.c]).toEqual({ color: "w", type: "p" });

    expect(g.moveList[g.moveList.length - 1]).toMatch(/^exd6/);
  });

  test("promotion requires specifying a piece; then applies promotion and SAN includes =Q", () => {
    let g = initialGameState();

    // Force a quick promotion on the a-file by clearing path with captures.
    // 1. a4 h5
    // 2. a5 h4
    // 3. a6 h3
    // 4. axb7 h2
    // 5. bxa8=Q
    g = moveAlg(g, "a2", "a4").game;
    g = moveAlg(g, "h7", "h5").game;

    g = moveAlg(g, "a4", "a5").game;
    g = moveAlg(g, "h5", "h4").game;

    g = moveAlg(g, "a5", "a6").game;
    g = moveAlg(g, "h4", "h3").game;

    // capture b7
    g = moveAlg(g, "a6", "b7").game;
    g = moveAlg(g, "h3", "h2").game;

    // Attempt promotion without specifying piece should fail.
    let r = moveAlg(g, "b7", "a8");
    expect(r.ok).toBe(false);
    expect(r.error).toBe("Promotion required");

    // Now promote to queen.
    r = moveAlg(g, "b7", "a8", "q");
    expect(r.ok).toBe(true);
    g = r.game;

    const a8 = algebraicToCoords("a8");
    expect(g.board[a8.r][a8.c]).toEqual({ color: "w", type: "q" });
    expect(g.moveList[g.moveList.length - 1]).toMatch(/=Q/);
  });
});
