// 마트 전단을 슬랙에서 올리고 내린다. /flyer → 입력 창 → 제출하면 이미지를 받아 게시하고 채널에 확인 메시지를 남긴다.
import { MART_BRAND_LABELS, type MartBrandCode } from "../db/codes";
import { escapeMrkdwn } from "./slack";
import { flyerViewerPath, flyerWeekOf, formatFlyerPeriod, koreaToday, MAX_FLYER_PAGES, type FlyerUploadInput } from "./flyers";
import { SITE_URL } from "./site-config";

export const FLYER_CALLBACK_ID = "flyer_upload";
export const FLYER_REMOVE_ACTION_ID = "flyer_remove";
export const BRAND_HIDE_ACTION_ID = "flyer_brand_hide";
export const BRAND_SHOW_ACTION_ID = "flyer_brand_show";
export const FLYER_ACTION_IDS = [FLYER_REMOVE_ACTION_ID, BRAND_HIDE_ACTION_ID, BRAND_SHOW_ACTION_ID];

const plain = (text: string) => ({ type: "plain_text" as const, text, emoji: true });
const brandCodes = Object.keys(MART_BRAND_LABELS) as MartBrandCode[];
const brandOption = (code: MartBrandCode) => ({ text: plain(MART_BRAND_LABELS[code]), value: code });

/** /flyer 입력 창. 기간 기본값은 오늘이 든 목~수. block_id와 action_id는 같은 이름을 쓴다. */
export function flyerUploadView(now: Date, channelId: string) {
  const week = flyerWeekOf(koreaToday(now));
  return {
    type: "modal",
    callback_id: FLYER_CALLBACK_ID,
    private_metadata: channelId,
    title: plain("마트 전단 올리기"),
    submit: plain("게시"),
    close: plain("취소"),
    blocks: [
      { type: "input", block_id: "brand", label: plain("브랜드"), element: { type: "static_select", action_id: "brand", placeholder: plain("브랜드 고르기"), options: brandCodes.map(brandOption) } },
      { type: "input", block_id: "starts_on", label: plain("시작일"), element: { type: "datepicker", action_id: "starts_on", initial_date: week.start } },
      { type: "input", block_id: "ends_on", label: plain("종료일"), element: { type: "datepicker", action_id: "ends_on", initial_date: week.end } },
      {
        type: "input", block_id: "base_store", optional: true, label: plain("기준 매장"), hint: plain("비우면 전국 공통 전단으로 올라가요"),
        element: { type: "plain_text_input", action_id: "base_store", max_length: 30, placeholder: plain("예: 금천점") },
      },
      {
        type: "input", block_id: "images", label: plain(`전단 이미지 (최대 ${MAX_FLYER_PAGES}장, 순서대로)`),
        element: { type: "file_input", action_id: "images", filetypes: ["jpg", "jpeg", "png", "webp"], max_files: MAX_FLYER_PAGES },
      },
    ],
  };
}

export interface SlackFile { id?: string; name?: string; url_private_download?: string; url_private?: string }

type StateValue = { selected_option?: { value?: string }; selected_date?: string; value?: string | null; files?: SlackFile[] };

/** view_submission의 state.values에서 입력값을 꺼낸다. */
export function readFlyerSubmission(values: Record<string, Record<string, StateValue>> | undefined) {
  const field = (id: string) => values?.[id]?.[id];
  return {
    brand: field("brand")?.selected_option?.value,
    startsOn: field("starts_on")?.selected_date,
    endsOn: field("ends_on")?.selected_date,
    baseStoreName: field("base_store")?.value ?? undefined,
    files: field("images")?.files ?? [],
  };
}

