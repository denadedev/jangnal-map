import type { DayPattern, MarketLink } from "../lib/jangnal-dates";
import { formatPatternLabel, getPatternOf } from "../lib/jangnal-dates";
import { MapLinkButton } from "./map-link-button";
import styles from "./jangnal-landing.module.css";

const patternClass: Record<DayPattern, string> = {
  "1-6": styles.p16,
  "2-7": styles.p27,
  "3-8": styles.p38,
  "4-9": styles.p49,
  "5-10": styles.p510,
};

export const getPatternClass = (pattern: DayPattern): string => patternClass[pattern];

export function PatternTag({ pattern }: { pattern: DayPattern }) {
  return <span className={`${styles.ptag} ${patternClass[pattern]}`}>{formatPatternLabel(pattern)}</span>;
}

const parkingText = (hasParking: boolean | null): string =>
  hasParking === true ? "주차 가능" : hasParking === false ? "주차 없음" : "주차 정보 없음";

interface MarketRowProps {
  market: MarketLink;
  showDistrict?: boolean;
  showPattern?: boolean;
  compact?: boolean;
}

export function MarketRow({ market, showDistrict = true, showPattern = false, compact = false }: MarketRowProps) {
  const pattern = getPatternOf(market);
  const rowProps = {
    className: `${styles.row} ${compact ? styles.compact : ""}`,
    href: market.href,
    "data-umami-event": "region-market-click",
    "data-umami-event-reviewed": market.reviewed ? "true" : "false",
  };
  const content = (
    <>
      <span>
        <span className={styles.name}>
          {market.name}
          {market.reviewed ? <span aria-label="검수 완료"> ✓</span> : null}
        </span>
        <span className={styles.meta}>
          {showDistrict ? `${market.district} · ` : null}
          {showPattern && pattern ? <><PatternTag pattern={pattern} /> · </> : null}
          {market.marketType} · {parkingText(market.hasParking)}
        </span>
      </span>
      {market.reviewed
        ? <span className={styles.detailLink}>상세 보기 ›</span>
        : <span className={styles.mapLink}>지도에서 보기</span>}
    </>
  );
  // 검수 전 시장은 지도 쿼리 주소로 가므로 링크 대신 버튼으로 이동한다.
  return market.reviewed ? <a {...rowProps}>{content}</a> : <MapLinkButton {...rowProps}>{content}</MapLinkButton>;
}

export function MarketLegend() {
  return (
    <p className={styles.note}>
      ✓ 표시가 있으면 검수를 마친 시장이라 <b>상세 보기</b>로 갈 수 있어요. 그 밖의 시장은 <b>지도에서 보기</b>로 위치를 확인해요.
    </p>
  );
}
