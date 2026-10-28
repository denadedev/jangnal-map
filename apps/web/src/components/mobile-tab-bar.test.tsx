import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MobileTabBar } from "./mobile-tab-bar";

const serveFlyers = (key: string | null) => vi.stubGlobal("fetch", vi.fn(async () => Response.json({ key })));

describe("MobileTabBar", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    window.localStorage.clear();
  });

  it("marks the current tab and counts tab taps", async () => {
    serveFlyers(null);
    const track = vi.fn();
    vi.stubGlobal("umami", { track });
    render(<MobileTabBar active="stories" />);

    expect(screen.getByRole("link", { name: "장 이야기" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "지도" })).not.toHaveAttribute("aria-current");
    const week = screen.getByRole("link", { name: "이번 주" });
    week.addEventListener("click", (event) => event.preventDefault());
    await userEvent.click(week);
    expect(track).toHaveBeenCalledWith("nav-tab", { tab: "week" });
  });

  it("shows a dot on 이번 주 until the new flyers are seen there", async () => {
    serveFlyers("a,b");
    window.localStorage.setItem("jangnal:seen-flyers", "a");
    const { unmount } = render(<MobileTabBar active="map" />);
    expect(await screen.findByText("새 전단")).toBeInTheDocument();
    unmount();

    render(<MobileTabBar active="week" />);
    await waitFor(() => expect(window.localStorage.getItem("jangnal:seen-flyers")).toBe("a,b"));
    expect(screen.queryByText("새 전단")).not.toBeInTheDocument();
  });

  it("shows no dot when every current flyer was seen", async () => {
    serveFlyers("b");
    window.localStorage.setItem("jangnal:seen-flyers", "a,b");
    render(<MobileTabBar active="more" />);
    await waitFor(() => expect(fetch).toHaveBeenCalledWith("/api/flyers/current"));
    expect(screen.queryByText("새 전단")).not.toBeInTheDocument();
  });
});
