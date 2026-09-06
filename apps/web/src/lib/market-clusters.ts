import type { PublicMarket } from "./market";

export interface CoordinateBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export type MapItem =
  | { kind: "market"; market: LocatedMarket }
  | { kind: "cluster"; id: string; latitude: number; longitude: number; count: number };

export type LocatedMarket = PublicMarket & { latitude: number; longitude: number };

const isLocated = (market: PublicMarket): market is LocatedMarket =>
  market.latitude !== null && market.longitude !== null;

const isInBounds = (market: LocatedMarket, bounds: CoordinateBounds): boolean =>
  market.latitude >= bounds.south
  && market.latitude <= bounds.north
  && market.longitude >= bounds.west
  && market.longitude <= bounds.east;

const gridSizeForZoom = (zoom: number): number => {
  if (zoom <= 6) return 2.5;
  if (zoom === 7) return 2;
  if (zoom === 8) return 1;
  if (zoom === 9) return 0.5;
  return 0.2;
};

export function buildMapItems(
  markets: PublicMarket[],
  zoom: number,
  bounds: CoordinateBounds,
): MapItem[] {
  const visibleMarkets = markets.filter(isLocated).filter((market) => isInBounds(market, bounds));
  if (zoom >= 11) return visibleMarkets.map((market) => ({ kind: "market", market }));

  const gridSize = gridSizeForZoom(zoom);
  const groups = new Map<string, LocatedMarket[]>();
  for (const market of visibleMarkets) {
    const key = `${Math.floor(market.latitude / gridSize)}:${Math.floor(market.longitude / gridSize)}`;
    groups.set(key, [...(groups.get(key) ?? []), market]);
  }

  return [...groups.entries()].map(([key, group]) => {
    const onlyMarket = group[0];
    if (group.length === 1 && onlyMarket) return { kind: "market" as const, market: onlyMarket };
    const latitude = group.reduce((sum, market) => sum + market.latitude, 0) / group.length;
    const longitude = group.reduce((sum, market) => sum + market.longitude, 0) / group.length;
    return { kind: "cluster" as const, id: `cluster-${zoom}-${key}`, latitude, longitude, count: group.length };
  });
}
