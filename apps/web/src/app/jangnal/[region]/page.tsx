import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PatternTag } from "../../../components/jangnal-market-row";
import { DataBasis, Faq, LandingHero, LandingShell, LinkRow, MarketGroups, landingStyles as styles } from "../../../components/jangnal-page-parts";
import { RegionToday } from "../../../components/jangnal-today";
import { MapLinkButton } from "../../../components/map-link-button";
import type { Catalog } from "../../../lib/catalog/catalog";
import { loadCatalog } from "../../../lib/catalog/load";
import { DAY_PATTERNS, formatPatternLabel, groupByDistrict } from "../../../lib/jangnal-landing";
import { getMarketPagePath, SITE_URL } from "../../../lib/market-seo";
import { findRegionBySlug, type Region } from "../../../lib/region";
import { OG_IMAGE } from "../../../lib/site-config";

// 요청 때 메모리의 시장 데이터 스냅샷으로 그린다. 빌드 때는 데이터를 읽지 않는다.
export const dynamic = "force-dynamic";

type RegionPageProps = { params: Promise<{ region: string }> };

const findLaunchRegion = (catalog: Catalog, slug: string): Region | undefined => {
  const region = findRegionBySlug(slug);
  return region && catalog.isLaunchRegion(region.slug) ? region : undefined;
};

export async function generateMetadata({ params }: RegionPageProps): Promise<Metadata> {
  const catalog = await loadCatalog();
  const region = findLaunchRegion(catalog, (await params).region);
  if (!region) return { robots: { index: false, follow: false } };

  const count = catalog.getRegionMarkets(region.slug).length;
  const title = `${region.shortName} 장날 · 오늘 열리는 5일장 ${count}곳 | 오늘 장날`;
  const description = `${region.name} 5일장 ${count}곳의 장날을 끝자리(1·6, 2·7, 3·8, 4·9, 5·10)와 시·군별로 정리했습니다. 오늘·이번 주말 열리는 장과 한 달 장날 달력을 확인하세요.`;
  const url = `${SITE_URL}/jangnal/${region.slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { images: [OG_IMAGE], title, description, url, type: "website", locale: "ko_KR" },
  };
}

export default async function RegionPage({ params }: RegionPageProps) {
  const catalog = await loadCatalog();
  const region = findLaunchRegion(catalog, (await params).region);
  if (!region) notFound();

  const guide = catalog.getRegionGuide(region);
  const markets = catalog.getRegionMarkets(region.slug);
  const links = markets.map(catalog.toMarketLink);
  const linkById = new Map(links.map((link) => [link.id, link]));
  const groups = groupByDistrict(markets).map(({ district, markets: items }) => ({
    label: district,
    markets: items.map((market) => linkById.get(market.id)!),
  }));
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${region.shortName} 장날`,
    numberOfItems: markets.length,
    itemListElement: markets.map((market, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: market.name,
      ...(linkById.get(market.id)!.reviewed ? { url: `${SITE_URL}${getMarketPagePath(market)}` } : {}),
    })),
  };
  const others = catalog.launchRegions().filter((other) => other.slug !== region.slug);

  return (
    <LandingShell crumbs={[["오늘 장날", "/"], ["장날", "/jangnal"]]} current={region.shortName}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <LandingHero title={`${region.shortName} 장날`} summary={`5일장 ${markets.length}곳의 오늘·이번 주말 장날이에요.`} />
      <DataBasis />
      <RegionToday markets={links} regionName={region.shortName} />
      <MarketGroups groups={groups} heading="시·군별 전체 목록" total={markets.length} showPattern />
      <section className={`${styles.sec} ${styles.prose}`} aria-labelledby="intro-heading">
        <h2 id="intro-heading">{region.shortName} 장날 소개</h2>
        {guide.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        <h3>눈여겨볼 장</h3>
        <ul>
          {guide.highlights.map(({ marketId, note }) => {
            const link = linkById.get(marketId)!;
            return <li key={marketId}>{link.reviewed ? <a href={link.href}><b>{link.name}</b></a> : <MapLinkButton href={link.href}><b>{link.name}</b></MapLinkButton>} ({link.district}) · {note}</li>;
          })}
        </ul>
        <h3>방문 팁</h3>
        <ul>{guide.visitTips.map((tip) => <li key={tip}>{tip}</li>)}</ul>
        <p className={styles.byline}>
          출처: {guide.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.name}</a>)}
          <br />자료 기준일 {guide.basisDate}
        </p>
      </section>
      <Faq items={[
        [`${region.shortName}에서 오늘 열리는 장은 어떻게 찾나요?`, `날짜 끝자리로 정해져요. 끝자리가 4나 9인 날은 4·9일장, 5나 0인 날은 5·10일장이 열려요. 위 '오늘 열리는 장'에 오늘 날짜 기준 ${region.shortName} 장을 모아 뒀어요.`],
        ["장날이 31일이면?", "31일은 끝자리가 1이라 1·6일장이 열려요. 일부 1·6일장은 31일에 열고 다음 날 1일은 쉬어요. 시장마다 달라서 상세 페이지에서 확인해 주세요."],
        ["장날이 아닌 날엔 시장이 닫나요?", "5일장이 없는 날이 시장 전체의 휴무는 아니에요. 상설장을 겸하는 시장은 점포가 열 수 있지만, 점포별 영업 여부는 자료로 확인하지 못했어요."],
      ]} />
      <section className={styles.sec} aria-labelledby="links-heading">
        <h2 id="links-heading">더 찾아보기</h2>
        <div className={styles.stack}>
          <MapLinkButton className={styles.primary} href={`/?when=all&q=${encodeURIComponent((markets[0].roadAddress ?? markets[0].lotAddress ?? "").split(/\s+/)[0])}`} data-umami-event="region-map-open">지도에서 {region.shortName} 보기</MapLinkButton>
        </div>
        {others.length > 0 ? (
          <>
            <p className={styles.note}><b>다른 시·도</b></p>
            <div className={styles.chips}>
              {others.map((other) => <a key={other.slug} className={styles.chip} href={`/jangnal/${other.slug}`}>{other.shortName} 장날<small>{catalog.getRegionMarkets(other.slug).length}곳</small></a>)}
            </div>
          </>
        ) : null}
        <p className={styles.note}><b>끝자리별 장날</b></p>
        <div className={styles.stack}>
          {DAY_PATTERNS.map((pattern) => <LinkRow key={pattern} href={`/jangnal/days/${pattern}`} name={<PatternTag pattern={pattern} />} count={`${formatPatternLabel(pattern)} 전국 목록`} />)}
        </div>
      </section>
    </LandingShell>
  );
}
