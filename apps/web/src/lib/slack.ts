// 제보 승인용 슬랙 연동. 메시지 하나에 카테고리 셀렉트와 [승인] [반려] 버튼을 둔다.
import { createHmac, timingSafeEqual } from "node:crypto";

import { HIGHLIGHT_CATEGORY_LABELS, type HighlightCategoryCode } from "../db/codes";

export const DECISION_BLOCK_ID = "decision";
export const CATEGORY_ACTION_ID = "category";
export const APPROVE_ACTION_ID = "approve";
export const REJECT_ACTION_ID = "reject";
export const REMOVE_ACTION_ID = "remove";

const SIGNATURE_MAX_AGE_SECONDS = 5 * 60;

/** mrkdwn에서 뜻이 있는 문자를 글자로 바꾼다. */
export const escapeMrkdwn = (text: string): string =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/([*_~`])/g, "​$1​");

const plain = (text: string) => ({ type: "plain_text" as const, text, emoji: true });
const categoryOption = (code: HighlightCategoryCode) => ({ text: plain(HIGHLIGHT_CATEGORY_LABELS[code]), value: code });

export interface SubmissionMessage {
  submissionId: string;
  marketName: string;
  marketUrl: string;
  name: string;
  description: string | null;
  category: HighlightCategoryCode;
}

function summaryBlock({ marketName, marketUrl, name, description, category }: Omit<SubmissionMessage, "submissionId">) {
  const lines = [
    "*새 방문자 제보가 들어왔어요*",
    `시장: <${marketUrl.replace(/&/g, "&amp;")}|${escapeMrkdwn(marketName)}>`,
    `내용: ${escapeMrkdwn(name)}`,
    ...(description ? [`설명: ${escapeMrkdwn(description)}`] : []),
    `사용자 선택: ${HIGHLIGHT_CATEGORY_LABELS[category]}`,
  ];
  return { type: "section", text: { type: "mrkdwn", text: lines.join("\n") } };
}

export function submissionBlocks(message: SubmissionMessage) {
  return [
    summaryBlock(message),
    {
      type: "actions",
      block_id: DECISION_BLOCK_ID,
      elements: [
        {
          type: "static_select",
          action_id: CATEGORY_ACTION_ID,
          initial_option: categoryOption(message.category),
          options: (Object.keys(HIGHLIGHT_CATEGORY_LABELS) as HighlightCategoryCode[]).map(categoryOption),
        },
        { type: "button", action_id: APPROVE_ACTION_ID, style: "primary", text: plain("승인"), value: message.submissionId },
        { type: "button", action_id: REJECT_ACTION_ID, style: "danger", text: plain("반려"), value: message.submissionId },
      ],
    },
  ];
}

/** 결정한 뒤 버튼을 지우고 결과 한 줄을 남긴 메시지. */
export function decidedBlocks(summary: { type: string; text?: unknown } | undefined, result: string) {
  return [...(summary ? [summary] : []), { type: "context", elements: [{ type: "mrkdwn", text: result }] }];
}

/** 승인한 뒤 메시지. 결과 줄 아래에 공개 항목을 내리는 [삭제] 버튼을 남긴다. */
export function approvedBlocks(summary: { type: string; text?: unknown } | undefined, result: string, submissionId: string) {
  return [
    ...decidedBlocks(summary, result),
    {
      type: "actions",
      elements: [{
        type: "button",
        action_id: REMOVE_ACTION_ID,
        style: "danger",
        text: plain("삭제"),
        value: submissionId,
        confirm: { title: plain("제보 삭제"), text: plain("사이트에서 이 제보를 내릴까요? 되돌릴 수 없어요."), confirm: plain("삭제"), deny: plain("취소"), style: "danger" },
      }],
    },
  ];
}

export async function postSubmissionMessage(message: SubmissionMessage, fetcher: typeof fetch = fetch): Promise<void> {
  const response = await fetcher("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`, "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      channel: process.env.SLACK_CHANNEL_ID,
      text: `${message.marketName} 방문자 제보: ${message.name}`,
      blocks: submissionBlocks(message),
    }),
  });
  const result = await response.json() as { ok?: boolean; error?: string };
  if (!result.ok) throw new Error(`Slack chat.postMessage failed: ${result.error ?? response.status}`);
}

/** Slack Signing Secret 서명(v0)을 검사한다. 5분이 넘은 요청은 거부한다. */
export function verifySlackSignature(rawBody: string, timestamp: string | null, signature: string | null, now = Date.now()): boolean {
  const secret = process.env.SLACK_SIGNING_SECRET;
  if (!secret || !timestamp || !signature || !/^\d+$/.test(timestamp)) return false;
  if (Math.abs(now / 1000 - Number(timestamp)) > SIGNATURE_MAX_AGE_SECONDS) return false;
  const expected = Buffer.from(`v0=${createHmac("sha256", secret).update(`v0:${timestamp}:${rawBody}`).digest("hex")}`);
  const given = Buffer.from(signature);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export const slackApproverIds = (): string[] =>
  (process.env.SLACK_APPROVER_IDS ?? "").split(",").map((id) => id.trim()).filter(Boolean);
