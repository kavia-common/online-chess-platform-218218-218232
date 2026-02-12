import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

function square(name) {
  // ChessBoard uses aria-label starting with algebraic (e.g., "e2, white p" or "e4")
  return screen.getByRole("gridcell", { name: new RegExp(`^${name}\\b`, "i") });
}

describe("App UI interactions", () => {
  test("selecting a piece highlights its legal move targets", async () => {
    const user = userEvent.setup();
    render(<App />);

    // Initially, no selection -> 0 legal moves in debug panel.
    // Note: the left "Game" panel contains similar rows; scope to the right "Debug" panel.
    const debugPanel = screen.getByText("Debug").closest("section");
    expect(debugPanel).not.toBeNull();
    const debug = within(debugPanel);

    expect(debug.getByText("Legal moves").parentElement).toHaveTextContent("0");

    // Select white pawn on e2.
    await user.click(square("e2"));

    // Debug panel should show selection and legal move count.
    expect(debug.getByText("Selected").parentElement).toHaveTextContent("e2");
    // e2 pawn should have 2 legal moves at start: e3 and e4
    expect(debug.getByText("Legal moves").parentElement).toHaveTextContent("2");

    // Target squares should be visually marked as targets.
    expect(square("e3").className).toMatch(/\bsqTarget\b/);
    expect(square("e4").className).toMatch(/\bsqTarget\b/);
  });

  test("making a legal move updates the board, move list, and status/turn", async () => {
    const user = userEvent.setup();
    render(<App />);

    // Start status
    expect(screen.getByRole("status")).toHaveTextContent(/white to move/i);

    // Make move e2->e4
    await user.click(square("e2"));
    await user.click(square("e4"));

    // After move, it's black to move.
    expect(screen.getByRole("status")).toHaveTextContent(/black to move/i);

    // e4 should now contain a white pawn. aria-label includes ", white p"
    expect(square("e4")).toHaveAttribute("aria-label", expect.stringMatching(/^e4, white p/i));
    // e2 should be empty
    expect(square("e2")).toHaveAttribute("aria-label", "e2");

    // Move list should show "e4" for pawn move.
    const moveList = screen.getByRole("list", { name: /move list/i });
    expect(moveList).toHaveTextContent(/\b(e4)\b/);

    // Last move debug should show e2→e4 (scope to Debug panel to avoid ambiguity)
    const debugPanel = screen.getByText("Debug").closest("section");
    expect(debugPanel).not.toBeNull();
    const debug = within(debugPanel);

    expect(debug.getByText("Last move").parentElement).toHaveTextContent("e2→e4");
  });

  test("checkmate status updates on Fool's mate sequence", async () => {
    const user = userEvent.setup();
    render(<App />);

    // 1. f3
    await user.click(square("f2"));
    await user.click(square("f3"));

    // ... e5
    await user.click(square("e7"));
    await user.click(square("e5"));

    // 2. g4
    await user.click(square("g2"));
    await user.click(square("g4"));

    // ... Qh4#
    await user.click(square("d8"));
    await user.click(square("h4"));

    expect(screen.getByRole("status")).toHaveTextContent(/checkmate/i);
    expect(screen.getByRole("status")).toHaveTextContent(/black wins/i);
  });
});
