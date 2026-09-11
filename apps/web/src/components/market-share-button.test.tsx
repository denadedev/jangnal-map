import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { PublicMarket } from "../lib/market";
import { MarketShareButton } from "./market-share-button";

const market: PublicMarket = {
  id: "uncheon",
  name: "운천전통시장",
  marketType: "상설장+4일장",
  roadAddress: "경기도 포천시 영북면 영북로 177번길 25",
  lotAddress: "경기도 포천시 영북면 운천리 513-15",
  latitude: 38.0899666,
  longitude: 127.2722253,
  scheduleRaw: "4일+9일",
  schedule: { kind: "digit-pair", days: [4, 9] },
  phone: "031-538-2200",
  hasParking: true,
  referenceDate: "2025-11-10",
  status: "운영",
  statusVerified: false,
  onnuri: null,
  source: {
    name: "공공데이터포털 전국전통시장표준데이터",
    url: "https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y",
    referenceDate: "2025-11-10",
  },
};

describe("MarketShareButton", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("shares the next market date, market name, and detail URL", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    vi.stubGlobal("navigator", { share });
    render(<MarketShareButton market={market} today={new Date(2026, 8, 3)} />);

    await user.click(screen.getByRole("button", { name: "공유하기" }));

    expect(share).toHaveBeenCalledWith({
      title: "운천전통시장 | 오늘 장날",
      text: "9월 4일 운천전통시장, 같이 갈래요?",
      url: "http://localhost:3000/markets/운천전통시장-uncheon",
    });
  });

  it("uses the current date when no reference date is provided", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 3, 12));
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { share });
    render(<MarketShareButton market={market} />);

    fireEvent.click(screen.getByRole("button", { name: "공유하기" }));

    expect(share).toHaveBeenCalledWith(expect.objectContaining({
      text: "9월 4일 운천전통시장, 같이 갈래요?",
    }));
  });

  it.each([
    { scheduleRaw: "매일", schedule: { kind: "daily" as const } },
    { scheduleRaw: "확인 중", schedule: { kind: "unknown" as const, raw: "확인 중" } },
  ])("omits the date when the market has no specific next market day", async ({ scheduleRaw, schedule }) => {
    const share = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    vi.stubGlobal("navigator", { share });
    render(<MarketShareButton market={{ ...market, scheduleRaw, schedule }} today={new Date(2026, 8, 3)} />);

    await user.click(screen.getByRole("button", { name: "공유하기" }));

    expect(share).toHaveBeenCalledWith(expect.objectContaining({
      text: "운천전통시장, 같이 갈래요?",
    }));
  });

  it("copies the detail URL when native sharing is unavailable", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    vi.stubGlobal("navigator", { share: undefined, clipboard: { writeText } });
    render(<MarketShareButton market={market} today={new Date(2026, 8, 3)} />);

    await user.click(screen.getByRole("button", { name: "공유하기" }));

    expect(writeText).toHaveBeenCalledWith("http://localhost:3000/markets/운천전통시장-uncheon");
    expect(screen.getByRole("status")).toHaveTextContent("링크를 복사했어요");
  });

  it("silently handles a canceled native share", async () => {
    const share = vi.fn().mockRejectedValue(new DOMException("Share canceled", "AbortError"));
    const user = userEvent.setup();
    vi.stubGlobal("navigator", { share });
    render(<MarketShareButton market={market} today={new Date(2026, 8, 3)} />);

    await user.click(screen.getByRole("button", { name: "공유하기" }));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("copies the detail URL when native sharing fails", async () => {
    const share = vi.fn().mockRejectedValue(new Error("Share failed"));
    const writeText = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    vi.stubGlobal("navigator", { share, clipboard: { writeText } });
    render(<MarketShareButton market={market} today={new Date(2026, 8, 3)} />);

    await user.click(screen.getByRole("button", { name: "공유하기" }));

    expect(writeText).toHaveBeenCalledWith("http://localhost:3000/markets/운천전통시장-uncheon");
    expect(await screen.findByRole("status")).toHaveTextContent("링크를 복사했어요");
  });

  it("shows an error when the detail URL cannot be copied", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("Clipboard denied"));
    const user = userEvent.setup();
    vi.stubGlobal("navigator", { share: undefined, clipboard: { writeText } });
    render(<MarketShareButton market={market} today={new Date(2026, 8, 3)} />);

    await user.click(screen.getByRole("button", { name: "공유하기" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("링크를 복사하지 못했어요");
  });

  it("clears earlier feedback when a later native share is canceled", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    vi.stubGlobal("navigator", { share: undefined, clipboard: { writeText } });
    render(<MarketShareButton market={market} today={new Date(2026, 8, 3)} />);

    await user.click(screen.getByRole("button", { name: "공유하기" }));
    expect(await screen.findByRole("status")).toHaveTextContent("링크를 복사했어요");

    vi.stubGlobal("navigator", {
      share: vi.fn().mockRejectedValue(new DOMException("Share canceled", "AbortError")),
    });
    await user.click(screen.getByRole("button", { name: "공유하기" }));

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("hides feedback from the previously selected market", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    vi.stubGlobal("navigator", { share: undefined, clipboard: { writeText } });
    const { rerender } = render(<MarketShareButton market={market} today={new Date(2026, 8, 3)} />);

    await user.click(screen.getByRole("button", { name: "공유하기" }));
    expect(await screen.findByRole("status")).toHaveTextContent("링크를 복사했어요");

    const anotherMarket = { ...market, id: "another-market", name: "다른시장" };
    rerender(<MarketShareButton market={anotherMarket} today={new Date(2026, 8, 3)} />);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    rerender(<MarketShareButton market={market} today={new Date(2026, 8, 3)} />);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("ignores repeated clicks while sharing is in progress", async () => {
    let finishCopy!: () => void;
    const pendingCopy = new Promise<void>((resolve) => {
      finishCopy = resolve;
    });
    const writeText = vi.fn().mockReturnValue(pendingCopy);
    const user = userEvent.setup();
    vi.stubGlobal("navigator", { share: undefined, clipboard: { writeText } });
    render(<MarketShareButton market={market} today={new Date(2026, 8, 3)} />);
    const button = screen.getByRole("button", { name: "공유하기" });

    await user.click(button);

    expect(button).toBeDisabled();
    await user.click(button);
    expect(writeText).toHaveBeenCalledTimes(1);

    finishCopy();
    await waitFor(() => expect(button).toBeEnabled());
    expect(screen.getByRole("status")).toHaveTextContent("링크를 복사했어요");
  });
});
