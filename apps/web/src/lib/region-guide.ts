import { DAY_PATTERNS, formatPatternLabel, getPatternOf, type DayPattern } from "./jangnal-dates";
import type { PublicMarket } from "./market";
import { getMarketDistrict, type Region } from "./region";

// 지역 페이지 글은 저장하지 않고 그 시·도의 정기 장날 시장 데이터로 만든다 (스키마 문서 2-1).

export interface RegionGuide {
  paragraphs: string[];
  highlights: { marketId: string; note: string }[];
  visitTips: string[];
  sources: { name: string; url: string }[];
  basisDate: string;
}

const MIN_PATTERNS_FOR_TOUR = 4;

const koreanOrder = (a: string, b: string): number => a.localeCompare(b, "ko-KR");
const hasFinalConsonant = (word: string): boolean => {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  return code >= 0 && code <= 11171 && code % 28 !== 0;
};
const subject = (word: string): string => `${word}${hasFinalConsonant(word) ? "이" : "가"}`;
const formatKoreanDate = (value: string): string => {
  const [year, month, day] = value.split("-").map(Number);
  return `${year}년 ${month}월 ${day}일`;
};
const formatKoreanMonth = (value: string): string => {
  const [year, month] = value.split("-").map(Number);
  return `${year}년 ${month}월`;
};

/** 가장 큰 값, 같으면 이름순으로 앞선 것. */
function pickTop<T>(entries: [T, number][], name: (key: T) => string, direction: 1 | -1 = 1): [T, number] {
  return [...entries].sort(([a, x], [b, y]) => direction * (y - x) || koreanOrder(name(a), name(b)))[0];
}

function countBy<T>(items: readonly T[], key: (item: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) groups.set(key(item), [...(groups.get(key(item)) ?? []), item]);
  return groups;
}

export function buildRegionGuide(region: Region, markets: readonly PublicMarket[]): RegionGuide {
  const total = markets.length;
  const byDistrict = countBy(markets, getMarketDistrict);
  const [topDistrict, topDistrictCount] = pickTop([...byDistrict].map(([district, items]) => [district, items.length]), String);
  const permanentCount = markets.filter((market) => market.marketType.includes("상설장")).length;

  const patternCounts = DAY_PATTERNS.map((pattern): [DayPattern, number] => [
    pattern,
    markets.filter((market) => getPatternOf(market) === pattern).length,
  ]);
  const patternOrder = (pattern: DayPattern) => String(DAY_PATTERNS.indexOf(pattern));
  const [mostPattern, mostPatternCount] = pickTop(patternCounts, patternOrder);
  const [fewestPattern, fewestPatternCount] = pickTop(patternCounts, patternOrder, -1);
  // 끝자리 종류가 같으면 시장이 더 많은 시·군을 고른다.
  const [tourDistrict, tourPatterns] = [...byDistrict]
    .map(([district, items]) => [district, new Set(items.map(getPatternOf)).size, items.length] as const)
    .sort(([a, x, m], [b, y, n]) => y - x || n - m || koreanOrder(a, b))[0];

  const first = [
    `${region.shortName}에는 이 사이트 기준으로 날짜 끝자리에 맞춰 장이 서는 정기 장날 시장이 ${total}곳 있어요.`,
    `${byDistrict.size}개 시·군에 흩어져 있고, ${subject(topDistrict)} ${topDistrictCount}곳으로 가장 많아요.`,
    permanentCount === total
      ? `${total}곳 모두 공공데이터에 상설장으로도 등록된 시장이에요.`
      : `${total}곳 중 ${permanentCount}곳은 공공데이터에 상설장으로도 등록된 시장이에요.`,
  ];
  const second = [
    `끝자리별로는 ${formatPatternLabel(mostPattern)}이 ${mostPatternCount}곳으로 가장 많고, ${formatPatternLabel(fewestPattern)}이 ${fewestPatternCount}곳으로 가장 적어요.`,
    `그래서 어느 날 찾아가도 ${region.shortName} 어딘가에는 장이 서지만, 열리는 장의 수는 날짜마다 달라요.`,
    ...(tourPatterns >= MIN_PATTERNS_FOR_TOUR
      ? [`${tourDistrict}에는 끝자리가 다른 장이 ${tourPatterns}가지라, 같은 시·군 안에서도 날짜를 바꿔 가며 여러 장을 둘러볼 수 있어요.`]
      : []),
  ];

  const highlights = [...markets]
    .sort((a, b) => (b.onnuri?.totalCount ?? -1) - (a.onnuri?.totalCount ?? -1) || koreanOrder(a.name, b.name))
    .slice(0, 3)
    .map((market) => ({
      marketId: market.id,
      note: [
        getPatternOf(market) ? formatPatternLabel(getPatternOf(market)!) : null,
        `공공데이터 시장 유형 ${market.marketType}`,
        market.onnuri
          ? `온누리상품권 가맹점 ${market.onnuri.totalCount.toLocaleString("ko-KR")}곳(${formatKoreanMonth(market.onnuri.referenceDate)} 기준)`
          : null,
      ].filter(Boolean).join(", "),
    }));

  const basisDate = markets.map((market) => market.referenceDate ?? "").sort().at(-1) ?? "";
  const parkingCount = markets.filter((market) => market.hasParking === true).length;
  const onnuriSource = markets.find((market) => market.onnuri)?.onnuri?.source;

  return {
    paragraphs: [first.join(" "), second.join(" ")],
    highlights,
    visitTips: [
      `${total}곳 중 ${parkingCount}곳은 공공데이터에 주차장이 있다고 나와요. 주차 정보가 없거나 '주차 없음'인 시장은 대중교통이나 주변 공영주차장을 미리 알아보세요.`,
      `장날은 날짜 끝자리로 정해지지만 명절이나 날씨, 지역 사정으로 쉬거나 옮길 수 있어요. 자료 기준일이 ${formatKoreanDate(basisDate)}이라 가기 전에 시장이나 시·군청에 확인해 주세요.`,
    ],
    sources: [
      ...(markets[0] ? [{ name: markets[0].source.name, url: markets[0].source.url }] : []),
      ...(onnuriSource ? [onnuriSource] : []),
    ],
    basisDate,
  };
}
