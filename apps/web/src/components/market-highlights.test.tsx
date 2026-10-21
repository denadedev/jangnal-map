import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { MarketHighlights } from "./market-highlights";

const highlights = [
  { marketId: "m", name: "곤드레", description: "봄엔 생나물", category: "specialty" as const },
  { marketId: "m", name: "콧등치기국수", description: null, category: "food" as const },
];
const props = { marketId: "m", marketName: "정선아리랑시장", scheduleLabel: "끝자리 2·7일" };

describe("MarketHighlights", () => {
  it("groups approved items by category and hides empty ones", () => {
    render(<MarketHighlights {...props} initialHighlights={highlights} />);
    const section = screen.getByRole("region", { name: "방문자가 알려 준 것" });
    expect(within(section).getByRole("heading", { name: "특산물" })).toBeInTheDocument();
    expect(within(section).getByRole("heading", { name: "먹거리" })).toBeInTheDocument();
    expect(within(section).queryByRole("heading", { name: "이용 팁" })).not.toBeInTheDocument();
    expect(within(section).getByText("봄엔 생나물")).toBeInTheDocument();
    expect(within(section).queryByRole("button", { name: "이 장에 대해 알려 주기" })).not.toBeInTheDocument();
  });

  it("shows nothing when there is nothing to show and submissions are off", () => {
    const { container } = render(<MarketHighlights {...props} initialHighlights={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("invites the first submission and opens the sheet", async () => {
    render(<MarketHighlights {...props} initialHighlights={[]} submissionsEnabled />);
    expect(screen.getByText("아직 올라온 이야기가 없어요.")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "이 장에 대해 알려 주기" }));
    const dialog = screen.getByRole("dialog", { name: "이 장에 대해 알려 주기" });
    expect(within(dialog).getByLabelText(/무엇/)).toHaveFocus();
    expect(within(dialog).getByRole("button", { name: "보내기" })).toBeDisabled();

    await userEvent.type(within(dialog).getByLabelText(/무엇/), "미나리");
    await userEvent.click(within(dialog).getByRole("radio", { name: "특산물" }));
    expect(within(dialog).getByRole("radio", { name: "특산물" })).toHaveAttribute("aria-checked", "true");
    expect(within(dialog).getByRole("button", { name: "보내기" })).toBeEnabled();

    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
