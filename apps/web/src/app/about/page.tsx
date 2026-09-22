import type { Metadata } from "next";

import { MobileAppBar } from "../../components/mobile-app-bar";
import { SiteFooter } from "../../components/site-footer";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "오늘 장날 서비스 소개",
  description: "오늘 장날의 시장 데이터 출처, 편집 기준, 갱신 방식과 정보 수정 방법을 안내합니다.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "오늘 장날 서비스 소개",
    description: "오늘 장날의 시장 데이터 출처와 편집 기준을 안내합니다.",
    url: "/about",
    type: "website",
    locale: "ko_KR",
  },
};

export default function AboutPage() {
  return (
    <div className={styles.page}>
      <MobileAppBar title="서비스 소개" backHref="/" />
      <header className={`${styles.header} desktop-route-header`}>
        <a href="/">오늘 장날</a>
        <nav aria-label="보조 메뉴">
          <a href="/onnuri">온누리상품권</a>
          <a href="/report?kind=service">제보하기</a>
        </nav>
      </header>
      <main className={styles.main}>
        <article className={styles.article}>
          <p className={styles.eyebrow}>서비스 안내</p>
          <h1>오늘 장날 서비스 소개</h1>
          <p className={styles.lead}>오늘 장날은 오늘과 이번 주에 방문할 수 있는 전국 전통시장과 5일장의 일정을 지도와 시장별 안내로 보여주는 서비스입니다.</p>

          <section id="data-policy" className={styles.section} aria-labelledby="data-policy-heading">
            <h2 id="data-policy-heading">데이터 출처와 편집 기준</h2>
            <p>장날 일정과 주소·전화·주차 정보는 공공데이터포털 전국전통시장표준데이터를 기준으로 정리합니다. 온누리상품권 수치는 별도 공공데이터 집계를 사용하며, 각 시장 페이지에 출처와 기준일을 표시합니다.</p>
            <p>시장별 상세 안내는 한국관광공사, 지방자치단체, 시장 공식 채널 등 확인 가능한 자료를 대조해 작성합니다. 확인되지 않은 운영시간이나 현장 상태는 사실처럼 작성하지 않습니다.</p>
          </section>

          <section className={styles.section} aria-labelledby="update-heading">
            <h2 id="update-heading">갱신과 운영 주체</h2>
            <p>오늘 장날 운영자는 원본 데이터의 기준일과 편집 콘텐츠의 확인일을 함께 관리합니다. 시장별 정보가 달라졌다면 해당 시장의 제보 링크를 통해 알려주세요.</p>
            <p>운영 주체: 오늘 장날 운영자</p>
          </section>

          <section className={styles.section} aria-labelledby="correction-heading">
            <h2 id="correction-heading">정보 수정과 제보</h2>
            <p>시장 일정, 주소, 전화, 주차 정보가 실제와 다르면 근거 URL과 함께 제보해 주세요. 확인 후 반영하며, 제보만으로 정보가 즉시 변경되지는 않습니다.</p>
            <a className={styles.primary} href="/report?kind=service">정보 수정 제보하기</a>
          </section>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
