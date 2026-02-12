import { coordsToAlgebraic, algebraicToCoords } from "./notation";

function cloneBoard(board) {
  return board.map((row) => row.map((p) => (p ? { ...p } : null)));
}

function other(color) {
  return color === "w" ? "b" : "w";
}

function inBounds(r, c) {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

function isEmpty(board, r, c) {
  return inBounds(r, c) && !board[r][c];
}

function isEnemy(board, r, c, color) {
  return inBounds(r, c) && board[r][c] && board[r][c].color !== color;
}

function findKing(board, color) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.color === color && p.type === "k") return { r, c };
    }
  }
  return null;
}

function applyMoveToBoard(board, move) {
  const next = cloneBoard(board);
  const piece = next[move.from.r][move.from.c];
  next[move.from.r][move.from.c] = null;

  // En passant capture
  if (move.isEnPassant) {
    const capR = move.from.r;
    const capC = move.to.c;
    next[capR][capC] = null;
  }

  // Castling rook move
  if (move.isCastle) {
    const rookFrom = move.rookFrom;
    const rookTo = move.rookTo;
    const rook = next[rookFrom.r][rookFrom.c];
    next[rookFrom.r][rookFrom.c] = null;
    next[rookTo.r][rookTo.c] = rook;
  }

  // Promotion
  if (move.promotion) {
    next[move.to.r][move.to.c] = { color: piece.color, type: move.promotion };
  } else {
    next[move.to.r][move.to.c] = piece;
  }

  return next;
}

function slidingAttacks(board, r, c, color, directions) {
  const attacks = [];
  for (const [dr, dc] of directions) {
    let rr = r + dr;
    let cc = c + dc;
    while (inBounds(rr, cc)) {
      if (!board[rr][cc]) {
        attacks.push({ r: rr, c: cc });
      } else {
        if (board[rr][cc].color !== color) attacks.push({ r: rr, c: cc });
        break;
      }
      rr += dr;
      cc += dc;
    }
  }
  return attacks;
}

function knightAttacks(board, r, c, color) {
  const deltas = [
    [-2, -1],
    [-2, 1],
    [-1, -2],
    [-1, 2],
    [1, -2],
    [1, 2],
    [2, -1],
    [2, 1],
  ];
  const res = [];
  for (const [dr, dc] of deltas) {
    const rr = r + dr;
    const cc = c + dc;
    if (!inBounds(rr, cc)) continue;
    if (!board[rr][cc] || board[rr][cc].color !== color) res.push({ r: rr, c: cc });
  }
  return res;
}

function kingAttacks(board, r, c, color) {
  const res = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const rr = r + dr;
      const cc = c + dc;
      if (!inBounds(rr, cc)) continue;
      if (!board[rr][cc] || board[rr][cc].color !== color) res.push({ r: rr, c: cc });
    }
  }
  return res;
}

function pawnAttacksSquares(r, c, color) {
  const dir = color === "w" ? -1 : 1;
  const res = [];
  for (const dc of [-1, 1]) {
    const rr = r + dir;
    const cc = c + dc;
    if (inBounds(rr, cc)) res.push({ r: rr, c: cc });
  }
  return res;
}

/**
 * Determine whether `square` is attacked by `attackerColor` on the given board.
 */
function isSquareAttacked(board, square, attackerColor) {
  const { r: tr, c: tc } = square;

  // Pawns
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p || p.color !== attackerColor || p.type !== "p") continue;
      const att = pawnAttacksSquares(r, c, attackerColor);
      if (att.some((s) => s.r === tr && s.c === tc)) return true;
    }
  }

  // Knights
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p || p.color !== attackerColor || p.type !== "n") continue;
      const att = knightAttacks(board, r, c, attackerColor);
      if (att.some((s) => s.r === tr && s.c === tc)) return true;
    }
  }

  // Bishops/Queens diagonals
  const diagDirs = [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ];
  // Rooks/Queens straights
  const orthoDirs = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p || p.color !== attackerColor) continue;
      if (p.type === "b" || p.type === "q") {
        const att = slidingAttacks(board, r, c, attackerColor, diagDirs);
        if (att.some((s) => s.r === tr && s.c === tc)) return true;
      }
      if (p.type === "r" || p.type === "q") {
        const att = slidingAttacks(board, r, c, attackerColor, orthoDirs);
        if (att.some((s) => s.r === tr && s.c === tc)) return true;
      }
    }
  }

  // King (adjacent)
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p || p.color !== attackerColor || p.type !== "k") continue;
      const att = kingAttacks(board, r, c, attackerColor);
      if (att.some((s) => s.r === tr && s.c === tc)) return true;
    }
  }

  return false;
}

