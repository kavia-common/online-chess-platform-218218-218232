import React, { useMemo } from "react";
import "./ChessBoard.css";
import { coordsToAlgebraic } from "../chess/notation";
import { pieceToGlyph } from "../chess/pieces";

/**
 * Convert board coords based on flip setting:
 * - internal coords are always [r=0..7] with r=0 being rank 8.
 */
function viewToBoardCoords(viewR, viewC, flipped) {
  if (!flipped) return { r: viewR, c: viewC };
  return { r: 7 - viewR, c: 7 - viewC };
}

function boardToViewCoords(r, c, flipped) {
  if (!flipped) return { vr: r, vc: c };
  return { vr: 7 - r, vc: 7 - c };
}

export default function ChessBoard({
  board,
  flipped,
  selected,
  legalMoves,
  lastMove,
  inCheckKingSquare,
  onSquareClick,
}) {
  const legalTargets = useMemo(() => {
    const set = new Set();
    for (const m of legalMoves) set.add(`${m.to.r},${m.to.c}`);
    return set;
  }, [legalMoves]);

  const lastFrom = lastMove ? `${lastMove.from.r},${lastMove.from.c}` : null;
  const lastTo = lastMove ? `${lastMove.to.r},${lastMove.to.c}` : null;

  const inCheckKey = inCheckKingSquare ? `${inCheckKingSquare.r},${inCheckKingSquare.c}` : null;

  const fileLabels = flipped ? ["h", "g", "f", "e", "d", "c", "b", "a"] : ["a", "b", "c", "d", "e", "f", "g", "h"];
  const rankLabels = flipped ? ["1", "2", "3", "4", "5", "6", "7", "8"] : ["8", "7", "6", "5", "4", "3", "2", "1"];

  return (
    <div className="boardFrame">
      <div className="boardGrid" role="grid" aria-label="Chess board">
        {Array.from({ length: 8 }).map((_, vr) =>
          Array.from({ length: 8 }).map((__, vc) => {
            const { r, c } = viewToBoardCoords(vr, vc, flipped);
            const piece = board[r][c];
            const isLight = (r + c) % 2 === 0;

            const key = `${r},${c}`;
            const isSelected = selected && selected.r === r && selected.c === c;
            const isTarget = legalTargets.has(key);
            const isLast = key === lastFrom || key === lastTo;
            const isCheckKing = inCheckKey === key;

            const aria = `${coordsToAlgebraic(r, c)}${piece ? `, ${piece.color === "w" ? "white" : "black"} ${piece.type}` : ""}`;

            const cls = [
              "squareBtn",
              isLight ? "sqLight" : "sqDark",
              isSelected ? "sqSelected" : "",
              isTarget ? "sqTarget" : "",
              isLast ? "sqLast" : "",
              isCheckKing ? "sqCheck" : "",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <button
                key={`${vr}-${vc}`}
                type="button"
                className={cls}
                onClick={() => onSquareClick({ r, c })}
                role="gridcell"
                aria-label={aria}
              >
                <span className="piece" aria-hidden="true">
                  {piece ? pieceToGlyph(piece) : ""}
                </span>

                {/* rank/file hints on edges */}
                {vc === 0 ? <span className="rankLabel">{rankLabels[vr]}</span> : null}
                {vr === 7 ? <span className="fileLabel">{fileLabels[vc]}</span> : null}

                {isTarget ? <span className="targetDot" aria-hidden="true" /> : null}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
