import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MarketNextDate } from "../../../components/market-next-date";
import { OnnuriSummary } from "../../../components/onnuri-summary";
import { publicMarkets } from "../../../lib/market-catalog";
import {
  createMarketSeoText,
  createMarketSlug,
  findMarketBySlug,
  getMarketPagePath,
  isMarketIndexable,
  SITE_URL,
} from "../../../lib/market-seo";
import { formatSchedulePattern } from "../../../lib/market-view";
import styles from "./page.module.css";

export const dynamicParams = false;

type MarketPageProps = { params: Promise<{ slug: string }> };

const formatSourceDate = (value: string | null): string => value
  ? value.replace(/^(\d{4})-(\d{2})-(\d{2})$/, "$1.$2.$3")
  : "확인일 정보 없음";

export function generateStaticParams() {
  return publicMarkets
    .filter((market) => market.status === "운영")
    .map((market) => ({ slug: createMarketSlug(market) }));
}

export async function generateMetadata({ params }: MarketPageProps): Promise<Metadata> {
  const market = findMarketBySlug((await params).slug);
  if (!market) return {};

  const seo = createMarketSeoText(market);
  const path = getMarketPagePath(market);
  const url = `${SITE_URL}${path}`;

  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: url },
    robots: isMarketIndexable(market) ? undefined : { index: false, follow: true },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url,
      type: "website",
      locale: "ko_KR",
    },
  };
}

export default async function MarketPage({ params }: MarketPageProps) {
  const market = findMarketBySlug((await params).slug);
  if (!market) notFound();

  const address = market.roadAddress ?? market.lotAddress ?? "주소 정보 없음";
  const mapHref = `/?when=all&market=${encodeURIComponent(market.id)}`;
  const directionsHref = market.latitude !== null && market.longitude !== null
    ? `https://map.naver.com/p/directions/-/${market.longitude},${market.latitude},${encodeURIComponent(market.name)}/-/car`
    : null;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: market.name,
    url: `${SITE_URL}${getMarketPagePath(market)}`,
    address,
    ...(market.phone ? { telephone: market.phone } : {}),
    ...(market.latitude !== null && market.longitude !== null
      ? {
        geo: {
          "@type": "GeoCoordinates",
          latitude: market.latitude,
          longitude: market.longitude,
        },
      }
      : {}),
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <a href="/">오늘 장날</a>
        <nav aria-label="보조 메뉴">
          <a href="/onnuri">온누리상품권</a>
          <a href="/report?kind=service">불편 신고</a>
          <a href={mapHref}>전국 지도</a>
        </nav>
      </header>
      <main className={styles.main}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
        <article className={styles.article}>
          <section className={styles.hero}>
            <p className={styles.eyebrow}>{market.marketType}</p>
            <h1>{market.name}</h1>
            <span className={styles.schedule}>{formatSchedulePattern(market)}</span>
          </section>
          <div className={`${styles.section} ${styles.nextDate}`}>
            <MarketNextDate market={market} />
          </div>
          <section className={styles.section}>
            <h2>방문 정보</h2>
            <dl className={styles.info}>
              <div><dt>주소</dt><dd>{address}</dd></div>
              <div><dt>전화</dt><dd>{market.phone ?? "정보 없음"}</dd></div>
              <div><dt>주차</dt><dd>{market.hasParking === true ? "주차 가능" : market.hasParking === false ? "주차장 없음" : "확인 필요"}</dd></div>
            </dl>
            <div className={styles.actions}>
              <a className={styles.primary} href={mapHref}>전국 장날 지도에서 보기</a>
              {directionsHref ? <a className={styles.secondary} href={directionsHref} target="_blank" rel="noreferrer">NAVER 지도에서 길찾기</a> : null}
              <a className={styles.secondary} href={`/report?kind=market&market=${encodeURIComponent(market.id)}`}>
                정보가 다른가요? 수정 제보
              </a>
            </div>
          </section>
          <div className={styles.section}>
            <OnnuriSummary marketName={market.name} summary={market.onnuri} headingLevel={2} />
          </div>
          <footer className={styles.footer}>
            <span>정보 출처</span>{" "}
            <a href={market.source.url} target="_blank" rel="noreferrer">{market.source.name}</a>
            <p>데이터 기준일 {formatSourceDate(market.referenceDate ?? market.source.referenceDate)}</p>
          </footer>
        </article>
      </main>
    </div>
  );
}
