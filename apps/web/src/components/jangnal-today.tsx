"use client";

import { useEffect, useState } from "react";

import {
  formatPatternLabel,
  getMarketsOpenOn,
  getMonthCalendar,
  getNextOpenDate,
  getPatternForDate,
  getPatternDays,
  type DayPattern,
  type MarketLink,
} from "../lib/jangnal-dates";
import { getKoreaCalendarDate } from "../lib/korea-date";
import { formatKoreanDate, getDateRange, getDday } from "../lib/market-view";
import { MarketLegend, MarketRow, PatternTag, getPatternClass } from "./jangnal-market-row";
import styles from "./jangnal-landing.module.css";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function useKoreaToday(): Date | null {
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => {
    setToday(getKoreaCalendarDate(new Date()));
  }, []);
  return today;
}

const sameDay = (a: Date, b: Date): boolean => a.getTime() === b.getTime();

function Placeholder({ label }: { label: string }) {
  return <div className={styles.placeholder} aria-label={label} aria-busy="true" />;
}

function OpenList({ markets, date, compact = false }: { markets: MarketLink[]; date: Date; compact?: boolean }) {
  const open = getMarketsOpenOn(markets, date);
  if (open.length > 0) {
    return <div>{open.map((market) => <MarketRow key={market.id} market={market} compact={compact} />)}</div>;
  }
  const next = getNextOpenDate(markets, date);
  return (
    <p className={styles.empty}>
      <strong>이날 열리는 장이 없어요</strong>
      {next ? `다음 장날은 ${formatKoreanDate(next)}` : null}
    </p>
  );
}

function MonthCalendar({ markets, today, selected, onSelect }: {
  markets: MarketLink[];
  today: Date;
  selected: Date;
  onSelect: (date: Date) => void;
}) {
  const days = getMonthCalendar(markets, today.getFullYear(), today.getMonth());
  const lead = days[0].date.getDay();
  return (
    <div className={styles.calendar} role="group" aria-label={`${today.getFullYear()}년 ${today.getMonth() + 1}월 장날 달력`}>
      {WEEKDAYS.map((weekday) => <span key={weekday} className={styles.weekday} aria-hidden="true">{weekday}</span>)}
      {Array.from({ length: lead }, (_, index) => <span key={`blank-${index}`} aria-hidden="true" />)}
      {days.map(({ date, pattern, count }) => (
        <button
          key={date.getDate()}
          type="button"
          className={`${styles.day} ${getPatternClass(pattern)} ${sameDay(date, today) ? styles.today : ""}`}
          aria-pressed={sameDay(date, selected)}
          aria-label={`${date.getMonth() + 1}월 ${date.getDate()}일, ${formatPatternLabel(pattern)}, ${count}곳`}
          onClick={() => onSelect(date)}
        >
          <span className={styles.dayNumber}>{date.getDate()}</span>
          <span className={styles.dayCount}>{count}곳</span>
        </button>
      ))}
    </div>
  );
}

