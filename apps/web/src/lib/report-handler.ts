import { publicMarkets } from "./market-catalog";
import { sendReportEmail } from "./report-email";
import {
  MARKET_REPORT_TYPES,
  SERVICE_REPORT_TYPES,
  validateReport,
  type ReportScope,
  type ResolvedReport,
} from "./report";

type SendReport = (report: ResolvedReport) => Promise<void>;

const value = (input: unknown): string => typeof input === "string" ? input : "";

const json = (status: number, message: string) => Response.json({ message }, { status });

const emailErrorCode = (error: unknown): string => {
  if (!error || typeof error !== "object") return "UNKNOWN";
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : "UNKNOWN";
};

export function createReportHandler(sendReport: SendReport = sendReportEmail) {
  return async function POST(request: Request): Promise<Response> {
    const origin = request.headers.get("origin");
    if (!origin || origin !== new URL(request.url).origin) {
      return json(403, "허용되지 않은 요청입니다.");
    }

    const rawBody = await request.text();
    if (rawBody.length > 10_000) return json(413, "제보 내용이 너무 깁니다.");

    let parsedBody: unknown;
    try {
      parsedBody = JSON.parse(rawBody) as unknown;
    } catch {
      return json(400, "제보 형식이 올바르지 않습니다.");
    }
    if (!parsedBody || typeof parsedBody !== "object" || Array.isArray(parsedBody)) {
      return json(400, "제보 형식이 올바르지 않습니다.");
    }
    const body = parsedBody as Record<string, unknown>;

    if (value(body._gotcha).trim()) return json(200, "제보를 받았습니다.");

    const scope = value(body.scope) as ReportScope;
    if (scope !== "market" && scope !== "service") return json(400, "제보 범위가 올바르지 않습니다.");

    const detailType = value(body.detail_type);
    const allowedTypes = scope === "market" ? MARKET_REPORT_TYPES : SERVICE_REPORT_TYPES;
    if (!allowedTypes.some(([type]) => type === detailType)) return json(400, "제보 유형이 올바르지 않습니다.");

    const message = value(body.message);
    const evidenceUrl = value(body.evidence_url);
    const contact = value(body.contact);
    const validationErrors = validateReport({
      detailType,
      message,
      evidenceUrl,
      contact,
      consent: value(body.privacy_consent) === "yes",
    });
    if (Object.keys(validationErrors).length > 0) return json(400, "제보 내용을 확인해 주세요.");

    const market = scope === "market"
      ? publicMarkets.find((item) => item.id === value(body.market_id)) ?? null
      : null;
    if (scope === "market" && !market) return json(400, "시장을 다시 선택해 주세요.");

    try {
      await sendReport({
        scope,
        detailType,
        message: message.trim(),
        evidenceUrl: evidenceUrl.trim(),
        contact: contact.trim(),
        pageUrl: value(body.page_url).slice(0, 500),
        market: market ? { id: market.id, name: market.name } : null,
      });
      return json(200, "제보를 받았습니다.");
    } catch (error) {
      console.error("Report email delivery failed", { code: emailErrorCode(error) });
      return json(502, "제보를 보내지 못했습니다.");
    }
  };
}
