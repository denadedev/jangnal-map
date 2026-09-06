export type MarketSchedule =
  | { kind: "daily" }
  | { kind: "digit-pair"; days: [number, number] }
  | { kind: "unknown"; raw: string };

export interface PublicMarket {
  id: string;
  name: string;
  marketType: string;
  roadAddress: string | null;
  lotAddress: string | null;
  latitude: number | null;
  longitude: number | null;
  scheduleRaw: string;
  schedule: MarketSchedule;
  phone: string | null;
  hasParking: boolean | null;
  referenceDate: string | null;
  status: "운영" | "폐장";
  statusVerified: boolean;
  source: {
    name: string;
    url: string;
    referenceDate: string | null;
  };
}
