import type { Metadata } from "next";

import { OnnuriMarketSearch } from "../../components/onnuri-market-search";
import { publicMarkets } from "../../lib/market-catalog";
import { getMarketPagePath } from "../../lib/market-seo";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "온누리상품권 사용처·가맹점 찾기 | 오늘 장날",
  description: "전국 전통시장별 온누리상품권 전체·디지털·지류 가맹점 수와 사용처를 찾아보세요.",
  alternates: { canonical: "/onnuri" },
  openGraph: {
    title: "온누리상품권 사용처·가맹점 찾기 | 오늘 장날",
    description: "전국 전통시장별 온누리상품권 가맹점 수와 사용처를 확인하세요.",
    url: "/onnuri",
    type: "website",
    locale: "ko_KR",
  },
};

const featuredMarkets = publicMarkets
  .filter((market) => market.onnuri !== null)
  .sort((a, b) => b.onnuri!.totalCount - a.onnuri!.totalCount || a.name.localeCompare(b.name, "ko-KR"))
  .slice(0, 12);

const referenceDate = featuredMarkets[0]?.onnuri?.referenceDate.replace(
  /^(\d{4})-(\d{2})-(\d{2})$/,
  "$1.$2.$3",
) ?? "기준일 확인 필요";

export default function OnnuriPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <a className={styles.brand} href="/">오늘 장날</a>
        <nav aria-label="보조 메뉴">
          <a href="/?when=all">전국 지도</a>
          <a href="/report?kind=service">불편 신고</a>
        </nav>
      </header>
      <main className={styles.main}>
        <section className={styles.hero}>
          <p>전통시장 결제 정보</p>
          <h1>온누리상품권 사용처 찾기</h1>
          <strong>시장별 전체·디지털·지류 가맹점 수를 한눈에 확인하세요.</strong>
          <small>{referenceDate} 공식 데이터 기준</small>
        </section>

        <OnnuriMarketSearch />

        <section className={styles.featured} aria-labelledby="featured-markets">
          <div className={styles.sectionHeading}>
            <h2 id="featured-markets">가맹점이 많은 전통시장</h2>
            <p>전체 가맹점 수 기준 상위 시장입니다.</p>
          </div>
          <ul>
            {featuredMarkets.map((market) => (
              <li key={market.id}>
                <a
                  href={getMarketPagePath(market)}
                  aria-label={`${market.name} 온누리상품권 가맹점 ${market.onnuri!.totalCount.toLocaleString("ko-KR")}곳`}
                >
                  <span>{market.name}</span>
                  <strong>{market.onnuri!.totalCount.toLocaleString("ko-KR")}곳</strong>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.guide} aria-labelledby="onnuri-guide">
          <h2 id="onnuri-guide">온누리상품권 이용안내</h2>
          <div className={styles.guideGrid}>
            <article>
              <h3>디지털형과 지류형</h3>
              <p>같은 점포가 디지털형과 지류형을 모두 취급할 수 있어 유형별 수치의 합은 전체 가맹점 수와 다를 수 있습니다.</p>
            </article>
            <article>
              <h3>방문 전에 확인하세요</h3>
              <p>가맹 상태와 취급 유형은 변경될 수 있습니다. 결제 전 점포 표시나 공식 가맹점 찾기에서 다시 확인하세요.</p>
            </article>
          </div>
          <a className={styles.official} href="https://onnurigift.or.kr/" target="_blank" rel="noreferrer">
            온누리상품권 공식 가맹점 찾기
          </a>
        </section>
      </main>
    </div>
  );
}
