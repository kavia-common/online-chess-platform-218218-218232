import React, { useMemo } from "react";

/**
 * Human readable castling rights string.
 */
function castlingText(castling) {
  const parts = [];
  if (castling.wK) parts.push("K");
  if (castling.wQ) parts.push("Q");
  if (castling.bK) parts.push("k");
  if (castling.bQ) parts.push("q");
  return parts.length ? parts.join("") : "—";
}

export default function GamePanel({
  game,
  selectedSquare,
  lastMove,
  selectedMoves,
  flipped,
  onFlip,
  onUndo,
  onReset,
}) {
  const material = useMemo(() => {
    const tally = { w: 0, b: 0 };
    const values = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
    for (const row of game.board) {
      for (const p of row) {
        if (!p) continue;
        tally[p.color] += values[p.type] ?? 0;
      }
    }
    return tally;
  }, [game.board]);

  const canUndo = game.history.length > 0;

  return (
    <div>
      <div className="panelTitle">Game</div>
      <div className="kv">
        <div className="kvRow">
          <div className="kvKey">Selected</div>
          <div className="kvVal">{selectedSquare ?? "—"}</div>
        </div>
        <div className="kvRow">
          <div className="kvKey">Targets</div>
          <div className="kvVal">{selectedMoves}</div>
        </div>
        <div className="kvRow">
          <div className="kvKey">Last move</div>
          <div className="kvVal">{lastMove}</div>
        </div>
        <div className="kvRow">
          <div className="kvKey">En passant</div>
          <div className="kvVal">{game.enPassant ? game.enPassant : "—"}</div>
        </div>
        <div className="kvRow">
          <div className="kvKey">Castling</div>
          <div className="kvVal">{castlingText(game.castling)}</div>
        </div>
        <div className="kvRow">
          <div className="kvKey">Material</div>
          <div className="kvVal">
            W {material.w} / B {material.b}
          </div>
        </div>
      </div>

      <div className="btnRow" role="group" aria-label="Game controls">
        <button type="button" className="btn btnPrimary" onClick={onFlip}>
          {flipped ? "Unflip board" : "Flip board"}
        </button>
        <button type="button" className="btn" onClick={onUndo} disabled={!canUndo}>
          Undo
        </button>
        <button type="button" className="btn" onClick={onReset}>
          New game
        </button>
      </div>
    </div>
  );
}
