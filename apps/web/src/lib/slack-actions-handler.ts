import { after } from "next/server";

import { HIGHLIGHT_CATEGORY_LABELS } from "../db/codes";
import { MART_BRAND_LABELS } from "../db/codes";
import type { FlyerRemovalResult } from "../db/flyers";
import type { DecisionResult, decideSubmission, RemovalResult } from "../db/highlights";
import { refreshCatalog } from "./catalog/load";
import { isMartBrand, validateFlyerUpload, type FlyerUploadInput } from "./flyers";
import { isHighlightCategory } from "./highlight-submission";
import {
  APPROVE_ACTION_ID,
  approvedBlocks,
  CATEGORY_ACTION_ID,
  DECISION_BLOCK_ID,
  decidedBlocks,
  REJECT_ACTION_ID,
  REMOVE_ACTION_ID,
  slackApproverIds,
  verifySlackSignature,
} from "./slack";
import {
  BRAND_HIDE_ACTION_ID,
  FLYER_ACTION_IDS,
  FLYER_CALLBACK_ID,
  FLYER_REMOVE_ACTION_ID,
  flyerDecidedBlocks,
  readFlyerSubmission,
  type SlackFile,
} from "./slack-flyers";

interface BlockActionsPayload {
  type?: string;
  user?: { id?: string };
  actions?: { action_id?: string; value?: string }[];
  state?: { values?: Record<string, Record<string, { selected_option?: { value?: string } }>> };
  message?: { blocks?: { type: string }[] };
  response_url?: string;
  view?: { callback_id?: string; private_metadata?: string; state?: { values?: Parameters<typeof readFlyerSubmission>[0] } };
}

type Decide = (submissionId: string, decision: Parameters<typeof decideSubmission>[2], decidedBy: string) => Promise<DecisionResult>;

export interface SlackActionsDeps {
  decide: Decide;
  remove: (submissionId: string) => Promise<RemovalResult>;
  refresh: () => Promise<unknown>;
  respond: (url: string, body: object) => Promise<void>;
  defer: (task: () => Promise<void>) => void;
  now: () => Date;
  /** 입력 창 제출 뒤: 파일을 받아 게시하고 채널에 확인 메시지를 남긴다. 실패도 채널에 알린다. */
  uploadFlyer: (input: FlyerUploadInput, files: SlackFile[], userId: string, channelId: string) => Promise<void>;
  removeFlyer: (flyerId: string) => Promise<FlyerRemovalResult>;
  setBrandHidden: (brand: keyof typeof MART_BRAND_LABELS, hidden: boolean) => Promise<boolean>;
}

async function dbDecide(...args: Parameters<Decide>): Promise<DecisionResult> {
  const [{ sharedDb }, { decideSubmission }] = await Promise.all([import("../db/client"), import("../db/highlights")]);
  return decideSubmission(sharedDb(), ...args);
}

async function dbRemove(submissionId: string): Promise<RemovalResult> {
  const [{ sharedDb }, { removeApprovedHighlight }] = await Promise.all([import("../db/client"), import("../db/highlights")]);
  return removeApprovedHighlight(sharedDb(), submissionId);
}

async function dbRemoveFlyer(flyerId: string): Promise<FlyerRemovalResult> {
  const [{ sharedDb }, { removeFlyer }] = await Promise.all([import("../db/client"), import("../db/flyers")]);
  return removeFlyer(sharedDb(), flyerId);
}

async function dbSetBrandHidden(...args: Parameters<SlackActionsDeps["setBrandHidden"]>): Promise<boolean> {
  const [{ sharedDb }, { setBrandHidden }] = await Promise.all([import("../db/client"), import("../db/flyers")]);
  return setBrandHidden(sharedDb(), ...args);
}

