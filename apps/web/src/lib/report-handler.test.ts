import { afterEach, describe, expect, it, vi } from "vitest";
import { createReportHandler } from "./report-handler";

afterEach(() => vi.unstubAllEnvs());

describe("report origin behind a reverse proxy", () => {
  it.each(["https://spamfam.kr", "https://kmarketday.com"])(
    "accepts a configured public origin despite an internal request URL: %s",
    async (origin) => {
      vi.stubEnv("REPORT_ALLOWED_ORIGINS", "https://spamfam.kr, https://kmarketday.com");
      const response = await createReportHandler()(new Request("http://localhost:3000/api/report", {
        method: "POST", headers: { origin },
        body: JSON.stringify({ _gotcha: "test-without-sending-mail" }),
      }));
      expect(response.status).toBe(200);
    },
  );

  it("keeps the legacy singular configuration as a fallback", async () => {
    vi.stubEnv("REPORT_ALLOWED_ORIGINS", "");
    vi.stubEnv("REPORT_ALLOWED_ORIGIN", "https://spamfam.kr");
    const response = await createReportHandler()(new Request("http://localhost:3000/api/report", {
      method: "POST", headers: { origin: "https://spamfam.kr" },
      body: JSON.stringify({ _gotcha: "test-without-sending-mail" }),
    }));
    expect(response.status).toBe(200);
  });

  it.each(["https://attacker.invalid", "http://localhost:3000", "null", ""])(
    "rejects %s even when forwarding headers claim the trusted domain", async (origin) => {
      vi.stubEnv("REPORT_ALLOWED_ORIGINS", "https://spamfam.kr,https://kmarketday.com");
      const response = await createReportHandler()(new Request("http://localhost:3000/api/report", {
        method: "POST", headers: { origin, "x-forwarded-host": "spamfam.kr", "x-forwarded-proto": "https" },
        body: JSON.stringify({ _gotcha: "test" }),
      }));
      expect(response.status).toBe(403);
    },
  );

  it("keeps direct same-origin behavior when no override is configured", async () => {
    vi.stubEnv("REPORT_ALLOWED_ORIGIN", "");
    const response = await createReportHandler()(new Request("https://preview.example/api/report", {
      method: "POST", headers: { origin: "https://preview.example" }, body: JSON.stringify({ _gotcha: "test" }),
    }));
    expect(response.status).toBe(200);
  });

  it.each([
    "",
    "https://kmarketday.com/report",
    "ftp://kmarketday.com",
    "https://user:pass@kmarketday.com",
  ])("returns 500 and does not send mail for invalid configured origins: %s", async (configuredOrigins) => {
    vi.stubEnv("REPORT_ALLOWED_ORIGINS", configuredOrigins);
    const sendMail = vi.fn();
    const logError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const response = await createReportHandler(sendMail)(new Request("https://kmarketday.com/api/report", {
      method: "POST",
      headers: { origin: "https://kmarketday.com" },
      body: JSON.stringify({
        scope: "service",
        detail_type: "interface",
        message: "버튼이 동작하지 않습니다.",
      }),
    }));

    expect(response.status).toBe(500);
    expect(sendMail).not.toHaveBeenCalled();
    expect(logError).toHaveBeenCalledWith("Invalid report origin configuration");
    logError.mockRestore();
  });
});
