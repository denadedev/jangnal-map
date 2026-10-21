import { loadCatalog } from "./catalog/load";
import { highlightNameKey, parseHighlightSubmission } from "./highlight-submission";
import { getMarketPagePath, SITE_URL } from "./market-seo";
import { clientIp, createRateLimiter } from "./rate-limit";
import { allowedReportOrigins } from "./report-handler";
import { postSubmissionMessage } from "./slack";

const json = (status: number, message: string, reason?: string) =>
  Response.json(reason ? { message, reason } : { message }, { status });

const DONE = "보내 주셔서 고마워요. 검토 후 반영돼요.";

export interface SubmissionDeps {
  catalog: typeof loadCatalog;
  notify: typeof postSubmissionMessage;
  allow: (key: string) => boolean;
  /** DB 작업. 테스트에서 바꿔 끼운다. */
  store: () => Promise<{
    findMarketRowId: (clientId: string) => Promise<string | undefined>;
    hasDuplicate: (marketId: string, nameKey: string) => Promise<boolean>;
    insert: (marketId: string, input: NonNullable<ReturnType<typeof parseHighlightSubmission>>) => Promise<string>;
  }>;
}

async function dbStore() {
  const [{ sharedDb }, highlights] = await Promise.all([import("../db/client"), import("../db/highlights")]);
  const db = sharedDb();
  return {
    findMarketRowId: (clientId: string) => highlights.findMarketRowId(db, clientId),
    hasDuplicate: (marketId: string, nameKey: string) => highlights.hasDuplicateHighlight(db, marketId, nameKey),
    insert: (marketId: string, input: Parameters<typeof highlights.insertSubmission>[2]) => highlights.insertSubmission(db, marketId, input),
  };
}

/** 제보를 받을 설정이 모두 있는지. 화면도 이 값으로 제보 버튼을 보일지 정한다. */
export const highlightSubmissionsEnabled = (): boolean => ["DATABASE_URL", "SLACK_BOT_TOKEN", "SLACK_CHANNEL_ID"]
  .every((name) => Boolean(process.env[name]?.trim()));

/** 시장 패널·상세 페이지의 "이 장에 대해 알려 주기". 검토 중으로 저장하고 슬랙에 승인 요청을 보낸다. */
export function createHighlightSubmissionHandler(overrides: Partial<SubmissionDeps> = {}) {
  const deps: SubmissionDeps = {
    catalog: loadCatalog,
    notify: postSubmissionMessage,
    allow: createRateLimiter(5, 10 * 60 * 1000),
    store: dbStore,
    ...overrides,
  };

  return async function POST(request: Request): Promise<Response> {
    if (!highlightSubmissionsEnabled()) return json(503, "지금은 제보를 받을 수 없어요.");
    const origin = request.headers.get("origin");
    let allowedOrigins: string[];
    try {
      allowedOrigins = allowedReportOrigins(request);
    } catch {
      console.error("Invalid report origin configuration");
      return json(500, "제보 설정을 확인해 주세요.");
    }
    if (!origin || !allowedOrigins.includes(origin)) return json(403, "허용되지 않은 요청입니다.");

    const rawBody = await request.text();
    if (rawBody.length > 4_000) return json(413, "제보 내용이 너무 길어요.");
    let body: Record<string, unknown>;
    try {
      const parsed = JSON.parse(rawBody) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("not an object");
      body = parsed as Record<string, unknown>;
    } catch {
      return json(400, "제보 형식이 올바르지 않아요.");
    }

    if (typeof body._gotcha === "string" && body._gotcha.trim()) return json(200, DONE);

    const input = parseHighlightSubmission(body);
    if (!input) return json(400, "입력한 내용을 확인해 주세요.", "invalid");
    const catalog = await deps.catalog();
    const market = typeof body.market_id === "string" ? catalog.findMarketById(body.market_id) : undefined;
    if (!market) return json(400, "시장을 다시 선택해 주세요.", "invalid");

    if (!deps.allow(clientIp(request))) return json(429, "잠시 뒤에 다시 보내 주세요.", "rate_limit");

    let submissionId: string;
    try {
      const store = await deps.store();
      const marketRowId = await store.findMarketRowId(market.id);
      if (!marketRowId) return json(400, "시장을 다시 선택해 주세요.", "invalid");
      if (await store.hasDuplicate(marketRowId, highlightNameKey(input.name))) {
        return json(409, "이미 등록됐거나 검토 중인 내용이에요.", "duplicate");
      }
      submissionId = await store.insert(marketRowId, input);
    } catch (error) {
      console.error("Highlight submission failed", error);
      return json(500, "제보를 저장하지 못했어요. 잠시 뒤에 다시 시도해 주세요.", "server");
    }

    const path = catalog.isMarketIndexable(market) ? getMarketPagePath(market) : `/?when=all&market=${encodeURIComponent(market.id)}`;
    try {
      await deps.notify({ submissionId, marketName: market.name, marketUrl: new URL(path, SITE_URL).href, ...input });
    } catch (error) {
      // 제보는 검토 중으로 남는다. 운영자가 DB에서 볼 수 있다.
      console.error("Slack notification failed", error);
    }
    return json(200, DONE);
  };
}
