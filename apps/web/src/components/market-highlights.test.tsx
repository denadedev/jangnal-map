import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MarketHighlights, MarketHighlightsTeaser } from "./market-highlights";

const highlights = [
  { marketId: "m", name: "곤드레", description: "봄엔 생나물", category: "specialty" as const },
  { marketId: "m", name: "콧등치기국수", description: null, category: "food" as const },
];
const props = { marketId: "m", marketName: "정선아리랑시장", scheduleLabel: "끝자리 2·7일" };
const market = { id: "m", name: "정선아리랑시장", schedule: { kind: "digit-pair" as const, days: [2, 7] as [number, number] } };
const nearbyMarkets = [{ id: "n", name: "평창올림픽시장", scheduleLabel: "끝자리 5·10일" }];

const umami = { track: vi.fn() };
beforeEach(() => {
  (window as unknown as { umami: typeof umami }).umami = umami;
  umami.track.mockClear();
  window.localStorage.clear();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("MarketHighlights", () => {
  it("groups approved items by category and hides empty ones", () => {
    render(<MarketHighlights {...props} initialHighlights={highlights} />);
    const section = screen.getByRole("region", { name: "방문자가 알려 준 것" });
    expect(within(section).getByRole("heading", { name: "특산물" })).toBeInTheDocument();
    expect(within(section).getByRole("heading", { name: "먹거리" })).toBeInTheDocument();
    expect(within(section).queryByRole("heading", { name: "이용 팁" })).not.toBeInTheDocument();
    expect(within(section).getByText("봄엔 생나물")).toBeInTheDocument();
    expect(within(section).queryByRole("button", { name: /알려 주기/ })).not.toBeInTheDocument();
  });

  it("shows nothing when there is nothing to show and submissions are off", () => {
    const { container } = render(<MarketHighlights {...props} initialHighlights={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("asks a question and opens the sheet with the tapped category already chosen", async () => {
    render(<MarketHighlights {...props} initialHighlights={[]} submissionsEnabled />);
    expect(screen.getByText("이 장에서 꼭 사야 하는 건 뭐예요?")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "먹거리 알려 주기" }));
    const dialog = screen.getByRole("dialog", { name: "이 장에 대해 알려 주기" });
    expect(within(dialog).getByRole("radio", { name: "먹거리" })).toHaveAttribute("aria-checked", "true");
    expect(within(dialog).getByLabelText(/무엇/)).toHaveFocus();
    expect(within(dialog).getByLabelText(/무엇/)).toHaveAttribute("placeholder", "예: 수수 부꾸미");
    expect(umami.track).toHaveBeenCalledWith("specialty_form_open", { source: "section_chip", category: "food" });

    await userEvent.type(within(dialog).getByLabelText(/무엇/), "수수 부꾸미");
    expect(within(dialog).getByRole("button", { name: "보내기" })).toBeEnabled();

    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens a blank sheet from 직접 쓰기", async () => {
    render(<MarketHighlights {...props} initialHighlights={[]} submissionsEnabled />);
    await userEvent.click(screen.getByRole("button", { name: "직접 쓰기" }));
    const dialog = screen.getByRole("dialog", { name: "이 장에 대해 알려 주기" });
    expect(within(dialog).getByRole("button", { name: "보내기" })).toBeDisabled();
    expect(within(dialog).getAllByRole("radio").every((radio) => radio.getAttribute("aria-checked") === "false")).toBe(true);
    expect(umami.track).toHaveBeenCalledWith("specialty_form_open", { source: "section" });
  });

  it("keeps quiet chips under existing items", async () => {
    render(<MarketHighlights {...props} initialHighlights={highlights} submissionsEnabled />);
    await userEvent.click(screen.getByRole("button", { name: "볼거리·체험 알려 주기" }));
    expect(within(screen.getByRole("dialog")).getByRole("radio", { name: "볼거리·체험" })).toHaveAttribute("aria-checked", "true");
    expect(umami.track).toHaveBeenCalledWith("specialty_form_open", { source: "more_chip", category: "sight" });
  });

  it("offers nearby markets after sending and continues with the chosen one", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 201 })));
    render(<MarketHighlights {...props} initialHighlights={[]} submissionsEnabled nearbyMarkets={nearbyMarkets} />);
    await userEvent.click(screen.getByRole("button", { name: "특산물 알려 주기" }));
    const dialog = screen.getByRole("dialog");
    await userEvent.type(within(dialog).getByLabelText(/무엇/), "곤드레");
    await userEvent.click(within(dialog).getByRole("button", { name: "보내기" }));

    expect(await within(dialog).findByText("같은 지역 다른 장도 아시나요?")).toBeInTheDocument();
    expect(umami.track).toHaveBeenCalledWith("specialty_submit_success", { category: "specialty", source: "section_chip" });

    await userEvent.click(within(dialog).getByRole("button", { name: /평창올림픽시장/ }));
    expect(within(dialog).getByText("평창올림픽시장")).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/무엇/)).toHaveValue("");
    expect(within(dialog).getByLabelText(/무엇/)).toHaveFocus();
    expect(umami.track).toHaveBeenCalledWith("specialty_form_open", { source: "followup" });
  });
});

