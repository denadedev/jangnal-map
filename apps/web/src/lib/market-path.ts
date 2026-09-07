import type { PublicMarket } from "./market";

const normalizeSlugPart = (value: string): string => value
  .normalize("NFKC")
  .trim()
  .replace(/[^0-9A-Za-z가-힣]+/g, "-")
  .replace(/^-+|-+$/g, "")
  .toLocaleLowerCase("ko-KR");

export function createMarketSlug(market: PublicMarket): string {
  const idSuffix = market.id.replace(/^market-/, "").slice(0, 8);
  return `${normalizeSlugPart(market.name)}-${idSuffix}`;
}

export function getMarketPagePath(market: PublicMarket): string {
  return `/markets/${createMarketSlug(market)}`;
}
