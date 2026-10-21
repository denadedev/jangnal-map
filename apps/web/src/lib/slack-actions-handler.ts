import { after } from "next/server";

import { HIGHLIGHT_CATEGORY_LABELS } from "../db/codes";
import type { DecisionResult, decideSubmission } from "../db/highlights";
import { refreshCatalog } from "./catalog/load";
import { isHighlightCategory } from "./highlight-submission";
import {
  APPROVE_ACTION_ID,
  CATEGORY_ACTION_ID,
  DECISION_BLOCK_ID,
  decidedBlocks,
  REJECT_ACTION_ID,
  slackApproverIds,
  verifySlackSignature,
} from "./slack";

interface BlockActionsPayload {
  type?: string;
  user?: { id?: string };
  actions?: { action_id?: string; value?: string }[];
  state?: { values?: Record<string, Record<string, { selected_option?: { value?: string } }>> };
  message?: { blocks?: { type: string }[] };
  response_url?: string;
}

type Decide = (submissionId: string, decision: Parameters<typeof decideSubmission>[2], decidedBy: string) => Promise<DecisionResult>;

export interface SlackActionsDeps {
  decide: Decide;
  refresh: () => Promise<unknown>;
  respond: (url: string, body: object) => Promise<void>;
  defer: (task: () => Promise<void>) => void;
  now: () => Date;
}

async function dbDecide(...args: Parameters<Decide>): Promise<DecisionResult> {
  const [{ sharedDb }, { decideSubmission }] = await Promise.all([import("../db/client"), import("../db/highlights")]);
  return decideSubmission(sharedDb(), ...args);
}

async function postToResponseUrl(url: string, body: object): Promise<void> {
  const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  if (!response.ok) throw new Error(`Slack response_url failed: ${response.status}`);
}

const formatTime = (date: Date) => new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false,
}).format(date);

const ephemeral = (text: string) => ({ response_type: "ephemeral", replace_original: false, text });

/**
 * 슬랙 Interactivity 요청. 슬랙은 3초 안에 응답을 바라므로 서명과 권한만 보고 바로 200을 주고,
 * DB 쓰기와 메시지 수정은 응답 뒤에 response_url로 한다.
 */
export function createSlackActionsHandler(overrides: Partial<SlackActionsDeps> = {}) {
  const deps: SlackActionsDeps = {
    decide: dbDecide,
    refresh: refreshCatalog,
    respond: postToResponseUrl,
    defer: (task) => after(task),
    now: () => new Date(),
    ...overrides,
  };

  return async function POST(request: Request): Promise<Response> {
    const rawBody = await request.text();
    if (!verifySlackSignature(rawBody, request.headers.get("x-slack-request-timestamp"), request.headers.get("x-slack-signature"))) {
      return new Response("invalid signature", { status: 401 });
    }

    let payload: BlockActionsPayload;
    try {
      payload = JSON.parse(new URLSearchParams(rawBody).get("payload") ?? "") as BlockActionsPayload;
    } catch {
      return new Response("invalid payload", { status: 400 });
    }
    const action = payload.actions?.[0];
    const responseUrl = payload.response_url;
    const userId = payload.user?.id ?? "";
    // 셀렉트를 바꿀 때도 요청이 오지만 저장하지 않는다. 승인할 때 state.values에서 읽는다.
    if (payload.type !== "block_actions" || !action || !responseUrl || action.action_id === CATEGORY_ACTION_ID) return new Response(null, { status: 200 });
    if (action.action_id !== APPROVE_ACTION_ID && action.action_id !== REJECT_ACTION_ID) return new Response(null, { status: 200 });

    const run = (body: object) => deps.defer(() => deps.respond(responseUrl, body).catch((error) => console.error("Slack response failed", error)));
    if (!slackApproverIds().includes(userId)) {
      run(ephemeral("이 제보를 처리할 권한이 없어요."));
      return new Response(null, { status: 200 });
    }

    const approve = action.action_id === APPROVE_ACTION_ID;
    const category = payload.state?.values?.[DECISION_BLOCK_ID]?.[CATEGORY_ACTION_ID]?.selected_option?.value;
    if (approve && !isHighlightCategory(category)) {
      run(ephemeral("카테고리를 골라 주세요."));
      return new Response(null, { status: 200 });
    }
    const submissionId = action.value ?? "";
    const summary = payload.message?.blocks?.[0];

    deps.defer(async () => {
      try {
        const result = await deps.decide(submissionId, approve && isHighlightCategory(category) ? { approve: true, category } : { approve: false }, userId);
        const by = `<@${userId}> · ${formatTime(deps.now())}`;
        if (result.status === "approved") {
          await deps.refresh().catch((error) => console.error("Catalog refresh after approval failed", error));
          await deps.respond(responseUrl, { replace_original: true, text: "승인됨", blocks: decidedBlocks(summary, `✅ 승인됨 (${HIGHLIGHT_CATEGORY_LABELS[result.category]}) · ${by}`) });
        } else if (result.status === "rejected") {
          await deps.respond(responseUrl, { replace_original: true, text: "반려됨", blocks: decidedBlocks(summary, `🚫 반려됨 · ${by}`) });
        } else if (result.status === "duplicate") {
          await deps.respond(responseUrl, ephemeral("이 시장에 같은 이름의 항목이 이미 있어 승인하지 못했어요. 반려해 주세요."));
        } else if (result.status === "already-decided") {
          await deps.respond(responseUrl, ephemeral(`이미 처리된 제보예요 (${result.current}).`));
        } else {
          await deps.respond(responseUrl, ephemeral("제보를 찾지 못했어요."));
        }
      } catch (error) {
        console.error("Slack decision failed", error);
        await deps.respond(responseUrl, ephemeral("처리하지 못했어요. 잠시 뒤에 다시 눌러 주세요.")).catch(() => undefined);
      }
    });
    return new Response(null, { status: 200 });
  };
}
