import { createHmac } from "node:crypto";

import { afterEach, describe, expect, it, vi } from "vitest";

import { escapeMrkdwn, submissionBlocks, verifySlackSignature } from "./slack";

afterEach(() => vi.unstubAllEnvs());

const sign = (body: string, timestamp: string, secret = "shh") =>
  `v0=${createHmac("sha256", secret).update(`v0:${timestamp}:${body}`).digest("hex")}`;

describe("verifySlackSignature", () => {
  const now = 1_800_000_000_000;
  const timestamp = String(now / 1000);

  it("accepts a fresh signature made with the signing secret", () => {
    vi.stubEnv("SLACK_SIGNING_SECRET", "shh");
    expect(verifySlackSignature("payload=x", timestamp, sign("payload=x", timestamp), now)).toBe(true);
  });

  it("rejects a wrong secret, a changed body, and an old timestamp", () => {
    vi.stubEnv("SLACK_SIGNING_SECRET", "shh");
    expect(verifySlackSignature("payload=x", timestamp, sign("payload=x", timestamp, "other"), now)).toBe(false);
    expect(verifySlackSignature("payload=y", timestamp, sign("payload=x", timestamp), now)).toBe(false);
    const old = String(now / 1000 - 301);
    expect(verifySlackSignature("payload=x", old, sign("payload=x", old), now)).toBe(false);
  });

  it("rejects everything when no secret is configured", () => {
    vi.stubEnv("SLACK_SIGNING_SECRET", "");
    expect(verifySlackSignature("payload=x", timestamp, sign("payload=x", timestamp, ""), now)).toBe(false);
  });
});

describe("submission message", () => {
  it("escapes mrkdwn and preselects the submitter's category", () => {
    const [summary, actions] = submissionBlocks({
      submissionId: "id-1", marketName: "<!channel>", marketUrl: "https://kmarketday.com/?when=all&market=m",
      name: "*굵게*", description: null, category: "food",
    }) as unknown as [{ text: { text: string } }, { elements: { initial_option?: { value: string }; value?: string }[] }];
    expect(summary.text.text).toContain("&lt;!channel&gt;");
    expect(summary.text.text).toContain("when=all&amp;market=m");
    expect(summary.text.text).not.toContain("*굵게*");
    expect(actions.elements[0].initial_option?.value).toBe("food");
    expect(actions.elements.slice(1).map((element) => element.value)).toEqual(["id-1", "id-1"]);
  });

  it("keeps plain text readable", () => {
    expect(escapeMrkdwn("미나리 & 쑥")).toBe("미나리 &amp; 쑥");
  });
});