describe("MarketHighlightsTeaser", () => {
  const atKoreaNoon = (day: number) => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(Date.UTC(2026, 9, day, 3)));
  };

  it("invites the first story on an ordinary day", async () => {
    atKoreaNoon(25);
    render(<MarketHighlightsTeaser market={market} scheduleLabel="끝자리 2·7일" initialHighlights={[]} submissionsEnabled />);
    await userEvent.click(await screen.findByRole("button", { name: /이 장 이야기를 처음 남겨 주세요/ }));
    expect(screen.getByRole("dialog", { name: "이 장에 대해 알려 주기" })).toBeInTheDocument();
    expect(umami.track).toHaveBeenCalledWith("specialty_form_open", { source: "teaser" });
  });

  it("points to existing stories even when submissions are off", () => {
    atKoreaNoon(25);
    render(<MarketHighlightsTeaser market={market} scheduleLabel="끝자리 2·7일" initialHighlights={highlights} />);
    expect(screen.getByRole("button", { name: "방문자 이야기 2개 · 보기" })).toBeInTheDocument();
  });

  it("hides when there is nothing to read and submissions are off", () => {
    atKoreaNoon(25);
    const { container } = render(<MarketHighlightsTeaser market={market} scheduleLabel="끝자리 2·7일" initialHighlights={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("asks market-day visitors and remembers a dismissal until the next market day", async () => {
    atKoreaNoon(22);
    const { unmount } = render(<MarketHighlightsTeaser market={market} scheduleLabel="끝자리 2·7일" initialHighlights={highlights} submissionsEnabled />);
    const card = await screen.findByRole("group", { name: "오늘 장날이에요" });
    await userEvent.click(within(card).getByRole("button", { name: "이용 팁 알려 주기" }));
    expect(umami.track).toHaveBeenCalledWith("specialty_form_open", { source: "context", category: "tip" });
    await userEvent.keyboard("{Escape}");

    await userEvent.click(within(card).getByRole("button", { name: "닫기" }));
    expect(screen.queryByRole("group", { name: "오늘 장날이에요" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "방문자 이야기 2개 · 보기" })).toBeInTheDocument();
    unmount();

    atKoreaNoon(23);
    render(<MarketHighlightsTeaser market={market} scheduleLabel="끝자리 2·7일" initialHighlights={highlights} submissionsEnabled />);
    expect(screen.queryByRole("group", { name: "어제 장날 다녀오셨나요?" })).not.toBeInTheDocument();
  });

  it("asks the day after a market day", async () => {
    atKoreaNoon(23);
    render(<MarketHighlightsTeaser market={market} scheduleLabel="끝자리 2·7일" initialHighlights={[]} submissionsEnabled />);
    expect(await screen.findByRole("group", { name: "어제 장날 다녀오셨나요?" })).toBeInTheDocument();
  });
});
