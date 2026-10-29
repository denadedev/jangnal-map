import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MapLinkButton } from "./map-link-button";

describe("MapLinkButton", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("moves to the map query address without exposing it as a link", async () => {
    const assign = vi.fn();
    vi.stubGlobal("location", { ...window.location, assign });

    render(<MapLinkButton href="/?when=all&market=market-1">지도에서 보기</MapLinkButton>);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "지도에서 보기" }));
    expect(assign).toHaveBeenCalledWith("/?when=all&market=market-1");
  });
});
