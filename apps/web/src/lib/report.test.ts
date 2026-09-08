import { afterEach, describe, expect, it, vi } from "vitest";

import { submitReport, validateReport } from "./report";

describe("validateReport", () => {
  it("requires a report type and message", () => {
    expect(validateReport({
      detailType: "",
      message: " ",
      evidenceUrl: "",
      contact: "",
      consent: false,
    })).toEqual({
      detailType: "제보 유형을 선택해 주세요.",
      message: "알려주실 내용을 입력해 주세요.",
    });
  });

  it("rejects an invalid evidence URL", () => {
    expect(validateReport({
      detailType: "schedule",
      message: "장날이 다릅니다.",
      evidenceUrl: "example.com/notice",
      contact: "",
      consent: false,
    })).toEqual({
      evidenceUrl: "http:// 또는 https://로 시작하는 주소를 입력해 주세요.",
    });
  });

  it("requires consent when contact information is entered", () => {
    expect(validateReport({
      detailType: "schedule",
      message: "장날이 다릅니다.",
      evidenceUrl: "",
      contact: "010-1234-5678",
      consent: false,
    })).toEqual({
      consent: "연락처를 남기려면 개인정보 수집에 동의해 주세요.",
    });
  });

  it("accepts a short anonymous report", () => {
    expect(validateReport({
      detailType: "closure",
      message: "폐장함",
      evidenceUrl: "",
      contact: "",
      consent: false,
    })).toEqual({});
  });
});

describe("submitReport", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("posts report data to the local mail endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);
    const data = new FormData();
    data.set("message", "장날이 다릅니다.");

    await submitReport(data);

    expect(fetchMock).toHaveBeenCalledWith("/api/report", {
      method: "POST",
      body: JSON.stringify({ message: "장날이 다릅니다." }),
      headers: { "Content-Type": "application/json" },
    });
  });

  it("classifies mail endpoint request limits", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 429 }));

    await expect(submitReport(new FormData())).rejects.toMatchObject({
      code: "limit",
      message: "현재 제보 요청이 많아 잠시 접수할 수 없습니다.",
    });
  });

  it("classifies other mail endpoint failures", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));

    await expect(submitReport(new FormData())).rejects.toMatchObject({
      code: "failure",
      message: "제보를 보내지 못했습니다.",
    });
  });
});