function isInCheck(board, color) {
  const king = findKing(board, color);
  if (!king) return false;
  return isSquareAttacked(board, king, other(color));
}

function makeEmptyBoard() {
  return Array.from({ length: 8 }).map(() => Array.from({ length: 8 }).map(() => null));
}

function makeInitialBoard() {
  const b = makeEmptyBoard();
  const back = ["r", "n", "b", "q", "k", "b", "n", "r"];
  // Black
  for (let c = 0; c < 8; c++) {
    b[0][c] = { color: "b", type: back[c] };
    b[1][c] = { color: "b", type: "p" };
  }
  // White
  for (let c = 0; c < 8; c++) {
    b[7][c] = { color: "w", type: back[c] };
    b[6][c] = { color: "w", type: "p" };
  }
  return b;
}

function initialCastling() {
  return { wK: true, wQ: true, bK: true, bQ: true };
}

function isPromotionRank(r, color) {
  return (color === "w" && r === 0) || (color === "b" && r === 7);
}

function pseudoMovesForPiece(game, from) {
  const { board, turn, castling, enPassant } = game;
  const piece = board[from.r][from.c];
  if (!piece || piece.color !== turn) return [];

  const moves = [];
  const color = piece.color;

  const add = (to, extras = {}) => {
    moves.push({
      from,
      to,
      promotionRequired: false,
      ...extras,
    });
  };

  if (piece.type === "p") {
    const dir = color === "w" ? -1 : 1;
    const startRank = color === "w" ? 6 : 1;

    // forward 1
    const r1 = from.r + dir;
    if (inBounds(r1, from.c) && !board[r1][from.c]) {
      const promo = isPromotionRank(r1, color);
      add({ r: r1, c: from.c }, { promotionRequired: promo });
      // forward 2
      const r2 = from.r + 2 * dir;
      if (from.r === startRank && !board[r2][from.c]) {
        add({ r: r2, c: from.c }, { setsEnPassant: coordsToAlgebraic(from.r + dir, from.c) });
      }
    }

    // captures
    for (const dc of [-1, 1]) {
      const rc = from.c + dc;
      const rr = from.r + dir;
      if (!inBounds(rr, rc)) continue;
      if (board[rr][rc] && board[rr][rc].color !== color) {
        const promo = isPromotionRank(rr, color);
        add({ r: rr, c: rc }, { capture: true, promotionRequired: promo });
      }
    }

    // en passant
    if (enPassant) {
      const ep = algebraicToCoords(enPassant);
      if (ep) {
        // EP target must be one step diagonal
        if (Math.abs(ep.c - from.c) === 1 && ep.r === from.r + dir) {
          // Must have enemy pawn behind target square
          const capR = from.r;
          const capC = ep.c;
          const victim = board[capR][capC];
          if (victim && victim.color !== color && victim.type === "p") {
            add({ r: ep.r, c: ep.c }, { isEnPassant: true, capture: true });
          }
        }
      }
    }
  } else if (piece.type === "n") {
    for (const to of knightAttacks(board, from.r, from.c, color)) {
      add(to, { capture: !!board[to.r][to.c] });
    }
  } else if (piece.type === "b") {
    const dirs = [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ];
    for (const to of slidingAttacks(board, from.r, from.c, color, dirs)) add(to, { capture: !!board[to.r][to.c] });
  } else if (piece.type === "r") {
    const dirs = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ];
    for (const to of slidingAttacks(board, from.r, from.c, color, dirs)) add(to, { capture: !!board[to.r][to.c] });
  } else if (piece.type === "q") {
    const dirs = [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ];
    for (const to of slidingAttacks(board, from.r, from.c, color, dirs)) add(to, { capture: !!board[to.r][to.c] });
  } else if (piece.type === "k") {
    for (const to of kingAttacks(board, from.r, from.c, color)) add(to, { capture: !!board[to.r][to.c] });

    // Castling (only if not currently in check)
    if (!isInCheck(board, color)) {
      const isWhite = color === "w";
      const homeR = isWhite ? 7 : 0;

      const canKingSide = isWhite ? castling.wK : castling.bK;
      const canQueenSide = isWhite ? castling.wQ : castling.bQ;

      // King side: squares between king and rook must be empty and not attacked
      if (canKingSide) {
        const rook = board[homeR][7];
        if (rook && rook.color === color && rook.type === "r") {
          const empty1 = !board[homeR][5] && !board[homeR][6];
          if (empty1) {
            const pass1 = !isSquareAttacked(board, { r: homeR, c: 5 }, other(color));
            const pass2 = !isSquareAttacked(board, { r: homeR, c: 6 }, other(color));
            if (pass1 && pass2) {
              add(
                { r: homeR, c: 6 },
                {
                  isCastle: true,
                  rookFrom: { r: homeR, c: 7 },
                  rookTo: { r: homeR, c: 5 },
                }
              );
            }
          }
        }
      }

      // Queen side: squares between king and rook empty and not attacked
      if (canQueenSide) {
        const rook = board[homeR][0];
        if (rook && rook.color === color && rook.type === "r") {
          const empty2 = !board[homeR][1] && !board[homeR][2] && !board[homeR][3];
          if (empty2) {
            const pass1 = !isSquareAttacked(board, { r: homeR, c: 3 }, other(color));
            const pass2 = !isSquareAttacked(board, { r: homeR, c: 2 }, other(color));
            if (pass1 && pass2) {
              add(
                { r: homeR, c: 2 },
                {
                  isCastle: true,
                  rookFrom: { r: homeR, c: 0 },
                  rookTo: { r: homeR, c: 3 },
                }
              );
            }
          }
        }
      }
    }
  }

  return moves;
}