export function RegionToday({ markets, regionName }: { markets: MarketLink[]; regionName: string }) {
  const today = useKoreaToday();
  const [selected, setSelected] = useState<Date | null>(null);

  if (!today) {
    return (
      <section className={styles.sec} aria-label="오늘 열리는 장">
        <h2>오늘 열리는 장</h2>
        <Placeholder label="한국 날짜를 확인하는 중" />
      </section>
    );
  }

  const weekend = getDateRange("weekend", today)!;
  const sunday = weekend.end;
  const saturday = weekend.start;
  const chosen = selected ?? today;

  return (
    <>
      <section className={styles.sec} aria-labelledby="today-heading">
        <div className={styles.secHead}>
          <h2 id="today-heading">오늘 열리는 장</h2>
          <span className={styles.count}>{getMarketsOpenOn(markets, today).length}곳</span>
        </div>
        <p className={styles.sub}>
          {formatKoreanDate(today)} · 끝자리 {today.getDate() % 10} → <PatternTag pattern={getPatternForDate(today)} />
        </p>
        <MarketLegend />
        <div className={styles.stack}><OpenList markets={markets} date={today} /></div>
      </section>
      <section className={styles.sec} aria-labelledby="weekend-heading">
        <h2 id="weekend-heading">이번 주말 열리는 장</h2>
        <p className={styles.sub}>가장 가까운 토요일과 일요일이에요.</p>
        <div className={styles.stack}>
          {[saturday, sunday].map((date) => (
            <div key={date.getTime()} className={styles.dayGroup}>
              <p className={styles.dayHead}><strong>{formatKoreanDate(date)}</strong><PatternTag pattern={getPatternForDate(date)} /></p>
              <OpenList markets={markets} date={date} />
            </div>
          ))}
        </div>
      </section>
      <section className={styles.sec} aria-labelledby="calendar-heading">
        <h2 id="calendar-heading">{today.getMonth() + 1}월 {regionName} 장날 달력</h2>
        <p className={styles.sub}>끝자리마다 열리는 장이 달라서 날짜마다 다른 장이 서요. 칸을 누르면 그날 열리는 장을 볼 수 있어요.</p>
        <ul className={styles.legend} aria-label="끝자리 색 범례">
          {(["1-6", "2-7", "3-8", "4-9", "5-10"] as DayPattern[]).map((pattern) => <li key={pattern}><PatternTag pattern={pattern} /></li>)}
        </ul>
        <MonthCalendar markets={markets} today={today} selected={chosen} onSelect={setSelected} />
        <div className={styles.panel} aria-live="polite">
          <p className={styles.lab}>선택한 날짜</p>
          <p className={styles.big}>{formatKoreanDate(chosen)}{sameDay(chosen, today) ? " · 오늘" : ""}</p>
          <OpenList markets={markets} date={chosen} compact />
        </div>
      </section>
    </>
  );
}

export function PatternDates({ pattern }: { pattern: DayPattern }) {
  const today = useKoreaToday();
  if (!today) {
    return (
      <section className={styles.sec} aria-label="다음 장날">
        <h2>다음 장날</h2>
        <Placeholder label="한국 날짜를 확인하는 중" />
      </section>
    );
  }

  const sample = { schedule: { kind: "digit-pair" as const, days: getPatternDays(pattern) } };
  const dates: Date[] = [];
  for (let offset = 0; dates.length < 6 && offset < 62; offset += 1) {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset);
    if (getMarketsOpenOn([sample], date).length > 0) dates.push(date);
  }

  return (
    <section className={styles.sec} aria-labelledby="next-dates-heading">
      <h2 id="next-dates-heading">다음 장날</h2>
      <ul className={styles.dates}>
        {dates.map((date) => {
          const dday = getDday(date, today);
          return (
            <li key={date.getTime()}>
              <strong>{date.getMonth() + 1}/{date.getDate()}({WEEKDAYS[date.getDay()]})</strong>
              <small>{dday === 0 ? "오늘 열려요" : `${dday}일 뒤`}</small>
            </li>
          );
        })}
      </ul>
    </section>
  );
}


export function HubToday({ markets }: { markets: MarketLink[] }) {
  const today = useKoreaToday();
  if (!today) {
    return (
      <section className={styles.sec} aria-label="오늘 열리는 장">
        <h2>오늘 열리는 장</h2>
        <Placeholder label="한국 날짜를 확인하는 중" />
      </section>
    );
  }

  const pattern = getPatternForDate(today);
  const weekend = getDateRange("weekend", today)!;
  const countOn = (date: Date) => getMarketsOpenOn(markets, date).length;

  return (
    <section className={styles.sec} aria-labelledby="hub-today-heading">
      <h2 id="hub-today-heading">오늘 열리는 장</h2>
      <div className={styles.todayCard}>
        <p className={styles.lab}>{formatKoreanDate(today)} · 끝자리 {today.getDate() % 10}</p>
        <p className={styles.big}><PatternTag pattern={pattern} /> 전국 {countOn(today)}곳</p>
        <a className={styles.chip} href={`/jangnal/days/${pattern}`}>{formatPatternLabel(pattern)} 전국 목록 보기 ›</a>
      </div>
      <p className={styles.note}><b>이번 주말</b></p>
      <div className={styles.two}>
        {[weekend.start, weekend.end].map((date) => {
          const datePattern = getPatternForDate(date);
          return (
            <a key={date.getTime()} className={styles.miniCard} href={`/jangnal/days/${datePattern}`}>
              <span className={styles.lab}>{formatKoreanDate(date)}</span>
              <PatternTag pattern={datePattern} />
              <span className={styles.count}>전국 {countOn(date)}곳</span>
            </a>
          );
        })}
      </div>
    </section>
  );
}
