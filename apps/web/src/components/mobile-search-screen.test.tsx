import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import { publicMarkets } from "../lib/market-catalog";
import { MobileSearchScreen } from "./mobile-search-screen";

const market = publicMarkets.find((item) => item.name === "통복시장")!;
const range = { start: new Date(2026, 9, 2), end: new Date(2026, 9, 2) };
const props = { locale: "ko" as const, query: "통복시장", matches: [market], today: new Date(2026, 8, 30), range, onQueryChange: () => undefined, onSelect: () => undefined, onShowResults: () => undefined, onClose: () => undefined };

describe("MobileSearchScreen date context", () => {
  it("keeps a non-market-day result and shows its next date separately from the match counts", () => {
    render(<MobileSearchScreen {...props} />);
    expect(screen.getByLabelText("검색 일치 수")).toHaveTextContent("1곳");
    expect(screen.getByLabelText("날짜 조건에 맞는 시장 수")).toHaveTextContent("0곳");
    const card = screen.getByRole("button", { name: /통복시장.*10\/5/ });
    expect(within(card).getByText("다음")).toBeInTheDocument();
    expect(within(card).queryByText("10/2")).not.toBeInTheDocument();
    expect(within(card).queryByText(market.roadAddress!)).not.toBeInTheDocument();
  });

  it("does not label an unconfirmed schedule as a next market day", () => {
    render(<MobileSearchScreen {...props} matches={[{ ...market, schedule: { kind: "unknown", raw: "확인 중" } }]} />);
    const card = screen.getByRole("button", { name: /통복시장.*일정 확인/ });
    expect(within(card).getByText("미확인")).toBeInTheDocument();
    expect(within(card).queryByText("다음")).not.toBeInTheDocument();
    expect(screen.getByLabelText("날짜 조건에 맞는 시장 수")).toHaveTextContent("0곳");
  });

  it("keeps the search screen open during IME composition", async () => {
    function Harness() {
      const [showResults, setShowResults] = useState(false);
      return showResults ? <p>지도 결과</p> : <MobileSearchScreen {...props} onShowResults={() => setShowResults(true)} />;
    }
    render(<Harness />);
    fireEvent.keyDown(screen.getByRole("searchbox"), { key: "Enter", isComposing: true });
    expect(screen.queryByText("지도 결과")).not.toBeInTheDocument();
    await userEvent.keyboard("{Enter}");
    expect(screen.getByText("지도 결과")).toBeInTheDocument();
  });
});