function legalMovesForPiece(game, from) {
  const pseudo = pseudoMovesForPiece(game, from);
  const legal = [];

  for (const m of pseudo) {
    // Determine if promotion selected (not required here); we only filter by king safety.
    const nextBoard = applyMoveToBoard(game.board, { ...m, promotion: m.promotion ?? null });

    // Special: if king moved, ensure destination isn't attacked (already covered for castling paths, but safe anyway)
    if (isInCheck(nextBoard, game.turn)) continue;
    legal.push(m);
  }

  return legal;
}

function computeGameResult(game) {
  const color = game.turn;
  // any legal moves?
  let hasMove = false;
  for (let r = 0; r < 8 && !hasMove; r++) {
    for (let c = 0; c < 8 && !hasMove; c++) {
      const p = game.board[r][c];
      if (!p || p.color !== color) continue;
      const lm = legalMovesForPiece(game, { r, c });
      if (lm.length > 0) hasMove = true;
    }
  }

  const inCheck = isInCheck(game.board, color);
  if (hasMove) {
    return { type: "ongoing", inCheck };
  }

  if (inCheck) {
    return { type: "checkmate", winner: other(color), inCheck: true };
  }
  return { type: "stalemate", inCheck: false };
}

function moveToSAN(prevGame, move, nextGame) {
  const piece = prevGame.board[move.from.r][move.from.c];
  const targetPiece = prevGame.board[move.to.r][move.to.c];

  const dest = coordsToAlgebraic(move.to.r, move.to.c);
  const isCapture = !!targetPiece || move.isEnPassant;

  // Castling notation
  if (move.isCastle) {
    return move.to.c === 6 ? "O-O" : "O-O-O";
  }

  const pieceLetter = piece.type === "p" ? "" : piece.type.toUpperCase();
  let text = pieceLetter;

  if (piece.type === "p" && isCapture) {
    const fromFile = String.fromCharCode("a".charCodeAt(0) + move.from.c);
    text += fromFile;
  }

  if (isCapture) text += "x";
  text += dest;

  if (move.promotion) {
    text += `=${move.promotion.toUpperCase()}`;
  }

  // Check / mate suffix
  const nextTurn = nextGame.turn;
  const nextResult = nextGame.result;
  if (nextResult.type === "checkmate") text += "#";
  else if (nextGame.inCheck) text += "+";

  // Minimal SAN (no disambiguation for same-piece moves; acceptable for this UI)
  return text;
}

// PUBLIC_INTERFACE
export function initialGameState() {
  /** Create the initial chess game state. */
  const board = makeInitialBoard();
  const game = {
    board,
    turn: "w",
    castling: initialCastling(),
    enPassant: null, // algebraic square
    halfmoveClock: 0,
    fullmoveNumber: 1,
    history: [],
    lastMove: null,
    moveList: [],
    result: { type: "ongoing" },
    inCheck: false,
    inCheckKingSquare: null,
  };

  const computed = computeGameResult(game);
  game.result = { type: computed.type, winner: computed.winner, reason: computed.reason };
  game.inCheck = computed.inCheck;
  game.inCheckKingSquare = computed.inCheck ? findKing(game.board, game.turn) : null;
  return game;
}

// PUBLIC_INTERFACE
export function getLegalMovesForSquare(game, from) {
  /** Return legal moves for the piece at `from` given current game state. */
  return legalMovesForPiece(game, from);
}

