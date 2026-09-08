"use client";

import { useState, type FormEvent } from "react";

import {
  MARKET_REPORT_TYPES,
  ReportSubmissionError,
  SERVICE_REPORT_TYPES,
  submitReport,
  validateReport,
  type MarketReportContext,
  type ReportFieldErrors,
  type ReportScope,
} from "../lib/report";

interface ReportFormProps {
  configured: boolean;
  supportEmail: string;
  scope: ReportScope;
  market: MarketReportContext | null;
}

type SubmissionStatus = "idle" | "submitting" | "succeeded" | "failed" | "limited";

const isEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export function ReportForm({ configured, supportEmail, scope, market }: ReportFormProps) {
  const [errors, setErrors] = useState<ReportFieldErrors>({});
  const [status, setStatus] = useState<SubmissionStatus>("idle");
  const [fallbackMailto, setFallbackMailto] = useState("");
  const types = scope === "market" ? MARKET_REPORT_TYPES : SERVICE_REPORT_TYPES;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const values = {
      detailType: String(data.get("detail_type") ?? ""),
      message: String(data.get("message") ?? ""),
      evidenceUrl: String(data.get("evidence_url") ?? ""),
      contact: String(data.get("contact") ?? ""),
      consent: data.get("privacy_consent") === "yes",
    };
    const nextErrors = validateReport(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const subject = scope === "market" ? "[오늘장날] 시장 정보 수정 제보" : "[오늘장날] 서비스 불편 신고";
    data.set("page_url", window.location.href);
    setStatus("submitting");
    try {
      await submitReport(data);
      setStatus("succeeded");
    } catch (error) {
      if (error instanceof ReportSubmissionError && error.code === "limit") {
        const detailType = types.find(([value]) => value === values.detailType)?.[1] ?? values.detailType;
        const fallbackBody = [
          `제보 범위: ${scope === "market" ? "시장 정보" : "서비스 불편"}`,
          market ? `시장: ${market.name} (${market.id})` : "",
          `유형: ${detailType}`,
          `내용: ${values.message}`,
          values.evidenceUrl ? `근거 URL: ${values.evidenceUrl}` : "",
          values.contact ? `연락처: ${values.contact}` : "",
        ].filter(Boolean).join("\n");
        const mailto = isEmail(supportEmail)
          ? `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(fallbackBody)}`
          : "";
        setFallbackMailto(mailto);
        setStatus("limited");
      } else {
        setStatus("failed");
      }
    }
  };

  if (status === "succeeded") {
    return (
      <div className="report-success" role="status">
        <h2>제보를 받았습니다.</h2>
        <p>확인이 필요한 내용은 운영자가 살펴보겠습니다.</p>
        <a href="/">지도로 돌아가기</a>
      </div>
    );
  }

  return (
    <form className="report-form" noValidate aria-busy={status === "submitting"} onSubmit={(event) => void handleSubmit(event)}>
      <input type="hidden" name="scope" value={scope} />
      {market ? (
        <>
          <input type="hidden" name="market_id" value={market.id} />
          <input type="hidden" name="market_name" value={market.name} />
        </>
      ) : null}
      <input className="report-honeypot" name="_gotcha" tabIndex={-1} autoComplete="off" aria-hidden="true" />

      <fieldset aria-describedby={errors.detailType ? "detail-type-error" : undefined}>
        <legend>어떤 내용인가요?</legend>
        <div className="report-options">
          {types.map(([value, label]) => (
            <label key={value}>
              <input type="radio" name="detail_type" value={value} />
              <span>{label}</span>
            </label>
          ))}
        </div>
        {errors.detailType ? <p id="detail-type-error" className="field-error">{errors.detailType}</p> : null}
      </fieldset>

      <label className="report-field">
        알려주실 내용
        <textarea
          name="message"
          rows={6}
          maxLength={1_000}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "message-error" : undefined}
        />
      </label>
      {errors.message ? <p id="message-error" className="field-error">{errors.message}</p> : null}

      <label className="report-field">
        관련 홈페이지 주소 <small>선택</small>
        <input
          name="evidence_url"
          type="url"
          inputMode="url"
          aria-invalid={Boolean(errors.evidenceUrl)}
          aria-describedby={errors.evidenceUrl ? "evidence-url-error" : undefined}
        />
      </label>
      {errors.evidenceUrl ? <p id="evidence-url-error" className="field-error">{errors.evidenceUrl}</p> : null}

      <label className="report-field">
        답변받을 연락처 <small>선택</small>
        <input
          name="contact"
          maxLength={100}
          aria-invalid={Boolean(errors.contact)}
          aria-describedby={errors.contact ? "contact-error" : undefined}
        />
      </label>
      {errors.contact ? <p id="contact-error" className="field-error">{errors.contact}</p> : null}
      <p className="privacy-note">
        제보 답변을 위해 사용하며 처리 완료 후 90일 이내 삭제합니다. 입력하지 않아도 제보할 수 있습니다.{" "}
        <a href="/privacy">자세히 보기</a>
      </p>
      <label className="consent-field">
        <input
          type="checkbox"
          name="privacy_consent"
          value="yes"
          aria-invalid={Boolean(errors.consent)}
          aria-describedby={errors.consent ? "contact-consent-error" : undefined}
        />
        연락처 수집·이용에 동의합니다.
      </label>
      {errors.consent ? <p id="contact-consent-error" className="field-error">{errors.consent}</p> : null}
      {!configured ? <p role="alert">제보 접수를 준비하고 있습니다. 잠시 후 다시 이용해 주세요.</p> : null}
      {status === "failed" ? <p role="alert">제보를 보내지 못했습니다. 잠시 후 다시 시도해 주세요.</p> : null}
      {status === "limited" ? (
        <p role="alert">
          현재 제보 요청이 많아 잠시 접수할 수 없습니다.
          {fallbackMailto ? <> 작성한 내용을 복사해 <a href={fallbackMailto}>{supportEmail}</a>로 보내주세요.</> : null}
        </p>
      ) : null}
      <p className="sr-only" role="status" aria-live="polite">
        {status === "submitting" ? "제보를 보내는 중입니다." : ""}
      </p>

      <button type="submit" disabled={!configured || status === "submitting"}>
        {status === "submitting" ? "보내는 중…" : "제보 보내기"}
      </button>
    </form>
  );
}
