import React, { useMemo, useState } from "react";
import "./App.css";
import { initialGameState, makeMove, getLegalMovesForSquare } from "./chess/engine";
import { boardIndexToCoords, coordsToAlgebraic } from "./chess/notation";
import ChessBoard from "./components/ChessBoard";
import GamePanel from "./components/GamePanel";

// PUBLIC_INTERFACE
function App() {
  /** Root UI for the Retro Chess app. */
  const [game, setGame] = useState(() => initialGameState());
  const [selected, setSelected] = useState(null); // {r,c} | null
  const [promotion, setPromotion] = useState(null); // {from,to,color} | null
  const [flipped, setFlipped] = useState(false);

  const legalMovesFromSelected = useMemo(() => {
    if (!selected) return [];
    return getLegalMovesForSquare(game, selected);
  }, [game, selected]);

  const selectedAlgebraic = selected ? coordsToAlgebraic(selected.r, selected.c) : null;

  const reset = () => {
    setGame(initialGameState());
    setSelected(null);
    setPromotion(null);
  };

  const undo = () => {
    if (game.history.length === 0) return;
    const prev = game.history[game.history.length - 1];
    setGame(prev);
    setSelected(null);
    setPromotion(null);
  };

  const onSquareClick = (coords) => {
    if (promotion) return; // block interaction while promotion modal open

    const piece = game.board[coords.r][coords.c];
    const isOwnPiece = piece && piece.color === game.turn;

    // If selecting own piece, select it.
    if (!selected) {
      if (isOwnPiece) setSelected(coords);
      return;
    }

    // Clicking same square deselects.
    if (coords.r === selected.r && coords.c === selected.c) {
      setSelected(null);
      return;
    }

    // If clicking another own piece, change selection.
    if (isOwnPiece) {
      setSelected(coords);
      return;
    }

    // Otherwise attempt move from selected to target.
    const legalMoves = getLegalMovesForSquare(game, selected);
    const chosen = legalMoves.find((m) => m.to.r === coords.r && m.to.c === coords.c);
    if (!chosen) return;

    // If pawn reaching last rank -> promotion UI.
    if (chosen.promotionRequired) {
      setPromotion({ from: selected, to: coords, color: game.turn });
      return;
    }

    const result = makeMove(game, { from: selected, to: coords });
    if (!result.ok) return;

    setGame(result.game);
    setSelected(null);
  };

  const onPromotionPick = (pieceType) => {
    if (!promotion) return;
    const result = makeMove(game, {
      from: promotion.from,
      to: promotion.to,
      promotion: pieceType,
    });
    if (!result.ok) return;

    setGame(result.game);
    setSelected(null);
    setPromotion(null);
  };

  const status = useMemo(() => {
    if (game.result.type === "ongoing") {
      if (game.inCheck) return `${game.turn === "w" ? "White" : "Black"} to move — CHECK!`;
      return `${game.turn === "w" ? "White" : "Black"} to move`;
    }
    if (game.result.type === "checkmate") {
      return `Checkmate — ${game.result.winner === "w" ? "White" : "Black"} wins`;
    }
    if (game.result.type === "stalemate") return "Stalemate — draw";
    if (game.result.type === "draw") return `Draw — ${game.result.reason}`;
    return "Game over";
  }, [game]);

  const lastMove = game.lastMove
    ? `${coordsToAlgebraic(game.lastMove.from.r, game.lastMove.from.c)}→${coordsToAlgebraic(
        game.lastMove.to.r,
        game.lastMove.to.c
      )}`
    : "—";

  const selectedMovesText =
    selected && legalMovesFromSelected.length > 0
      ? legalMovesFromSelected
          .map((m) => coordsToAlgebraic(m.to.r, m.to.c))
          .slice(0, 12)
          .join(", ") + (legalMovesFromSelected.length > 12 ? "…" : "")
      : "—";

  return (
    <div className="appShell">
      <header className="topBar">
        <div className="brand">
          <div className="brandMark" aria-hidden="true">
            ♟
          </div>
          <div className="brandText">
            <div className="brandTitle">Retro Chess</div>
            <div className="brandSub">Two‑player local • rules enforced</div>
          </div>
        </div>

        <div className="topBarRight">
          <div className="statusPill" role="status" aria-live="polite">
            {status}
          </div>
        </div>
      </header>

      <main className="mainGrid">
        <section className="panel">
          <GamePanel
            game={game}
            selectedSquare={selectedAlgebraic}
            lastMove={lastMove}
            selectedMoves={selectedMovesText}
            flipped={flipped}
            onFlip={() => setFlipped((v) => !v)}
            onReset={reset}
            onUndo={undo}
          />
          <div className="hint">
            Tip: click a piece to see legal moves. Castling, en passant, and check rules are supported.
          </div>
        </section>

        <section className="boardWrap" aria-label="Chessboard">
          <ChessBoard
            board={game.board}
            turn={game.turn}
            flipped={flipped}
            selected={selected}
            legalMoves={legalMovesFromSelected}
            lastMove={game.lastMove}
            inCheckKingSquare={game.inCheckKingSquare}
            onSquareClick={onSquareClick}
          />
        </section>

        <section className="panel panelRight">
          <div className="panelTitle">Moves</div>
          <ol className="movesList" aria-label="Move list">
            {game.moveList.length === 0 ? (
              <li className="movesEmpty">No moves yet.</li>
            ) : (
              game.moveList.map((mv, idx) => (
                <li key={idx} className="movesItem">
                  <span className="movesIdx">{idx + 1}.</span>
                  <span className="movesSan">{mv}</span>
                </li>
              ))
            )}
          </ol>

          <div className="panelTitle">Debug</div>
          <div className="kv">
            <div className="kvRow">
              <div className="kvKey">Turn</div>
              <div className="kvVal">{game.turn === "w" ? "White" : "Black"}</div>
            </div>
            <div className="kvRow">
              <div className="kvKey">Selected</div>
              <div className="kvVal">{selectedAlgebraic ?? "—"}</div>
            </div>
            <div className="kvRow">
              <div className="kvKey">Legal moves</div>
              <div className="kvVal">{legalMovesFromSelected.length}</div>
            </div>
            <div className="kvRow">
              <div className="kvKey">Last move</div>
              <div className="kvVal">{lastMove}</div>
            </div>
          </div>
        </section>
      </main>

      {promotion ? (
        <div className="modalOverlay" role="dialog" aria-modal="true" aria-label="Choose promotion piece">
          <div className="modal">
            <div className="modalTitle">Promote pawn</div>
            <div className="modalBody">
              Pick a piece for {promotion.color === "w" ? "White" : "Black"}:
            </div>
            <div className="promoRow">
              {["q", "r", "b", "n"].map((t) => (
                <button key={t} className="btn btnPrimary" onClick={() => onPromotionPick(t)}>
                  {t.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="modalHint">Queen (Q), Rook (R), Bishop (B), Knight (N)</div>
          </div>
        </div>
      ) : null}

      <footer className="footer">
        <span className="footerDim">Coords:</span> a1 is White’s left corner.{" "}
        <span className="footerDim">Retro mode:</span> on.
      </footer>
    </div>
  );
}

export default App;
