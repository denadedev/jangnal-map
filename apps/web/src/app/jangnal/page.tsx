import type { Metadata } from "next";

import { PatternTag } from "../../components/jangnal-market-row";
import { DataBasis, Faq, LandingHero, LandingShell, LinkRow, landingStyles as styles } from "../../components/jangnal-page-parts";
import { HubToday } from "../../components/jangnal-today";
import { DAY_PATTERNS, getPatternMarkets, getRegionMarkets, launchRegions, periodicMarkets, toMarketLink } from "../../lib/jangnal-landing";
import { SITE_URL } from "../../lib/market-seo";

const title = "전국 장날 · 오늘 열리는 5일장 | 오늘 장날";
const description = `전국 5일장 ${periodicMarkets.length}곳을 시·도별, 날짜 끝자리별로 정리했습니다. 오늘과 이번 주말 열리는 장날을 확인하세요.`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/jangnal` },
  openGraph: { title, description, url: `${SITE_URL}/jangnal`, type: "website", locale: "ko_KR" },
};

export default function JangnalHubPage() {
  const regions = launchRegions();

  return (
    <LandingShell crumbs={[["오늘 장날", "/"]]} current="장날">
      <LandingHero title="전국 장날" summary="오늘 열리는 5일장과 시·도별, 끝자리별 장날을 한곳에 모았어요." />
      <DataBasis />
      <HubToday markets={periodicMarkets.map(toMarketLink)} />
      {regions.length > 0 ? (
        <section className={styles.sec} aria-labelledby="regions-heading">
          <div className={styles.secHead}><h2 id="regions-heading">시·도별 장날</h2><span className={styles.count}>{regions.length}곳</span></div>
          <p className={styles.sub}>5일장이 많은 순서예요. 그 밖의 시·도는 지도에서 찾아보세요.</p>
          <div className={styles.stack}>
            {[...regions]
              .sort((a, b) => getRegionMarkets(b.slug).length - getRegionMarkets(a.slug).length)
              .map((region) => <LinkRow key={region.slug} href={`/jangnal/${region.slug}`} name={`${region.shortName} 장날`} count={`${getRegionMarkets(region.slug).length}곳`} />)}
          </div>
        </section>
      ) : null}
      <section className={styles.sec} aria-labelledby="patterns-heading">
        <h2 id="patterns-heading">끝자리별 장날</h2>
        <div className={styles.stack}>
          {DAY_PATTERNS.map((pattern) => <LinkRow key={pattern} href={`/jangnal/days/${pattern}`} name={<PatternTag pattern={pattern} />} count={`${getPatternMarkets(pattern).length}곳`} />)}
        </div>
      </section>
      <Faq items={[
        ["5일장이 뭐예요?", "닷새마다 돌아오는 날짜에 열리는 장이에요. 날짜 끝자리가 1·6, 2·7, 3·8, 4·9, 5·10인 날로 나뉘어요."],
        ["오늘 장날은 어디에서 열려요?", "오늘 날짜의 끝자리에 맞는 장이 열려요. 위 '오늘 열리는 장'에서 끝자리와 전국 개수를 확인하고, 시·도 페이지에서 가까운 장을 찾아보세요."],
        ["정보는 얼마나 최신이에요?", "공공데이터 기준일은 2025년 11월 10일이에요. 현장에서 마지막으로 확인한 날이 아니니, 가기 전에 시장에 확인해 주세요."],
      ]} />
      <section className={styles.sec} aria-labelledby="map-heading">
        <h2 id="map-heading">지도로 찾기</h2>
        <div className={styles.stack}>
          <a className={styles.primary} href="/?when=today" data-umami-event="region-map-open">지도에서 오늘 열리는 장 보기</a>
        </div>
      </section>
    </LandingShell>
  );
}