function updateCastlingRights(prev, board, move) {
  const next = { ...prev };
  const moved = board[move.from.r][move.from.c];
  if (!moved) return next;

  // King move removes both rights
  if (moved.type === "k") {
    if (moved.color === "w") {
      next.wK = false;
      next.wQ = false;
    } else {
      next.bK = false;
      next.bQ = false;
    }
  }

  // Rook move removes side
  if (moved.type === "r") {
    if (moved.color === "w" && move.from.r === 7 && move.from.c === 7) next.wK = false;
    if (moved.color === "w" && move.from.r === 7 && move.from.c === 0) next.wQ = false;
    if (moved.color === "b" && move.from.r === 0 && move.from.c === 7) next.bK = false;
    if (moved.color === "b" && move.from.r === 0 && move.from.c === 0) next.bQ = false;
  }

  // Capturing a rook on its original square removes that side too
  const captured = board[move.to.r][move.to.c];
  if (captured && captured.type === "r") {
    if (captured.color === "w" && move.to.r === 7 && move.to.c === 7) next.wK = false;
    if (captured.color === "w" && move.to.r === 7 && move.to.c === 0) next.wQ = false;
    if (captured.color === "b" && move.to.r === 0 && move.to.c === 7) next.bK = false;
    if (captured.color === "b" && move.to.r === 0 && move.to.c === 0) next.bQ = false;
  }

  return next;
}

// PUBLIC_INTERFACE
export function makeMove(game, input) {
  /**
   * Apply a move if legal.
   * input: {from:{r,c}, to:{r,c}, promotion?: "q"|"r"|"b"|"n"}
   */
  const from = input.from;
  const to = input.to;
  const promotion = input.promotion ?? null;

  if (game.result.type !== "ongoing") return { ok: false, error: "Game over" };

  const piece = game.board[from.r][from.c];
  if (!piece || piece.color !== game.turn) return { ok: false, error: "No piece to move" };

  const legal = legalMovesForPiece(game, from);
  const base = legal.find((m) => m.to.r === to.r && m.to.c === to.c);
  if (!base) return { ok: false, error: "Illegal move" };

  if (base.promotionRequired && !promotion) {
    return { ok: false, error: "Promotion required" };
  }

  const move = { ...base, promotion: base.promotionRequired ? promotion : null };

  // Save snapshot for undo (simple deep copy)
  const snapshot = {
    ...game,
    board: cloneBoard(game.board),
    castling: { ...game.castling },
    history: [...game.history],
    moveList: [...game.moveList],
    lastMove: game.lastMove ? { ...game.lastMove, from: { ...game.lastMove.from }, to: { ...game.lastMove.to } } : null,
    result: { ...game.result },
    inCheck: game.inCheck,
    inCheckKingSquare: game.inCheckKingSquare ? { ...game.inCheckKingSquare } : null,
  };

  const nextBoard = applyMoveToBoard(game.board, move);

  // Update en passant square
  let nextEnPassant = null;
  if (move.setsEnPassant) nextEnPassant = move.setsEnPassant;

  // Update castling rights
  const nextCastling = updateCastlingRights(game.castling, game.board, move);

  // Halfmove clock (simplified)
  const isPawnMove = piece.type === "p";
  const isCapture = !!game.board[to.r][to.c] || move.isEnPassant;
  const nextHalfmove = isPawnMove || isCapture ? 0 : game.halfmoveClock + 1;

  const nextTurn = other(game.turn);
  const nextFullmove = game.fullmoveNumber + (game.turn === "b" ? 1 : 0);

  const nextGame = {
    board: nextBoard,
    turn: nextTurn,
    castling: nextCastling,
    enPassant: nextEnPassant,
    halfmoveClock: nextHalfmove,
    fullmoveNumber: nextFullmove,
    history: [...game.history, snapshot],
    lastMove: { from: { ...from }, to: { ...to } },
    moveList: [...game.moveList],
    result: { type: "ongoing" },
    inCheck: false,
    inCheckKingSquare: null,
  };

  const computed = computeGameResult(nextGame);
  nextGame.result =
    computed.type === "ongoing"
      ? { type: "ongoing" }
      : computed.type === "checkmate"
        ? { type: "checkmate", winner: computed.winner }
        : computed.type === "stalemate"
          ? { type: "stalemate" }
          : { type: "draw", reason: computed.reason ?? "unknown" };

  nextGame.inCheck = computed.inCheck;
  nextGame.inCheckKingSquare = computed.inCheck ? findKing(nextGame.board, nextGame.turn) : null;

  const san = moveToSAN(game, move, nextGame);
  nextGame.moveList = [...nextGame.moveList, san];

  return { ok: true, game: nextGame };
}
