import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MarketHighlights } from "./market-highlights";

const highlights = [
  { marketId: "m", name: "곤드레", description: "봄엔 생나물", category: "specialty" as const, createdAt: "2026-10-20T00:00:00.000Z" },
  { marketId: "m", name: "콧등치기국수", description: null, category: "food" as const, createdAt: "2026-10-21T00:00:00.000Z" },
];
const market = { id: "m", name: "정선아리랑시장", schedule: { kind: "digit-pair" as const, days: [2, 7] as [number, number] } };
const props = { market, scheduleLabel: "끝자리 2·7일" };
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

const atKoreaNoon = (day: number) => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(Date.UTC(2026, 9, day, 3)));
};

describe("MarketHighlights", () => {
  // 10월 25일은 2·7장의 장날도, 그다음 날도 아니다.
  beforeEach(() => atKoreaNoon(25));

  it("lists approved stories newest first without submission buttons when submissions are off", () => {
    render(<MarketHighlights {...props} initialHighlights={highlights} />);
    const section = screen.getByRole("region", { name: "방문자가 알려 준 것" });
    const items = within(section).getAllByRole("listitem");
    expect(items.map((item) => item.textContent)).toEqual(["콧등치기국수먹거리", "곤드레특산물봄엔 생나물"]);
    expect(within(section).getByText("방문자 제보 · 운영자 확인")).toBeInTheDocument();
    expect(within(section).queryByRole("button", { name: /알려 주기/ })).not.toBeInTheDocument();
  });

  it("shows two stories and keeps the rest in the page until 모두 보기", async () => {
    const more = [...highlights, { marketId: "m", name: "메밀전병", description: null, category: "food" as const, createdAt: "2026-10-19T00:00:00.000Z" }];
    render(<MarketHighlights {...props} initialHighlights={more} />);
    expect(screen.getByText("메밀전병").closest("li")).not.toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "모두 보기 3" }));
    expect(screen.getByText("메밀전병").closest("li")).toBeVisible();
    expect(screen.queryByRole("button", { name: /모두 보기/ })).not.toBeInTheDocument();
    expect(umami.track).toHaveBeenCalledWith("story_block_more", { count: "3" });
  });

  it("scrolls to and marks the story opened from the map, and counts follow-ups as latest", async () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    render(<MarketHighlights {...props} initialHighlights={highlights} submissionsEnabled focusName="콧등치기국수" />);
    expect(scrollIntoView).toHaveBeenCalled();
    const item = screen.getByText("콧등치기국수").closest("li")!;
    expect(item).toHaveAttribute("aria-current", "true");
    expect(within(item).getByText("새 이야기")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "먹거리 알려 주기" }));
    expect(umami.track).toHaveBeenCalledWith("specialty_form_open", { source: "latest", category: "food" });
  });

  it("shows nothing when there is nothing to show and submissions are off", () => {
    const { container } = render(<MarketHighlights {...props} initialHighlights={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("invites the first story and opens the sheet with the tapped category already chosen", async () => {
    render(<MarketHighlights {...props} initialHighlights={[]} submissionsEnabled />);
    expect(screen.getByText("이 장 첫 이야기를 남겨 주세요")).toBeInTheDocument();

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

  it("keeps quiet chips under existing stories", async () => {
    render(<MarketHighlights {...props} initialHighlights={highlights} submissionsEnabled />);
    await userEvent.click(within(screen.getByRole("group", { name: "나도 알려 주기" })).getByRole("button", { name: "볼거리·체험 알려 주기" }));
    expect(within(screen.getByRole("dialog")).getByRole("radio", { name: "볼거리·체험" })).toHaveAttribute("aria-checked", "true");
    expect(umami.track).toHaveBeenCalledWith("specialty_form_open", { source: "more_chip", category: "sight" });
  });

  it("previews the map marker after sending and continues with a nearby market", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 201 })));
    render(<MarketHighlights {...props} initialHighlights={[]} submissionsEnabled nearbyMarkets={nearbyMarkets} />);
    await userEvent.click(screen.getByRole("button", { name: "특산물 알려 주기" }));
    const dialog = screen.getByRole("dialog");
    await userEvent.type(within(dialog).getByLabelText(/무엇/), "곤드레");
    await userEvent.click(within(dialog).getByRole("button", { name: "보내기" }));

    expect(await within(dialog).findByText("올라가면 이렇게 보여요")).toBeInTheDocument();
    expect(within(dialog).getByText("같은 지역 다른 장도 아시나요?")).toBeInTheDocument();
    expect(umami.track).toHaveBeenCalledWith("specialty_submit_success", { category: "specialty", source: "section_chip" });

    await userEvent.click(within(dialog).getByRole("button", { name: /평창올림픽시장/ }));
    expect(within(dialog).getByText("평창올림픽시장")).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/무엇/)).toHaveValue("");
    expect(within(dialog).getByLabelText(/무엇/)).toHaveFocus();
    expect(umami.track).toHaveBeenCalledWith("specialty_form_open", { source: "followup" });
  });

  it("asks market-day visitors first and remembers a dismissal until the next market day", async () => {
    atKoreaNoon(22);
    const { unmount } = render(<MarketHighlights {...props} initialHighlights={highlights} submissionsEnabled />);
    const card = await screen.findByRole("group", { name: "오늘 장날이에요" });
    expect(screen.queryByRole("group", { name: "나도 알려 주기" })).not.toBeInTheDocument();
    await userEvent.click(within(card).getByRole("button", { name: "이용 팁 알려 주기" }));
    expect(umami.track).toHaveBeenCalledWith("specialty_form_open", { source: "context", category: "tip" });
    await userEvent.keyboard("{Escape}");

    await userEvent.click(within(card).getByRole("button", { name: "닫기" }));
    expect(screen.queryByRole("group", { name: "오늘 장날이에요" })).not.toBeInTheDocument();
    expect(screen.getByRole("group", { name: "나도 알려 주기" })).toBeInTheDocument();
    unmount();

    atKoreaNoon(23);
    render(<MarketHighlights {...props} initialHighlights={highlights} submissionsEnabled />);
    expect(screen.queryByRole("group", { name: "어제 장날 다녀오셨나요?" })).not.toBeInTheDocument();
  });

  it("asks the day after a market day", async () => {
    atKoreaNoon(23);
    render(<MarketHighlights {...props} initialHighlights={[]} submissionsEnabled />);
    expect(await screen.findByRole("group", { name: "어제 장날 다녀오셨나요?" })).toBeInTheDocument();
    expect(screen.queryByText("이 장 첫 이야기를 남겨 주세요")).not.toBeInTheDocument();
  });
});
