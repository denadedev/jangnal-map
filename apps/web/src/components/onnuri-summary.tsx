import type { OnnuriMerchantSummary } from "../lib/market";
import styles from "./onnuri-summary.module.css";

interface OnnuriSummaryProps {
  marketName: string;
  summary: OnnuriMerchantSummary | null;
  headingLevel: 2 | 3;
}

const countFormat = new Intl.NumberFormat("ko-KR");

const formatReferenceDate = (value: string): string => value.replace(
  /^(\d{4})-(\d{2})-(\d{2})$/,
  "$1.$2.$3",
);

export function OnnuriSummary({ marketName, summary, headingLevel }: OnnuriSummaryProps) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const headingId = `onnuri-${marketName.replace(/\s+/g, "-")}`;

  return (
    <section className={styles.card} aria-labelledby={headingId}>
      <Heading id={headingId}>온누리상품권</Heading>
      {summary ? (
        <div className={styles.counts}>
          <strong>가맹점 총 {countFormat.format(summary.totalCount)}곳</strong>
          <div>
            <span>디지털 {countFormat.format(summary.digitalCount)}곳</span>
            <span>지류 {countFormat.format(summary.paperCount)}곳</span>
          </div>
          <small>{formatReferenceDate(summary.referenceDate)} 기준</small>
        </div>
      ) : (
        <strong className={styles.unknown}>가맹점 수 확인 필요</strong>
      )}
      <p>점포별 취급 여부는 변경될 수 있으니 방문 전 공식 가맹점 찾기에서 확인하세요.</p>
      <div className={styles.links}>
        <a href="https://www.onnuri.gift/place">공식 가맹점 찾기</a>
        {summary ? <a href={summary.source.url} target="_blank" rel="noreferrer">집계 데이터 출처</a> : null}
      </div>
    </section>
  );
}
