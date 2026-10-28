import { flyerStorageConfigured } from "./flyer-storage";
import { slackApproverIds, verifySlackSignature } from "./slack";
import { callSlack, flyerUploadView } from "./slack-flyers";

export const FLYER_COMMAND = "/flyer";

export interface SlackCommandsDeps {
  openView: (triggerId: string, view: object) => Promise<void>;
  now: () => Date;
}

const ephemeral = (text: string) => Response.json({ response_type: "ephemeral", text });

/**
 * 슬랙 Slash Command 요청. 지금은 /flyer 하나다. 제보 채널에서 승인 권한이 있는 사람만 입력 창을 연다.
 * trigger_id는 3초 안에 써야 해서 views.open을 응답 전에 부른다.
 */
export function createSlackCommandsHandler(overrides: Partial<SlackCommandsDeps> = {}) {
  const deps: SlackCommandsDeps = {
    openView: async (triggerId, view) => { await callSlack("views.open", { trigger_id: triggerId, view }); },
    now: () => new Date(),
    ...overrides,
  };

  return async function POST(request: Request): Promise<Response> {
    const rawBody = await request.text();
    if (!verifySlackSignature(rawBody, request.headers.get("x-slack-request-timestamp"), request.headers.get("x-slack-signature"))) {
      return new Response("invalid signature", { status: 401 });
    }
    const form = new URLSearchParams(rawBody);
    if (form.get("command") !== FLYER_COMMAND) return ephemeral("모르는 명령이에요.");
    const channelId = form.get("channel_id") ?? "";
    if (!process.env.SLACK_CHANNEL_ID || channelId !== process.env.SLACK_CHANNEL_ID) return ephemeral("전단은 제보 채널에서만 올릴 수 있어요.");
    if (!slackApproverIds().includes(form.get("user_id") ?? "")) return ephemeral("전단을 올릴 권한이 없어요.");
    if (!flyerStorageConfigured()) return ephemeral("전단 이미지 저장소(FLYER_S3_*) 설정이 없어 올릴 수 없어요.");

    try {
      await deps.openView(form.get("trigger_id") ?? "", flyerUploadView(deps.now(), channelId));
    } catch (error) {
      console.error("Slack views.open failed", error);
      return ephemeral("입력 창을 열지 못했어요. 잠시 뒤에 다시 입력해 주세요.");
    }
    return new Response(null, { status: 200 });
  };
}
