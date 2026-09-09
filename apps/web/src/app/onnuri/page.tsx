import type { Metadata } from "next";

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
          <h1>온누리상품권 이용안내</h1>
          <strong>전통시장과 상점가에서 사용할 수 있는 온누리상품권을 알아보세요.</strong>
        </section>

        <section className={styles.guide} aria-labelledby="onnuri-guide">
          <h2 id="onnuri-guide">온누리상품권이란?</h2>
          <p className={styles.intro}>전통시장과 상점가의 소비를 돕기 위해 발행되는 상품권입니다. 모든 점포에서 자동으로 사용할 수 있는 것은 아니며, 온누리상품권 가맹점으로 등록된 점포에서 사용할 수 있습니다.</p>
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
          <a className={styles.official} href="https://www.onnuri.gift/place">
            공식 온누리 가맹점 찾기
          </a>
        </section>
      </main>
    </div>
  );
}
