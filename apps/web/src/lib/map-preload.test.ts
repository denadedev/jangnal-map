import { beforeEach, describe, expect, it, vi } from "vitest";

const preload = vi.fn();
const preconnect = vi.fn();
vi.mock("react-dom", () => ({ preload, preconnect }));

const { preloadMapResources } = await import("./map-preload");

describe("preloadMapResources", () => {
  beforeEach(() => {
    preload.mockClear();
    preconnect.mockClear();
  });

  it("starts the market list and the NAVER SDK from the HTML", () => {
    preloadMapResources("key 1");
    expect(preload).toHaveBeenCalledWith("/api/markets", { as: "fetch", crossOrigin: "anonymous" });
    expect(preconnect).toHaveBeenCalledWith("https://oapi.map.naver.com");
    expect(preload).toHaveBeenCalledWith("https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=key%201", { as: "script" });
  });

  it("skips the SDK without a client id", () => {
    preloadMapResources("");
    expect(preload).toHaveBeenCalledTimes(1);
    expect(preconnect).not.toHaveBeenCalled();
  });
});
