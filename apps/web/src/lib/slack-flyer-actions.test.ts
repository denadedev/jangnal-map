import { createHmac } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createSlackActionsHandler, type SlackActionsDeps } from "./slack-actions-handler";

const SECRET = "signing-secret";
const flyerId = "4f9e3c1e-1111-4222-8333-944444444444";

function slackRequest(payload: object) {
  const timestamp = Math.floor(Date.now() / 1000);
  const body = new URLSearchParams({ payload: JSON.stringify(payload) }).toString();
  const signature = `v0=${createHmac("sha256", SECRET).update(`v0:${timestamp}:${body}`).digest("hex")}`;
  return new Request("https://kmarketday.com/api/slack/actions", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", "x-slack-request-timestamp": String(timestamp), "x-slack-signature": signature },
    body,
  });
}

const files = [{ id: "F1", url_private_download: "https://files.slack.com/files-pri/T-F1/download/a.jpg" }];
const submission = ({ user = "U_OK", brand = "emart", startsOn = "2026-10-29", endsOn = "2026-11-04", store = null as string | null, images = files } = {}) => ({
  type: "view_submission",
  user: { id: user },
  view: {
    callback_id: "flyer_upload",
    private_metadata: "C_FLYER",
    state: { values: {
      brand: { brand: { selected_option: { value: brand } } },
      starts_on: { starts_on: { selected_date: startsOn } },
      ends_on: { ends_on: { selected_date: endsOn } },
      base_store: { base_store: { value: store } },
      images: { images: { files: images } },
    } },
  },
});

const click = (actionId: string, value: string, user = "U_OK") => ({
  type: "block_actions",
  user: { id: user },
  actions: [{ action_id: actionId, value }],
  message: { blocks: [{ type: "section", text: { type: "mrkdwn", text: "이마트 전단 4장을 게시했어요" } }] },
  response_url: "https://hooks.slack.com/actions/1",
});

function setup(overrides: Partial<SlackActionsDeps> = {}) {
  const tasks: (() => Promise<void>)[] = [];
  const deps = {
    uploadFlyer: vi.fn<SlackActionsDeps["uploadFlyer"]>(async () => undefined),
    removeFlyer: vi.fn<SlackActionsDeps["removeFlyer"]>(async () => ({ status: "removed" })),
    setBrandHidden: vi.fn<SlackActionsDeps["setBrandHidden"]>(async () => true),
    respond: vi.fn<SlackActionsDeps["respond"]>(async () => undefined),
  };
  const handler = createSlackActionsHandler({ ...deps, defer: (task) => { tasks.push(task); }, now: () => new Date("2026-10-29T05:31:00Z"), ...overrides });
  const run = async (request: Request) => {
    const response = await handler(request);
    for (const task of tasks.splice(0)) await task();
    return response;
  };
  return { run, ...deps };
}

beforeEach(() => {
  vi.stubEnv("SLACK_SIGNING_SECRET", SECRET);
  vi.stubEnv("SLACK_APPROVER_IDS", "U_OK");
});
afterEach(() => vi.unstubAllEnvs());

describe("flyer upload modal submission", () => {
  it("closes the modal and uploads in the background", async () => {
    const { run, uploadFlyer } = setup();
    const response = await run(slackRequest(submission({ store: "  금천점 " })));
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("");
    expect(uploadFlyer).toHaveBeenCalledWith({ brand: "emart", startsOn: "2026-10-29", endsOn: "2026-11-04", baseStoreName: "금천점" }, files, "U_OK", "C_FLYER");
  });

  it("keeps the modal open with field errors", async () => {
    const { run, uploadFlyer } = setup();
    const response = await run(slackRequest(submission({ endsOn: "2026-10-28", images: [] })));
    expect(await response.json()).toEqual({
      response_action: "errors",
      errors: { ends_on: "종료일은 시작일과 같거나 뒤여야 해요.", images: "전단 이미지를 1장 이상 올려 주세요." },
    });
    expect(uploadFlyer).not.toHaveBeenCalled();
  });

  it("refuses people who are not approvers", async () => {
    const { run, uploadFlyer } = setup();
    const response = await run(slackRequest(submission({ user: "U_NO" })));
    expect(await response.json()).toMatchObject({ response_action: "errors" });
    expect(uploadFlyer).not.toHaveBeenCalled();
  });
});

describe("flyer buttons", () => {
  it("removes a flyer and drops the buttons", async () => {
    const { run, removeFlyer, respond } = setup();
    await run(slackRequest(click("flyer_remove", flyerId)));
    expect(removeFlyer).toHaveBeenCalledWith(flyerId);
    const body = JSON.stringify(respond.mock.calls[0]);
    expect(body).toContain("내림 · <@U_OK> · 10월 29일 14:31");
    expect(body).not.toContain('"type":"actions"');
  });

  it("hides a brand and offers to show it again, then the reverse", async () => {
    const { run, setBrandHidden, respond } = setup();
    await run(slackRequest(click("flyer_brand_hide", "homeplus")));
    expect(setBrandHidden).toHaveBeenCalledWith("homeplus", true);
    expect(JSON.stringify(respond.mock.calls[0])).toContain('"action_id":"flyer_brand_show"');

    await run(slackRequest(click("flyer_brand_show", "homeplus")));
    expect(setBrandHidden).toHaveBeenLastCalledWith("homeplus", false);
    expect(JSON.stringify(respond.mock.calls[1])).toContain('"action_id":"flyer_brand_hide"');
  });

  it("ignores unknown brands and non-approvers", async () => {
    const { run, setBrandHidden, respond } = setup();
    await run(slackRequest(click("flyer_brand_hide", "costco")));
    await run(slackRequest(click("flyer_brand_hide", "emart", "U_NO")));
    expect(setBrandHidden).not.toHaveBeenCalled();
    expect(respond.mock.calls.map(([, body]) => (body as { text: string }).text)).toEqual(["브랜드를 찾지 못했어요.", "전단을 처리할 권한이 없어요."]);
  });
});
