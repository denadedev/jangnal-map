import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { MobileMarketSheet } from "./mobile-market-sheet";

describe("MobileMarketSheet", () => {
  it("moves between snap states with buttons and keyboard", async () => {
    const user = userEvent.setup();
    let view: ReturnType<typeof render>;
    const renderSheet = (snap: "collapsed" | "half" | "full") => (
      <MobileMarketSheet
        snap={snap}
        onSnapChange={onSnapChange}
        mode="results"
        onModeChange={vi.fn()}
        title="시장 결과"
      >
        <p>시장 목록</p>
      </MobileMarketSheet>
    );
    const onSnapChange = vi.fn((snap: "collapsed" | "half" | "full") => view.rerender(renderSheet(snap)));
    view = render(renderSheet("collapsed"));

    await user.click(screen.getByRole("button", { name: "목록 열기" }));
    expect(onSnapChange).toHaveBeenCalledWith("half");
    await user.click(screen.getByRole("button", { name: "목록 크게 보기" }));
    expect(onSnapChange).toHaveBeenCalledWith("full");
  });

  it("returns from detail mode to results with the list action", async () => {
    const user = userEvent.setup();
    const onModeChange = vi.fn();
    const onSnapChange = vi.fn();
    render(
      <MobileMarketSheet
        snap="full"
        onSnapChange={onSnapChange}
        mode="detail"
        onModeChange={onModeChange}
        title="통복시장 상세"
      >
        <p>통복시장</p>
      </MobileMarketSheet>,
    );

    await user.click(screen.getByRole("button", { name: "목록으로" }));
    expect(onModeChange).toHaveBeenCalledWith("results");
    expect(onSnapChange).toHaveBeenCalledWith("full");
  });

  it("opens full detail from the preview button, ArrowUp, and upward swipe", async () => {
    const user = userEvent.setup();
    const onPreviewOpenDetail = vi.fn();
    render(
      <MobileMarketSheet
        snap="collapsed"
        onSnapChange={vi.fn()}
        mode="preview"
        onModeChange={vi.fn()}
        onPreviewOpenDetail={onPreviewOpenDetail}
        title="통복시장 미리보기"
      >
        <p>통복시장</p>
      </MobileMarketSheet>,
    );

    const handle = screen.getByRole("button", { name: "미리보기 펼치기" });
    Object.defineProperty(handle, "setPointerCapture", { configurable: true, value: vi.fn() });
    await user.click(handle);
    await user.keyboard("{ArrowUp}");
    expect(onPreviewOpenDetail).toHaveBeenCalledOnce();

    onPreviewOpenDetail.mockClear();
    Object.defineProperty(handle, "setPointerCapture", { configurable: true, value: vi.fn() });
    vi.stubGlobal("PointerEvent", MouseEvent);
    fireEvent.pointerDown(handle, { clientY: 300, pointerId: 1 });
    fireEvent.pointerUp(handle, { clientY: 240, pointerId: 1 });
    expect(onPreviewOpenDetail).toHaveBeenCalledOnce();
  });

  it("closes the preview on Escape or a downward gesture", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <MobileMarketSheet snap="collapsed" onSnapChange={vi.fn()} mode="preview" onModeChange={vi.fn()} onClose={onClose} title="통복시장 미리보기">
        <p>통복시장</p>
      </MobileMarketSheet>,
    );

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledOnce();

    const handle = screen.getByRole("button", { name: "미리보기 펼치기" });
    Object.defineProperty(handle, "setPointerCapture", { configurable: true, value: vi.fn() });
    vi.stubGlobal("PointerEvent", MouseEvent);
    fireEvent.pointerDown(handle, { clientY: 240, pointerId: 1 });
    fireEvent.pointerUp(handle, { clientY: 300, pointerId: 1 });
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("traps focus inside full detail, inerts the map, and restores the original focus", async () => {
    const user = userEvent.setup();
    const outside = document.createElement("button");
    outside.textContent = "Search";
    document.body.append(outside);
    outside.focus();
    const { unmount } = render(
      <>
        <div className="map-stage"><button type="button">Map control</button></div>
        <div className="market-filters"><input aria-label="Search markets" /></div>
        <MobileMarketSheet snap="full" onSnapChange={vi.fn()} mode="detail" onModeChange={vi.fn()} title="통복시장 상세">
          <button type="button">Detail action</button>
        </MobileMarketSheet>
      </>,
    );
    const sheet = screen.getByRole("dialog", { name: "통복시장 상세" });
    const handle = screen.getByRole("button", { name: "시트 손잡이" });
    const detailAction = screen.getByRole("button", { name: "Detail action" });

    expect(sheet).toHaveFocus();
    expect(document.querySelector(".map-stage")).toHaveAttribute("inert");
    expect(document.querySelector(".market-filters")).toHaveAttribute("inert");
    await user.tab();
    expect(handle).toHaveFocus();
    await user.tab({ shift: true });
    expect(detailAction).toHaveFocus();
    await user.tab();
    expect(handle).toHaveFocus();

    unmount();
    expect(outside).toHaveFocus();
    outside.remove();
  });
});
