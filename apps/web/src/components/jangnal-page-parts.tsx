import type { ReactNode } from "react";

import type { MarketLink } from "../lib/jangnal-landing";
import { MarketLegend, MarketRow } from "./jangnal-market-row";
import { MobileAppBar } from "./mobile-app-bar";
import { SiteFooter } from "./site-footer";
import styles from "./jangnal-landing.module.css";

export const DATA_REFERENCE_DATE = "2025-11-10";

const formatIsoDate = (value: string): string => value.replace(/^(\d{4})-(\d{2})-(\d{2})$/, (_, y, m, d) => `${y}년 ${Number(m)}월 ${Number(d)}일`);

export function LandingShell({ crumbs, current, children }: { crumbs: [string, string][]; current: string; children: ReactNode }) {
  return (
    <div className={styles.page}>
      <MobileAppBar title="장날" backHref="/" />
      <main className={styles.main}>
        <nav className={styles.crumbs} aria-label="현재 위치">
          {crumbs.map(([label, href]) => <span key={href}><a href={href}>{label}</a> › </span>)}
          <span aria-current="page">{current}</span>
        </nav>
        {children}
        <p className={styles.foot}>
          장날 정보는 공공데이터 기준({formatIsoDate(DATA_REFERENCE_DATE)})이에요. 임시 휴장이나 일정 변경은 반영되지 않았을 수 있어요.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}

export function LandingHero({ title, summary }: { title: string; summary: string }) {
  return (
    <div className={styles.hero}>
      <h1>{title}</h1>
      <p>{summary}</p>
    </div>
  );
}

export function DataBasis() {
  return (
    <div className={styles.basis}>
      <p className={styles.lab}>자료 기준일</p>
      <p className={styles.val}>{formatIsoDate(DATA_REFERENCE_DATE)}</p>
      <p className={styles.cap}>공공데이터 기준일이에요. 현장에서 마지막으로 확인한 날이 아니라서, 가기 전에 시장에 확인해 주세요.</p>
    </div>
  );
}

export function MarketGroups({ groups, heading, total, showPattern }: {
  groups: { label: string; markets: MarketLink[] }[];
  heading: string;
  total: number;
  showPattern: boolean;
}) {
  return (
    <section className={styles.sec} aria-labelledby="all-markets-heading">
      <div className={styles.secHead}>
        <h2 id="all-markets-heading">{heading}</h2>
        <span className={styles.count}>{total}곳</span>
      </div>
      <p className={styles.sub}>묶음을 눌러 펼쳐 보세요. 상설장+5일장은 상설시장에서 5일장도 함께 열린다는 뜻이에요.</p>
      <MarketLegend />
      <div className={styles.stack}>
        {groups.map(({ label, markets }, index) => (
          <details key={label} className={styles.group} open={index === 0}>
            <summary><span className={styles.groupName}>{label}</span><span className={styles.count}>{markets.length}곳</span></summary>
            <div className={styles.groupBody}>
              {markets.map((market) => <MarketRow key={market.id} market={market} showDistrict={!showPattern} showPattern={showPattern} />)}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

export function Faq({ items }: { items: [string, string][] }) {
  return (
    <section className={styles.sec} aria-labelledby="faq-heading">
      <h2 id="faq-heading">자주 묻는 질문</h2>
      <div className={styles.faq}>
        {items.map(([question, answer], index) => (
          <details key={question} open={index === 0}>
            <summary>{question}</summary>
            <p>{answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function LinkRow({ href, name, count }: { href: string; name: ReactNode; count: string }) {
  return (
    <a className={styles.linkRow} href={href}>
      <span className={styles.linkName}>{name}</span>
      <span className={styles.linkCount}>{count}</span>
    </a>
  );
}

export { styles as landingStyles };
