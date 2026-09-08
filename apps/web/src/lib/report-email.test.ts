import { describe, expect, it, vi } from "vitest";

import { createReportMessage, createSmtpOptions, readSmtpConfig, sendReportEmail, type MailTransport } from "./report-email";

const report = {
  scope: "market" as const,
  detailType: "schedule",
  message: "실제 장날은 5일과 10일입니다.",
  evidenceUrl: "https://example.com/notice",
  contact: "010-1234-5678",
  pageUrl: "https://jangnal-map.vercel.app/report?kind=market",
  market: { id: "market-45b640ccbe294100", name: "운천전통시장" },
};

describe("report email", () => {
  it("requires SMTP credentials and defaults the recipient to the sender", () => {
    expect(readSmtpConfig({ SMTP_USER: "report@gmail.com", SMTP_PASS: "app-password" })).toEqual({
      user: "report@gmail.com",
      pass: "app-password",
      to: "report@gmail.com",
    });
    expect(() => readSmtpConfig({ SMTP_USER: "report@gmail.com" })).toThrow("SMTP 설정이 필요합니다.");
  });

  it("bounds Gmail SMTP connection time", () => {
    expect(createSmtpOptions({ user: "report@gmail.com", pass: "app-password", to: "report@gmail.com" })).toEqual({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: "report@gmail.com", pass: "app-password" },
      connectionTimeout: 5_000,
      greetingTimeout: 5_000,
      socketTimeout: 10_000,
      dnsTimeout: 5_000,
    });
  });

  it("builds a plain-text message with verified market context", () => {
    expect(createReportMessage(report)).toEqual({
      subject: "[오늘장날] 시장 정보 수정 제보 - 운천전통시장",
      text: [
        "제보 범위: 시장 정보",
        "시장: 운천전통시장 (market-45b640ccbe294100)",
        "유형: 장날·운영일",
        "내용: 실제 장날은 5일과 10일입니다.",
        "근거 URL: https://example.com/notice",
        "연락처: 010-1234-5678",
        "제출 화면: https://jangnal-map.vercel.app/report?kind=market",
      ].join("\n"),
    });
  });

  it("uses the service feedback subject without market wording", () => {
    expect(createReportMessage({
      ...report,
      scope: "service",
      detailType: "interface",
      market: null,
    }).subject).toBe("[오늘장날] 서비스 불편 신고");
  });

  it("sends through the injected SMTP transport", async () => {
    const sendMail = vi.fn().mockResolvedValue({ messageId: "message-1" });
    const transport: MailTransport = { sendMail };

    await sendReportEmail(report, transport, {
      user: "report@gmail.com",
      pass: "app-password",
      to: "owner@example.com",
    });

    expect(sendMail).toHaveBeenCalledWith({
      from: "오늘 장날 <report@gmail.com>",
      to: "owner@example.com",
      subject: "[오늘장날] 시장 정보 수정 제보 - 운천전통시장",
      text: expect.stringContaining("시장: 운천전통시장"),
      disableFileAccess: true,
      disableUrlAccess: true,
    });
  });
});