export function flyerSummaryBlock(input: FlyerUploadInput, pageCount: number, userId: string, replaced: number) {
  const lines = [
    `*${MART_BRAND_LABELS[input.brand]} 전단 ${pageCount}장을 게시했어요* · ${formatFlyerPeriod(input.startsOn, input.endsOn)}`,
    `기준 매장: ${input.baseStoreName ? escapeMrkdwn(input.baseStoreName) : "전국 공통"}`,
    `올린 사람: <@${userId}> · <${SITE_URL}${flyerViewerPath(input.brand)}|사이트에서 보기>`,
    ...(replaced > 0 ? [`기간이 겹치던 전단 ${replaced}개는 내렸어요.`] : []),
  ];
  return { type: "section", text: { type: "mrkdwn", text: lines.join("\n") } };
}

const hideButton = (brand: MartBrandCode) => ({
  type: "button",
  action_id: BRAND_HIDE_ACTION_ID,
  text: plain(`${MART_BRAND_LABELS[brand]} 숨기기`),
  value: brand,
  confirm: {
    title: plain("브랜드 숨기기"),
    text: plain(`${MART_BRAND_LABELS[brand]} 전단을 모두 내리고 공식 링크만 보여 줄까요? 다시 보이게 할 수 있어요.`),
    confirm: plain("숨기기"),
    deny: plain("취소"),
    style: "danger",
  },
});

const showButton = (brand: MartBrandCode) => ({ type: "button", action_id: BRAND_SHOW_ACTION_ID, text: plain(`${MART_BRAND_LABELS[brand]} 다시 보이기`), value: brand });

export function publishedFlyerBlocks(summary: object, flyerId: string, brand: MartBrandCode) {
  return [
    summary,
    {
      type: "actions",
      elements: [
        {
          type: "button",
          action_id: FLYER_REMOVE_ACTION_ID,
          style: "danger",
          text: plain("내리기"),
          value: flyerId,
          confirm: { title: plain("전단 내리기"), text: plain("사이트에서 이 전단을 내릴까요? 다시 올리려면 /flyer로 새로 올려야 해요."), confirm: plain("내리기"), deny: plain("취소"), style: "danger" },
        },
        hideButton(brand),
      ],
    },
  ];
}

const resultLine = (text: string) => ({ type: "context", elements: [{ type: "mrkdwn", text }] });

/** 내리기·숨기기·다시 보이기를 누른 뒤 메시지. 숨김이면 [다시 보이기], 다시 보이면 [숨기기]를 남긴다. */
export function flyerDecidedBlocks(summary: object | undefined, result: string, toggle?: { brand: MartBrandCode; hidden: boolean }) {
  return [
    ...(summary ? [summary] : []),
    resultLine(result),
    ...(toggle ? [{ type: "actions", elements: [toggle.hidden ? showButton(toggle.brand) : hideButton(toggle.brand)] }] : []),
  ];
}

/** 슬랙 Web API 호출. ok가 아니면 던진다. */
export async function callSlack<T extends object = object>(method: string, body: object, fetcher: typeof fetch = fetch): Promise<T & { ok: true }> {
  const response = await fetcher(`https://slack.com/api/${method}`, {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`, "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  });
  const result = await response.json() as T & { ok?: boolean; error?: string };
  if (!result.ok) throw new Error(`Slack ${method} failed: ${result.error ?? response.status}`);
  return result as T & { ok: true };
}

/** 입력 창에 첨부한 파일을 봇 토큰으로 받는다. files:read 권한이 없으면 슬랙이 로그인 HTML을 줘서 따로 거른다. */
export async function downloadSlackFile(file: SlackFile, maxBytes: number, fetcher: typeof fetch = fetch): Promise<Buffer> {
  const url = file.url_private_download ?? file.url_private;
  if (!url || !url.startsWith("https://files.slack.com/")) throw new Error("Slack file has no download URL");
  const response = await fetcher(url, { headers: { authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}` } });
  if (!response.ok) throw new Error(`Slack file download failed: ${response.status}`);
  if ((response.headers.get("content-type") ?? "").startsWith("text/html")) throw new Error("Slack file download returned HTML (files:read scope missing?)");
  const data = Buffer.from(await response.arrayBuffer());
  if (data.length > maxBytes) throw new Error(`Slack file is too large: ${data.length}`);
  return data;
}
