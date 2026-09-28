import type { OnnuriMerchantSummary } from "../lib/market";
import styles from "./onnuri-summary.module.css";
import type { Locale } from "../lib/locale";

interface OnnuriSummaryProps {
  locale?: Locale;
  marketName: string;
  summary: OnnuriMerchantSummary | null;
  headingLevel: 2 | 3;
}

const countFormat = new Intl.NumberFormat("ko-KR");

const formatReferenceDate = (value: string): string => value.replace(
  /^(\d{4})-(\d{2})-(\d{2})$/,
  "$1.$2.$3",
);

export function OnnuriSummary({ locale = "ko", marketName, summary, headingLevel }: OnnuriSummaryProps) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const headingId = `onnuri-${marketName.replace(/\s+/g, "-")}`;

  return (
    <section className={styles.card} aria-labelledby={headingId}>
      <Heading id={headingId}>{locale === "en" ? "Onnuri gift certificates" : "온누리상품권"}</Heading>
      {summary ? (
        <div className={styles.counts}>
          <strong>{locale === "en" ? `${countFormat.format(summary.totalCount)} participating stores` : `가맹점 총 ${countFormat.format(summary.totalCount)}곳`}</strong>
          <div>
            <span>{locale === "en" ? `Digital: ${countFormat.format(summary.digitalCount)}` : `디지털 ${countFormat.format(summary.digitalCount)}곳`}</span>
            <span>{locale === "en" ? `Paper: ${countFormat.format(summary.paperCount)}` : `지류 ${countFormat.format(summary.paperCount)}곳`}</span>
          </div>
          <small>{locale === "en" ? `Data as of ${summary.referenceDate}` : `${formatReferenceDate(summary.referenceDate)} 기준`}</small>
        </div>
      ) : (
        <strong className={styles.unknown}>{locale === "en" ? "Participating store count unconfirmed" : "가맹점 수 확인 필요"}</strong>
      )}
      <p>{locale === "en" ? "Acceptance can change by store. Check the official store finder before visiting." : "점포별 취급 여부는 변경될 수 있으니 방문 전 공식 가맹점 찾기에서 확인하세요."}</p>
      <div className={styles.links}>
        <a href="https://www.onnuri.gift/place">{locale === "en" ? "Find participating stores (Korean)" : "공식 가맹점 찾기"}</a>
        {summary ? <a href={summary.source.url} target="_blank" rel="noreferrer">{locale === "en" ? "Data source (Korean)" : "집계 데이터 출처"}</a> : null}
      </div>
    </section>
  );
}
