import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { StoryPickerButton } from "./story-picker-button";

const market = {
  id: "market-1",
  name: "능곡시장",
  marketType: "정기시장",
  roadAddress: "경기도 고양시 덕양구 능곡로 12",
  lotAddress: null,
  latitude: 37.6,
  longitude: 126.8,
  scheduleRaw: "2, 7",
  schedule: { kind: "digit-pair", days: [2, 7] },
  phone: null,
  hasParking: null,
  referenceDate: null,
  status: "active",
  statusVerified: false,
  source: { name: "test", url: "https://example.com", referenceDate: null },
  onnuri: null,
};

afterEach(() => vi.unstubAllGlobals());

describe("StoryPickerButton", () => {
  it("opens the sheet right away and shows the picker once the list arrives", async () => {
    let resolve!: (value: Response) => void;
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>((done) => { resolve = done; })));
    const user = userEvent.setup();
    render(<StoryPickerButton source="stories_tab" />);

    await user.click(screen.getByRole("button", { name: "다녀온 장 이야기 들려주기" }));
    const loading = screen.getByRole("dialog", { name: "어느 장이었나요?" });
    expect(within(loading).getByRole("status")).toHaveTextContent("시장 목록을 불러오고 있어요");

    resolve(new Response(JSON.stringify([market]), { status: 200 }));
    expect(await screen.findByRole("searchbox", { name: "시장명 또는 지역 검색" })).toBeInTheDocument();
    // 키보드가 목록을 가리지 않도록 검색창이 아니라 제목에 포커스가 간다.
    expect(screen.getByRole("heading", { name: "어느 장이었나요?" })).toHaveFocus();
  });

  it("keeps the sheet open with a retry when the list fails", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response("", { status: 500 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([market]), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<StoryPickerButton source="stories_tab" />);

    await user.click(screen.getByRole("button", { name: "다녀온 장 이야기 들려주기" }));
    expect(await screen.findByRole("status")).toHaveTextContent("시장 목록을 불러오지 못했어요");
    await user.click(screen.getByRole("button", { name: "다시 불러오기" }));
    expect(await screen.findByRole("searchbox", { name: "시장명 또는 지역 검색" })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not reopen when the list arrives after closing", async () => {
    let resolve!: (value: Response) => void;
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>((done) => { resolve = done; })));
    const user = userEvent.setup();
    render(<StoryPickerButton source="stories_tab" />);

    const button = screen.getByRole("button", { name: "다녀온 장 이야기 들려주기" });
    await user.click(button);
    await user.click(screen.getByRole("button", { name: "닫기" }));
    expect(button).toHaveFocus();
    resolve(new Response(JSON.stringify([market]), { status: 200 }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});