async function uploadFlyerFromSlack(...args: Parameters<SlackActionsDeps["uploadFlyer"]>): Promise<void> {
  const { uploadFlyer } = await import("./flyer-upload");
  return uploadFlyer(...args);
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
    remove: dbRemove,
    refresh: refreshCatalog,
    respond: postToResponseUrl,
    defer: (task) => after(task),
    now: () => new Date(),
    uploadFlyer: uploadFlyerFromSlack,
    removeFlyer: dbRemoveFlyer,
    setBrandHidden: dbSetBrandHidden,
    ...overrides,
  };

  // 입력 창 제출. 값 검사는 3초 안에 끝나므로 바로 오류를 돌려주고, 파일 받기와 저장은 응답 뒤에 한다.
  function handleViewSubmission(payload: BlockActionsPayload, userId: string): Response {
    if (payload.view?.callback_id !== FLYER_CALLBACK_ID) return new Response(null, { status: 200 });
    if (!slackApproverIds().includes(userId)) return Response.json({ response_action: "errors", errors: { brand: "전단을 올릴 권한이 없어요." } });
    const values = readFlyerSubmission(payload.view.state?.values);
    const result = validateFlyerUpload({ ...values, imageCount: values.files.length });
    if (!result.ok) return Response.json({ response_action: "errors", errors: result.errors });
    const channelId = payload.view.private_metadata || process.env.SLACK_CHANNEL_ID || "";
    deps.defer(() => deps.uploadFlyer(result.input, values.files, userId, channelId).catch((error) => console.error("Flyer upload failed", error)));
    return new Response(null, { status: 200 });
  }

  async function handleFlyerAction(actionId: string, value: string, summary: object | undefined, by: () => string, responseUrl: string): Promise<void> {
    try {
      if (actionId === FLYER_REMOVE_ACTION_ID) {
        const result = await deps.removeFlyer(value);
        if (result.status === "removed") await deps.respond(responseUrl, { replace_original: true, text: "전단 내림", blocks: flyerDecidedBlocks(summary, `🗑️ 내림 · ${by()}`) });
        else await deps.respond(responseUrl, ephemeral(result.status === "already-removed" ? "이미 내린 전단이에요." : "전단을 찾지 못했어요."));
        return;
      }
      if (!isMartBrand(value)) {
        await deps.respond(responseUrl, ephemeral("브랜드를 찾지 못했어요."));
        return;
      }
      const hidden = actionId === BRAND_HIDE_ACTION_ID;
      if (!await deps.setBrandHidden(value, hidden)) {
        await deps.respond(responseUrl, ephemeral("브랜드를 찾지 못했어요."));
        return;
      }
      const label = MART_BRAND_LABELS[value];
      await deps.respond(responseUrl, {
        replace_original: true,
        text: hidden ? `${label} 숨김` : `${label} 다시 보임`,
        blocks: flyerDecidedBlocks(summary, hidden ? `🙈 ${label} 전단 숨김 (공식 링크만 보여요) · ${by()}` : `👀 ${label} 전단 다시 보임 · ${by()}`, { brand: value, hidden }),
      });
    } catch (error) {
      console.error("Slack flyer action failed", error);
      await deps.respond(responseUrl, ephemeral("처리하지 못했어요. 잠시 뒤에 다시 눌러 주세요.")).catch(() => undefined);
    }
  }

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
    const userId = payload.user?.id ?? "";
    if (payload.type === "view_submission") return handleViewSubmission(payload, userId);

    const action = payload.actions?.[0];
    const responseUrl = payload.response_url;
    // 셀렉트를 바꿀 때도 요청이 오지만 저장하지 않는다. 승인할 때 state.values에서 읽는다.
    if (payload.type !== "block_actions" || !action || !responseUrl || action.action_id === CATEGORY_ACTION_ID) return new Response(null, { status: 200 });
    if (![APPROVE_ACTION_ID, REJECT_ACTION_ID, REMOVE_ACTION_ID, ...FLYER_ACTION_IDS].includes(action.action_id ?? "")) return new Response(null, { status: 200 });

    const run = (body: object) => deps.defer(() => deps.respond(responseUrl, body).catch((error) => console.error("Slack response failed", error)));
    if (!slackApproverIds().includes(userId)) {
      run(ephemeral(FLYER_ACTION_IDS.includes(action.action_id ?? "") ? "전단을 처리할 권한이 없어요." : "이 제보를 처리할 권한이 없어요."));
      return new Response(null, { status: 200 });
    }

    const submissionId = action.value ?? "";
    const summary = payload.message?.blocks?.[0];
    const by = () => `<@${userId}> · ${formatTime(deps.now())}`;

    if (FLYER_ACTION_IDS.includes(action.action_id ?? "")) {
      deps.defer(() => handleFlyerAction(action.action_id ?? "", action.value ?? "", summary, by, responseUrl));
      return new Response(null, { status: 200 });
    }

    if (action.action_id === REMOVE_ACTION_ID) {
      deps.defer(async () => {
        try {
          const result = await deps.remove(submissionId);
          if (result.status === "removed") {
            await deps.refresh().catch((error) => console.error("Catalog refresh after removal failed", error));
            await deps.respond(responseUrl, { replace_original: true, text: "삭제됨", blocks: decidedBlocks(summary, `🗑️ 삭제됨 · ${by()}`) });
          } else if (result.status === "already-removed") {
            await deps.respond(responseUrl, ephemeral("이미 삭제된 제보예요."));
          } else if (result.status === "not-approved") {
            await deps.respond(responseUrl, ephemeral(`승인된 제보만 삭제할 수 있어요 (${result.current}).`));
          } else {
            await deps.respond(responseUrl, ephemeral("제보를 찾지 못했어요."));
          }
        } catch (error) {
          console.error("Slack removal failed", error);
          await deps.respond(responseUrl, ephemeral("삭제하지 못했어요. 잠시 뒤에 다시 눌러 주세요.")).catch(() => undefined);
        }
      });
      return new Response(null, { status: 200 });
    }

    const approve = action.action_id === APPROVE_ACTION_ID;
    const category = payload.state?.values?.[DECISION_BLOCK_ID]?.[CATEGORY_ACTION_ID]?.selected_option?.value;
    if (approve && !isHighlightCategory(category)) {
      run(ephemeral("카테고리를 골라 주세요."));
      return new Response(null, { status: 200 });
    }
    deps.defer(async () => {
      try {
        const result = await deps.decide(submissionId, approve && isHighlightCategory(category) ? { approve: true, category } : { approve: false }, userId);
        if (result.status === "approved") {
          await deps.refresh().catch((error) => console.error("Catalog refresh after approval failed", error));
          await deps.respond(responseUrl, { replace_original: true, text: "승인됨", blocks: approvedBlocks(summary, `✅ 승인됨 (${HIGHLIGHT_CATEGORY_LABELS[result.category]}) · ${by()}`, submissionId) });
        } else if (result.status === "rejected") {
          await deps.respond(responseUrl, { replace_original: true, text: "반려됨", blocks: decidedBlocks(summary, `🚫 반려됨 · ${by()}`) });
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
