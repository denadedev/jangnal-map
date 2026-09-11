import type { PublicMarket } from "../lib/market";
import { getDday, formatKoreanDate } from "../lib/market-view";
import { getMarketDates, getNextMarketDate } from "../lib/schedule";
import { MarketShareButton } from "./market-share-button";
import { OnnuriSummary } from "./onnuri-summary";

interface MarketDetailProps {
  market: PublicMarket | null;
  today: Date;
  onClose: () => void;
}

const formatSourceDate = (value: string | null): string => {
  if (!value) return "확인일 정보 없음";
  return value.replace(/^(\d{4})-(\d{2})-(\d{2})$/, "$1.$2.$3");
};

const datesThrough = (start: Date, end: Date): Date[] => {
  const date = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const dates: Date[] = [];
  while (date <= last) {
    dates.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return dates;
};

export function MarketDetail({ market, today, onClose }: MarketDetailProps) {
  if (!market) {
    return (
      <div className="detail-placeholder">
        <span className="detail-placeholder-pin" aria-hidden="true" />
        <p>지도 핀이나 시장 목록을 선택하면</p>
        <strong>다음 장날을 자세히 보여드려요.</strong>
      </div>
    );
  }

  const nextDate = getNextMarketDate(market, today);
  const dday = nextDate ? getDday(nextDate, today) : null;
  const timelineEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 6);
  const timelineDates = market.schedule.kind === "digit-pair" ? datesThrough(today, timelineEnd) : [];
  const marketDayTimes = new Set(getMarketDates(market, { start: today, end: timelineEnd }).map((date) => date.getTime()));
  const address = market.roadAddress ?? market.lotAddress ?? "주소 정보 없음";
  const hasCoordinates = market.latitude !== null && market.longitude !== null;
  const directionsUrl = hasCoordinates
    ? `https://map.naver.com/p/directions/-/${market.longitude},${market.latitude},${encodeURIComponent(market.name)}/-/car`
    : null;
  const timingTitle = market.schedule.kind === "digit-pair" ? "다음 장날" : "운영 일정";
  const timingText = market.schedule.kind === "daily"
    ? "매일 운영"
    : market.schedule.kind === "unknown"
      ? "운영 일정 확인 필요"
      : nextDate
        ? formatKoreanDate(nextDate)
        : "운영 일정 확인 필요";
  const timingBadge = market.schedule.kind === "daily"
    ? "오늘 운영"
    : dday === null
      ? null
      : dday === 0
        ? "오늘 장날"
        : `D-${dday}`;

  return (
    <article className="market-detail" aria-label={`${market.name} 상세정보`}>
      <div className="sheet-handle" aria-hidden="true" />
      <button type="button" className="detail-close" aria-label="시장 상세 닫기" onClick={onClose}>
        <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m7 7 10 10M17 7 7 17" /></svg>
      </button>

      <header className="detail-header">
        <p>{market.marketType}</p>
        <h2>{market.name}</h2>
        <span>{address}</span>
      </header>

      <section className="next-date-card" aria-labelledby="next-market-date">
        <div>
          <p id="next-market-date">{timingTitle}</p>
          <strong>{timingText}</strong>
        </div>
        {timingBadge ? <span className="dday">{timingBadge}</span> : null}
      </section>

      {market.schedule.kind === "digit-pair" ? (
        <section className="detail-section" aria-labelledby="upcoming-dates">
          <div className="section-heading">
            <h3 id="upcoming-dates">오늘부터 7일</h3>
            <span>{market.scheduleRaw}</span>
          </div>
          <ol className="date-timeline" aria-label="오늘부터 7일간 장날">
            {timelineDates.map((date, index) => {
              const isMarketDay = marketDayTimes.has(date.getTime());
              const isToday = index === 0;
              return (
                <li key={date.toISOString()} className={`${isToday ? "is-today" : ""} ${isMarketDay ? "is-market-day" : ""}`.trim()}>
                  <strong>{date.getDate()}</strong>
                  <small>{new Intl.DateTimeFormat("ko-KR", { weekday: "short" }).format(date)}</small>
                  <em>{isToday && isMarketDay ? "오늘 장날" : isMarketDay ? "장날" : isToday ? "오늘" : ""}</em>
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}

      <section className="detail-section" aria-labelledby="visit-info">
        <h3 id="visit-info">방문 정보</h3>
        <dl className="info-list">
          <div><dt>주소</dt><dd>{address}</dd></div>
          <div><dt>전화</dt><dd>{market.phone ? <a href={`tel:${market.phone}`}>{market.phone}</a> : "정보 없음"}</dd></div>
          <div><dt>주차</dt><dd>{market.hasParking === true ? "주차 가능" : market.hasParking === false ? "주차장 없음" : "확인 필요"}</dd></div>
          {!hasCoordinates ? <div><dt>지도</dt><dd>위치 확인 필요</dd></div> : null}
        </dl>
        <div className={`detail-actions ${directionsUrl ? "" : "share-only"}`.trim()}>
          {directionsUrl ? (
            <a className="primary-button" href={directionsUrl} target="_blank" rel="noreferrer">
              NAVER 지도에서 길찾기
              <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M14 5h5v5M19 5 10 14M19 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" /></svg>
            </a>
          ) : null}
          <MarketShareButton market={market} today={today} className="share-button" />
        </div>
      </section>

      <div className="detail-section">
        <OnnuriSummary marketName={market.name} summary={market.onnuri} headingLevel={3} />
      </div>

      <footer className="source-note">
        <span>정보 출처</span>
        <a href={market.source.url} target="_blank" rel="noreferrer">{market.source.name}</a>
        <p>데이터 기준일 {formatSourceDate(market.referenceDate ?? market.source.referenceDate)}</p>
        <a className="report-link" href={`/report?kind=market&market=${encodeURIComponent(market.id)}`}>
          정보가 다른가요? 수정 제보
        </a>
      </footer>
    </article>
  );
}
