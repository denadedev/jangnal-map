import { createHmac } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createSlackActionsHandler, type SlackActionsDeps } from "./slack-actions-handler";

const SECRET = "signing-secret";
const submissionId = "4f9e3c1e-1111-4222-8333-944444444444";

function slackRequest(payload: object, { secret = SECRET, timestamp = Math.floor(Date.now() / 1000) } = {}) {
  const body = new URLSearchParams({ payload: JSON.stringify(payload) }).toString();
  const signature = `v0=${createHmac("sha256", secret).update(`v0:${timestamp}:${body}`).digest("hex")}`;
  return new Request("https://kmarketday.com/api/slack/actions", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", "x-slack-request-timestamp": String(timestamp), "x-slack-signature": signature },
    body,
  });
}

const click = (actionId: string, { user = "U_OK", category = "food" } = {}) => ({
  type: "block_actions",
  user: { id: user },
  actions: [{ action_id: actionId, value: submissionId }],
  state: { values: { decision: { category: { selected_option: { value: category } } } } },
  message: { blocks: [{ type: "section", text: { type: "mrkdwn", text: "요약" } }] },
  response_url: "https://hooks.slack.com/actions/1",
});

function setup(overrides: Partial<SlackActionsDeps> = {}) {
  const tasks: (() => Promise<void>)[] = [];
  const deps = {
    decide: vi.fn<SlackActionsDeps["decide"]>(async (_id, decision) => decision.approve ? { status: "approved", category: decision.category } : { status: "rejected" }),
    remove: vi.fn<SlackActionsDeps["remove"]>(async () => ({ status: "removed" })),
    refresh: vi.fn<SlackActionsDeps["refresh"]>(async () => undefined),
    respond: vi.fn<SlackActionsDeps["respond"]>(async () => undefined),
  };
  const handler = createSlackActionsHandler({
    ...deps,
    defer: (task) => { tasks.push(task); },
    now: () => new Date("2026-10-21T05:31:00Z"),
    ...overrides,
  });
  const run = async (request: Request) => {
    const response = await handler(request);
    for (const task of tasks.splice(0)) await task();
    return response;
  };
  return { run, ...deps };
}

beforeEach(() => {
  vi.stubEnv("SLACK_SIGNING_SECRET", SECRET);
  vi.stubEnv("SLACK_APPROVER_IDS", "U_OK, U_TWO");
});
afterEach(() => vi.unstubAllEnvs());

describe("POST /api/slack/actions", () => {
  it("approves with the category selected at click time and refreshes the snapshot", async () => {
    const { run, decide, refresh, respond } = setup();
    const response = await run(slackRequest(click("approve", { category: "tip" })));

    expect(response.status).toBe(200);
    expect(decide).toHaveBeenCalledWith(submissionId, { approve: true, category: "tip" }, "U_OK");
    expect(refresh).toHaveBeenCalled();
    expect(respond).toHaveBeenCalledWith("https://hooks.slack.com/actions/1", expect.objectContaining({ replace_original: true }));
    expect(JSON.stringify(respond.mock.calls[0])).toContain("승인됨 (이용 팁) · <@U_OK> · 10월 21일 14:31");
    expect(JSON.stringify(respond.mock.calls[0])).toContain(`"action_id":"remove","style":"danger","text":{"type":"plain_text","text":"삭제","emoji":true},"value":"${submissionId}"`);
  });

  it("removes an approved highlight, refreshes the snapshot, and drops the button", async () => {
    const { run, decide, remove, refresh, respond } = setup();
    await run(slackRequest(click("remove")));
    expect(remove).toHaveBeenCalledWith(submissionId);
    expect(decide).not.toHaveBeenCalled();
    expect(refresh).toHaveBeenCalled();
    const body = JSON.stringify(respond.mock.calls[0]);
    expect(body).toContain("삭제됨 · <@U_OK> · 10월 21일 14:31");
    expect(body).not.toContain('"action_id":"remove"');
  });

  it.each([
    [{ status: "already-removed" }, "이미 삭제된"],
    [{ status: "not-approved", current: "rejected" }, "승인된 제보만"],
  ] as const)("tells the operator when the removal did not apply: %j", async (result, text) => {
    const { run, refresh, respond } = setup({ remove: async () => result });
    await run(slackRequest(click("remove")));
    expect(refresh).not.toHaveBeenCalled();
    expect(respond).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ replace_original: false, text: expect.stringContaining(text) }));
  });

  it("refuses removal from users outside SLACK_APPROVER_IDS", async () => {
    const { run, remove } = setup();
    await run(slackRequest(click("remove", { user: "U_STRANGER" })));
    expect(remove).not.toHaveBeenCalled();
  });

  it("rejects without touching the snapshot", async () => {
    const { run, decide, refresh, respond } = setup();
    await run(slackRequest(click("reject")));
    expect(decide).toHaveBeenCalledWith(submissionId, { approve: false }, "U_OK");
    expect(refresh).not.toHaveBeenCalled();
    expect(JSON.stringify(respond.mock.calls[0])).toContain("반려됨");
  });

  it("does nothing when only the select changes", async () => {
    const { run, decide, respond } = setup();
    expect((await run(slackRequest(click("category")))).status).toBe(200);
    expect(decide).not.toHaveBeenCalled();
    expect(respond).not.toHaveBeenCalled();
  });

  it("refuses users outside SLACK_APPROVER_IDS", async () => {
    const { run, decide, respond } = setup();
    await run(slackRequest(click("approve", { user: "U_STRANGER" })));
    expect(decide).not.toHaveBeenCalled();
    expect(respond).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ replace_original: false }));
  });

  it("rejects bad or stale signatures", async () => {
    const { run, decide } = setup();
    expect((await run(slackRequest(click("approve"), { secret: "wrong" }))).status).toBe(401);
    expect((await run(slackRequest(click("approve"), { timestamp: Math.floor(Date.now() / 1000) - 600 }))).status).toBe(401);
    expect(decide).not.toHaveBeenCalled();
  });

  it.each([
    [{ status: "duplicate" }, "이미 있어"],
    [{ status: "already-decided", current: "approved" }, "이미 처리된"],
  ] as const)("tells the operator when the decision did not apply: %j", async (result, text) => {
    const { run, refresh, respond } = setup({ decide: async () => result });
    await run(slackRequest(click("approve")));
    expect(refresh).not.toHaveBeenCalled();
    expect(respond).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ replace_original: false, text: expect.stringContaining(text) }));
  });
});
