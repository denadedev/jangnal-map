import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("loadNaverMaps", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
    delete window.naver;
    vi.resetModules();
  });

  afterEach(() => {
    document.head.innerHTML = "";
    delete window.naver;
  });

  it("removes a failed SDK script so a retry appends a fresh one", async () => {
    const { loadNaverMaps } = await import("./naver-maps");
    const firstLoad = loadNaverMaps("first-key");
    const failedScript = document.querySelector<HTMLScriptElement>('script[data-naver-maps="true"]');

    expect(failedScript).not.toBeNull();
    const firstFailure = expect(firstLoad).rejects.toThrow("NAVER 지도 SDK를 불러오지 못했습니다.");
    failedScript?.dispatchEvent(new Event("error"));
    await firstFailure;
    expect(document.querySelector('script[data-naver-maps="true"]')).toBeNull();

    const retry = loadNaverMaps("second-key");
    const retryScript = document.querySelector<HTMLScriptElement>('script[data-naver-maps="true"]');
    expect(retryScript).not.toBe(failedScript);

    const retryFailure = expect(retry).rejects.toThrow("NAVER 지도 SDK를 불러오지 못했습니다.");
    retryScript?.dispatchEvent(new Event("error"));
    await retryFailure;
  });
});
