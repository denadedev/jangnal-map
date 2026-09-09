import { afterEach, describe, expect, it, vi } from "vitest";
import { createReportHandler } from "./report-handler";

afterEach(() => vi.unstubAllEnvs());

describe("report origin behind a reverse proxy", () => {
  it("accepts the configured public origin despite an internal request URL", async () => {
    vi.stubEnv("REPORT_ALLOWED_ORIGIN", "https://jangnal.spamfam.kr");
    const response = await createReportHandler()(new Request("http://localhost:3000/api/report", {
      method: "POST", headers: { origin: "https://jangnal.spamfam.kr" },
      body: JSON.stringify({ _gotcha: "test-without-sending-mail" }),
    }));
    expect(response.status).toBe(200);
  });

  it.each(["https://attacker.invalid", "http://localhost:3000", "null", ""])(
    "rejects %s even when forwarding headers claim the trusted domain", async (origin) => {
      vi.stubEnv("REPORT_ALLOWED_ORIGIN", "https://jangnal.spamfam.kr");
      const response = await createReportHandler()(new Request("http://localhost:3000/api/report", {
        method: "POST", headers: { origin, "x-forwarded-host": "jangnal.spamfam.kr", "x-forwarded-proto": "https" },
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
});
