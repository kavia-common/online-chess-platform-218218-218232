import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders Retro Chess title", () => {
  render(<App />);
  expect(screen.getByText(/retro chess/i)).toBeInTheDocument();
});
