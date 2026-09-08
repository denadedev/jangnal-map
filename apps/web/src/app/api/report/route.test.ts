import { describe, expect, it, vi } from "vitest";

import { createReportHandler } from "../../../lib/report-handler";

const request = (body: unknown, origin = "https://jangnal-map.vercel.app") => new Request(
  "https://jangnal-map.vercel.app/api/report",
  {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: origin },
    body: JSON.stringify(body),
  },
);

describe("POST /api/report", () => {
  it("sends a validated market report with the catalog market name", async () => {
    const sendMail = vi.fn().mockResolvedValue(undefined);
    const handler = createReportHandler(sendMail);

    const response = await handler(request({
      scope: "market",
      detail_type: "schedule",
      message: "실제 장날은 5일과 10일입니다.",
      evidence_url: "https://example.com/notice",
      contact: "",
      privacy_consent: "",
      market_id: "market-45b640ccbe294100",
      page_url: "https://jangnal-map.vercel.app/report?kind=market",
      _gotcha: "",
    }));

    expect(response.status).toBe(200);
    expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({
      scope: "market",
      detailType: "schedule",
      market: { id: "market-45b640ccbe294100", name: "운천전통시장" },
    }));
  });

  it("sends a validated service report without market context", async () => {
    const sendMail = vi.fn().mockResolvedValue(undefined);
    const response = await createReportHandler(sendMail)(request({
      scope: "service",
      detail_type: "interface",
      message: "  버튼이 동작하지 않습니다.  ",
      evidence_url: " https://example.com/screenshot ",
      contact: " reporter@example.com ",
      privacy_consent: "yes",
      page_url: "https://jangnal-map.vercel.app/",
    }));

    expect(response.status).toBe(200);
    expect(sendMail).toHaveBeenCalledWith({
      scope: "service",
      detailType: "interface",
      message: "버튼이 동작하지 않습니다.",
      evidenceUrl: "https://example.com/screenshot",
      contact: "reporter@example.com",
      pageUrl: "https://jangnal-map.vercel.app/",
      market: null,
    });
  });

  it("rejects an unknown market without sending mail", async () => {
    const sendMail = vi.fn();
    const response = await createReportHandler(sendMail)(request({
      scope: "market",
      detail_type: "schedule",
      message: "장날이 다릅니다.",
      market_id: "missing",
    }));

    expect(response.status).toBe(400);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("rejects browser requests from another origin", async () => {
    const sendMail = vi.fn();
    const response = await createReportHandler(sendMail)(request({
      scope: "service",
      detail_type: "interface",
      message: "버튼이 동작하지 않습니다.",
    }, "https://example.com"));

    expect(response.status).toBe(403);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("silently accepts honeypot submissions without sending mail", async () => {
    const sendMail = vi.fn();
    const response = await createReportHandler(sendMail)(request({
      scope: "service",
      detail_type: "interface",
      message: "spam",
      _gotcha: "filled",
    }));

    expect(response.status).toBe(200);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("rejects a non-object JSON body", async () => {
    const sendMail = vi.fn();

    const response = await createReportHandler(sendMail)(request(null));

    expect(response.status).toBe(400);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("rejects a request without an Origin header", async () => {
    const sendMail = vi.fn();
    const response = await createReportHandler(sendMail)(new Request(
      "https://jangnal-map.vercel.app/api/report",
      { method: "POST", body: JSON.stringify({ scope: "service" }) },
    ));

    expect(response.status).toBe(403);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON", async () => {
    const sendMail = vi.fn();
    const response = await createReportHandler(sendMail)(new Request(
      "https://jangnal-map.vercel.app/api/report",
      { method: "POST", headers: { Origin: "https://jangnal-map.vercel.app" }, body: "{" },
    ));

    expect(response.status).toBe(400);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("rejects oversized request bodies", async () => {
    const sendMail = vi.fn();
    const response = await createReportHandler(sendMail)(request({ message: "가".repeat(10_001) }));

    expect(response.status).toBe(413);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it.each([
    ["invalid scope", { scope: "unknown", detail_type: "interface", message: "불편합니다." }],
    ["unknown detail type", { scope: "service", detail_type: "unknown", message: "불편합니다." }],
    ["empty message", { scope: "service", detail_type: "interface", message: " " }],
    ["oversized message", { scope: "service", detail_type: "interface", message: "가".repeat(1_001) }],
    ["invalid evidence URL", { scope: "service", detail_type: "interface", message: "불편합니다.", evidence_url: "example.com" }],
    ["unsupported evidence protocol", { scope: "service", detail_type: "interface", message: "불편합니다.", evidence_url: "ftp://example.com/file" }],
    ["oversized contact", { scope: "service", detail_type: "interface", message: "불편합니다.", contact: "a".repeat(101), privacy_consent: "yes" }],
    ["contact without consent", { scope: "service", detail_type: "interface", message: "불편합니다.", contact: "010-1234-5678" }],
  ])("rejects %s without sending mail", async (_name, body) => {
    const sendMail = vi.fn();
    const response = await createReportHandler(sendMail)(request(body));

    expect(response.status).toBe(400);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("returns 502 when SMTP delivery fails", async () => {
    const logError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const smtpError = Object.assign(new Error("SMTP unavailable"), { code: "EAUTH" });
    const sendMail = vi.fn().mockRejectedValue(smtpError);
    const response = await createReportHandler(sendMail)(request({
      scope: "service",
      detail_type: "interface",
      message: "버튼이 동작하지 않습니다.",
    }));

    expect(response.status).toBe(502);
    expect(logError).toHaveBeenCalledWith("Report email delivery failed", { code: "EAUTH" });
  });
});
