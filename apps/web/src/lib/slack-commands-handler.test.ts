import { createHmac } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createSlackCommandsHandler } from "./slack-commands-handler";

const SECRET = "signing-secret";

function commandRequest(fields: Record<string, string>, secret = SECRET) {
  const timestamp = Math.floor(Date.now() / 1000);
  const body = new URLSearchParams({ command: "/flyer", channel_id: "C_FLYER", user_id: "U_OK", trigger_id: "T1", ...fields }).toString();
  const signature = `v0=${createHmac("sha256", secret).update(`v0:${timestamp}:${body}`).digest("hex")}`;
  return new Request("https://kmarketday.com/api/slack/commands", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", "x-slack-request-timestamp": String(timestamp), "x-slack-signature": signature },
    body,
  });
}

beforeEach(() => {
  vi.stubEnv("SLACK_SIGNING_SECRET", SECRET);
  vi.stubEnv("SLACK_APPROVER_IDS", "U_OK");
  vi.stubEnv("SLACK_CHANNEL_ID", "C_FLYER");
  for (const key of ["S3_ENDPOINT", "S3_BUCKET", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY"]) vi.stubEnv(key, "set");
});
afterEach(() => vi.unstubAllEnvs());

describe("POST /api/slack/commands", () => {
  it("opens the flyer modal with this Thursday-to-Wednesday week", async () => {
    const openView = vi.fn(async () => undefined);
    const handler = createSlackCommandsHandler({ openView, now: () => new Date("2026-10-30T01:00:00Z") });
    const response = await handler(commandRequest({}));
    expect(response.status).toBe(200);
    expect(openView).toHaveBeenCalledOnce();
    const [triggerId, view] = openView.mock.calls[0] as unknown as [string, { callback_id: string; private_metadata: string }];
    expect(triggerId).toBe("T1");
    expect(view).toMatchObject({ callback_id: "flyer_upload", private_metadata: "C_FLYER" });
    expect(JSON.stringify(view)).toContain('"initial_date":"2026-10-29"');
    expect(JSON.stringify(view)).toContain('"initial_date":"2026-11-04"');
  });

  it.each([
    [{ channel_id: "C_OTHER" }, "전단은 제보 채널에서만 올릴 수 있어요."],
    [{ user_id: "U_NO" }, "전단을 올릴 권한이 없어요."],
    [{ command: "/other" }, "모르는 명령이에요."],
  ])("refuses %o", async (fields, text) => {
    const openView = vi.fn(async () => undefined);
    const response = await createSlackCommandsHandler({ openView })(commandRequest(fields));
    expect(await response.json()).toEqual({ response_type: "ephemeral", text });
    expect(openView).not.toHaveBeenCalled();
  });

  it("refuses before opening the modal when the image storage is not configured", async () => {
    vi.stubEnv("S3_BUCKET", "");
    const openView = vi.fn(async () => undefined);
    const response = await createSlackCommandsHandler({ openView })(commandRequest({}));
    expect(await response.json()).toEqual({ response_type: "ephemeral", text: "전단 이미지 저장소(S3_*) 설정이 없어 올릴 수 없어요." });
    expect(openView).not.toHaveBeenCalled();
  });

  it("rejects a bad signature", async () => {
    const response = await createSlackCommandsHandler()(commandRequest({}, "wrong"));
    expect(response.status).toBe(401);
  });
});
