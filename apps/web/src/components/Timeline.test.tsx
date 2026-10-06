// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Timeline } from "./Timeline";

describe("Timeline", () => {
  it("renders event name and failure state", () => {
    render(<Timeline active={0} onSelect={() => undefined} events={[{
      sequence: 0, type: "error", timestamp: new Date().toISOString(), durationMs: 4,
      name: "currency_mismatch", error: "wrong currency", metadata: {},
    }]}/>);
    expect(screen.getByText("currency_mismatch")).toBeInTheDocument();
    expect(screen.getByRole("button")).toHaveClass("danger", "active");
  });
});
