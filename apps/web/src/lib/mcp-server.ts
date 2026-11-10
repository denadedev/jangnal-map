import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import type { Catalog } from "./catalog/catalog";
import { HIGHLIGHT_CATEGORY_LABELS } from "../db/codes";
import type { PublicMarket } from "./market";
import { getMarketBrowsePath } from "./market-path";
import { getMarketDistrict, getMarketRegion, REGIONS } from "./region";
import { resolveRegionAlias } from "./region-aliases";
import { getKoreaCalendarDate } from "./korea-date";
import { getMarketDates, getNextMarketDate } from "./schedule";
import { filterMarkets, formatScheduleDates, getDistanceKm, toIsoDate } from "./market-view";
import { SITE_URL } from "./site-config";

const MAX_RESULTS = 50;

// AI 답에서 넘어온 방문을 Umami에서 따로 셀 수 있게 붙인다.
function marketUrl(catalog: Catalog, market: PublicMarket): string {
  const url = new URL(getMarketBrowsePath(market, catalog.reviewedMarketIds.has(market.id)), SITE_URL);
  url.searchParams.set("utm_source", "mcp");
  return url.href;
}

function parseDate(value: string | undefined, now: Date): Date | null {
  if (!value) return getKoreaCalendarDate(now);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return toIsoDate(date) === value ? date : null;
}

// "충남", "충청남도", "Jeju" 같은 시·도 이름이면 주소 앞부분으로, 아니면 이름·주소 검색어로 쓴다.
function regionPrefixes(query: string): readonly string[] | null {
  const key = query.trim();
  const region = REGIONS.find((entry) => entry.shortName === key || entry.name === key);
  return region ? region.prefixes : resolveRegionAlias(key);
}

function scheduleText(market: PublicMarket): string {
  if (market.schedule.kind === "digit-pair") return `매월 ${formatScheduleDates(market)}`;
  if (market.schedule.kind === "daily") return "상설시장(매일)";
  return "일정 확인 필요";
}

function summarize(catalog: Catalog, market: PublicMarket) {
  return {
    id: market.id,
    name: market.name,
    region: getMarketRegion(market)?.shortName ?? null,
    district: getMarketDistrict(market) || null,
    address: market.roadAddress ?? market.lotAddress,
    schedule: scheduleText(market),
    url: marketUrl(catalog, market),
  };
}

export interface FindMarketsInput {
  date?: string;
  query?: string;
  latitude?: number;
  longitude?: number;
  includeDaily?: boolean;
  limit?: number;
}

export function findMarkets(catalog: Catalog, input: FindMarketsInput, now: Date) {
  const date = parseDate(input.date, now);
  if (!date) return { error: "date는 YYYY-MM-DD 형식이어야 합니다." };
  const query = input.query?.trim() ?? "";
  const open = filterMarkets(
    catalog.markets.filter((market) => market.status === "운영"),
    query,
    { start: date, end: date },
    { includeDaily: input.includeDaily ?? false, regionPrefixes: query ? regionPrefixes(query) : null },
  );
  const origin = input.latitude !== undefined && input.longitude !== undefined
    ? { latitude: input.latitude, longitude: input.longitude }
    : null;
  const withDistance = open.map((market) => ({
    market,
    distanceKm: origin && market.latitude !== null && market.longitude !== null
      ? getDistanceKm(origin, { latitude: market.latitude, longitude: market.longitude })
      : null,
  }));
  if (origin) withDistance.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
  const limit = Math.min(input.limit ?? 20, MAX_RESULTS);
  return {
    date: toIsoDate(date),
    total: open.length,
    markets: withDistance.slice(0, limit).map(({ market, distanceKm }) => ({
      ...summarize(catalog, market),
      ...(distanceKm !== null ? { distanceKm: Math.round(distanceKm * 10) / 10 } : {}),
    })),
  };
}

export function getMarket(catalog: Catalog, id: string, now: Date) {
  const market = catalog.findMarketById(id);
  if (!market) return { error: "시장을 찾지 못했습니다. find_markets 결과의 id를 쓰세요." };
  const today = getKoreaCalendarDate(now);
  const until = new Date(today);
  until.setDate(today.getDate() + 31);
  const nextDates = market.schedule.kind === "digit-pair"
    ? getMarketDates(market, { start: today, end: until }).slice(0, 4).map(toIsoDate)
    : [];
  const next = getNextMarketDate(market, today);
  return {
    ...summarize(catalog, market),
    marketType: market.marketType,
    status: market.status,
    nextMarketDates: nextDates.length > 0 ? nextDates : next ? [toIsoDate(next)] : [],
    hasParking: market.hasParking,
    phone: market.phone,
    latitude: market.latitude,
    longitude: market.longitude,
    visitorStories: catalog.findMarketHighlights(market.id).map((highlight) => ({
      category: HIGHLIGHT_CATEGORY_LABELS[highlight.category],
      name: highlight.name,
      description: highlight.description,
    })),
    source: market.source.name,
  };
}

const asText = (value: unknown) => {
  const isError = typeof value === "object" && value !== null && "error" in value;
  return { content: [{ type: "text" as const, text: JSON.stringify(value) }], ...(isError ? { isError: true } : {}) };
};

/** 장날맵 공개 MCP 서버. 읽기 전용이고, 요청마다 새로 만든다(무상태). */
export function createMcpServer(loadCatalog: () => Promise<Catalog>, now: () => Date = () => new Date()): McpServer {
  const server = new McpServer(
    { name: "jangnal-map", title: "장날맵", version: "1.0.0", websiteUrl: SITE_URL },
    {
      instructions: "장날맵(kmarketday.com)의 전국 전통시장·5일장 장날 데이터입니다. 날짜는 한국 시간 기준입니다. "
        + "답할 때 각 시장의 url을 함께 알려 주세요. 장날 정보는 공공데이터 기준이라 현지 사정으로 달라질 수 있습니다.",
    },
  );
  const readOnly = { readOnlyHint: true, openWorldHint: false };

  server.registerTool("find_markets", {
    title: "장 서는 시장 찾기",
    description: "특정 날짜(기본: 오늘, 한국 시간)에 장이 서는 전국 5일장을 찾습니다. "
      + "지역(예: 충남, 경기, 제주)이나 시·군·구·시장 이름(예: 예산, 광천)으로 좁히고, 위치를 주면 가까운 순으로 정렬합니다.",
    inputSchema: {
      date: z.string().optional().describe("YYYY-MM-DD. 비우면 오늘"),
      query: z.string().optional().describe("시·도 이름(충남, 경상북도, Jeju) 또는 시·군·구·시장 이름 검색어"),
      latitude: z.number().min(-90).max(90).optional().describe("가까운 순 정렬용 위도"),
      longitude: z.number().min(-180).max(180).optional().describe("가까운 순 정렬용 경도"),
      includeDaily: z.boolean().optional().describe("매일 여는 상설시장도 포함할지. 기본 false"),
      limit: z.number().int().min(1).max(MAX_RESULTS).optional().describe("최대 개수. 기본 20"),
    },
    annotations: readOnly,
  }, async (input) => asText(findMarkets(await loadCatalog(), input, now())));

  server.registerTool("get_market", {
    title: "시장 정보",
    description: "시장 한 곳의 주소, 장날 규칙, 다가오는 장날, 주차, 전화, 방문자가 알려 준 먹거리·특산물을 돌려줍니다.",
    inputSchema: { id: z.string().describe("find_markets 결과의 id") },
    annotations: readOnly,
  }, async ({ id }) => asText(getMarket(await loadCatalog(), id, now())));

  return server;
}
