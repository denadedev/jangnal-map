export type ReportScope = "market" | "service";

export interface MarketReportContext {
  id: string;
  name: string;
}

export interface ReportFormValues {
  detailType: string;
  message: string;
  evidenceUrl: string;
  contact: string;
  consent: boolean;
}

export interface ResolvedReport {
  scope: ReportScope;
  detailType: string;
  message: string;
  evidenceUrl: string;
  contact: string;
  pageUrl: string;
  market: MarketReportContext | null;
}

export type ReportFieldErrors = Partial<Record<keyof ReportFormValues, string>>;

export class ReportSubmissionError extends Error {
  constructor(
    public readonly code: "limit" | "failure",
    message: string,
  ) {
    super(message);
    this.name = "ReportSubmissionError";
  }
}

export const MARKET_REPORT_TYPES = [
  ["schedule", "장날·운영일"],
  ["closure", "휴장·폐장"],
  ["location", "위치·주소"],
  ["contact", "전화·주차"],
  ["other", "기타"],
] as const;

export const SERVICE_REPORT_TYPES = [
  ["interface", "화면·버튼 오류"],
  ["discovery", "정보를 찾기 어려움"],
  ["map", "지도·위치 문제"],
  ["other", "기타"],
] as const;

export function validateReport(values: ReportFormValues): ReportFieldErrors {
  const errors: ReportFieldErrors = {};

  if (!values.detailType) {
    errors.detailType = "제보 유형을 선택해 주세요.";
  }
  if (!values.message.trim()) {
    errors.message = "알려주실 내용을 입력해 주세요.";
  } else if (values.message.length > 1_000) {
    errors.message = "내용은 1,000자까지 입력할 수 있습니다.";
  }
  if (values.contact.length > 100) {
    errors.contact = "연락처는 100자까지 입력할 수 있습니다.";
  }
  if (values.evidenceUrl.trim()) {
    try {
      const url = new URL(values.evidenceUrl);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        throw new Error("unsupported protocol");
      }
    } catch {
      errors.evidenceUrl = "http:// 또는 https://로 시작하는 주소를 입력해 주세요.";
    }
  }
  if (values.contact.trim() && !values.consent) {
    errors.consent = "연락처를 남기려면 개인정보 수집에 동의해 주세요.";
  }
  return errors;
}

export async function submitReport(formData: FormData): Promise<void> {
  const payload = Object.fromEntries(
    Array.from(formData.entries())
      .filter(([, entryValue]) => typeof entryValue === "string" && entryValue !== "")
      .map(([key, entryValue]) => [key, String(entryValue)]),
  );
  const response = await fetch("/api/report", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
  });

  if (response.status === 429) {
    throw new ReportSubmissionError("limit", "현재 제보 요청이 많아 잠시 접수할 수 없습니다.");
  }
  if (!response.ok) {
    throw new ReportSubmissionError("failure", "제보를 보내지 못했습니다.");
  }
}
