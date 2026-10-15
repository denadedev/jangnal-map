import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PatternTag } from "../../../../components/jangnal-market-row";
import { DataBasis, Faq, LandingHero, LandingShell, LinkRow, MarketGroups, landingStyles as styles } from "../../../../components/jangnal-page-parts";
import { PatternDates } from "../../../../components/jangnal-today";
import {
  DAY_PATTERNS,
  findDayPattern,
  formatPatternLabel,
  getPatternMarkets,
  getPatternDays,
  getRegionMarkets,
  groupByRegion,
  launchRegions,
  toMarketLink,
  type DayPattern,
} from "../../../../lib/jangnal-landing";
import { SITE_URL } from "../../../../lib/market-seo";
import { formatScheduleDates } from "../../../../lib/market-view";

export const dynamicParams = false;

type PatternPageProps = { params: Promise<{ pattern: string }> };


export function generateStaticParams() {
  return DAY_PATTERNS.map((pattern) => ({ pattern }));
}

export async function generateMetadata({ params }: PatternPageProps): Promise<Metadata> {
  const pattern = findDayPattern((await params).pattern);
  if (!pattern) return { robots: { index: false, follow: false } };

  const label = formatPatternLabel(pattern);
  const count = getPatternMarkets(pattern).length;
  const title = `${label} 장날 · 전국 5일장 ${count}곳 | 오늘 장날`;
  const description = `날짜 끝자리가 ${pattern.replace("-", "·")}인 날 열리는 전국 ${label} ${count}곳을 시·도별로 정리했습니다. 다음 장날 날짜를 확인하세요.`;
  const url = `${SITE_URL}/jangnal/days/${pattern}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website", locale: "ko_KR" },
  };
}

export default async function PatternPage({ params }: PatternPageProps) {
  const pattern = findDayPattern((await params).pattern);
  if (!pattern) notFound();

  const label = formatPatternLabel(pattern);
  const [first, second] = pattern.split("-");
  const markets = getPatternMarkets(pattern);
  const groups = groupByRegion(markets).map(({ region, markets: items }) => ({ label: region.shortName, markets: items.map(toMarketLink) }));
  const dates = formatScheduleDates({ schedule: { kind: "digit-pair", days: getPatternDays(pattern) } });
  const faq: [string, string][] = [
    [`${label}은 한 달에 몇 번 열리나요?`, `매월 ${dates}에 열려요. 대개 여섯 번이고, 2월처럼 짧은 달에는 다섯 번일 수 있어요.`],
    [`오늘 ${label}이 열리나요?`, `오늘 날짜의 끝자리가 ${first}나 ${second === "10" ? "0" : second}이면 열려요. 위 '다음 장날'에 오늘 기준 날짜를 계산해 두었어요.`],
  ];
  if (pattern === "1-6") {
    faq.push(["31일에도 열리나요?", "31일은 끝자리가 1이라 1·6일장이 열려요. 일부 시장은 31일에 열고 다음 날 1일은 쉬어요. 시장마다 달라서 상세 페이지에서 확인해 주세요."]);
  }

  return (
    <LandingShell crumbs={[["오늘 장날", "/"], ["장날", "/jangnal"]]} current={label}>
      <LandingHero title={`${label} 장날`} summary={`날짜 끝자리가 ${first}와 ${second === "10" ? "0" : second}인 날 열리는 전국 5일장 ${markets.length}곳이에요. 매월 ${dates}에 열려요.`} />
      <DataBasis />
      <PatternDates pattern={pattern} />
      <MarketGroups groups={groups} heading={`시·도별 ${label}`} total={markets.length} showPattern={false} />
      <Faq items={faq} />
      <section className={styles.sec} aria-labelledby="links-heading">
        <h2 id="links-heading">더 찾아보기</h2>
        <p className={styles.note}><b>다른 끝자리</b></p>
        <div className={styles.stack}>
          {DAY_PATTERNS.filter((other) => other !== pattern).map((other) => (
            <LinkRow key={other} href={`/jangnal/days/${other}`} name={<PatternTag pattern={other} />} count={`${getPatternMarkets(other).length}곳`} />
          ))}
        </div>
        <p className={styles.note}><b>시·도별 장날</b></p>
        <div className={styles.chips}>
          {launchRegions().map((region) => <a key={region.slug} className={styles.chip} href={`/jangnal/${region.slug}`}>{region.shortName}<small>{getRegionMarkets(region.slug).length}곳</small></a>)}
        </div>
      </section>
    </LandingShell>
  );
}
