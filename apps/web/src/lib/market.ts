export interface MarketSchedule {
  kind: "digit-pair";
  days: [number, number];
}

export interface PublicMarket {
  id: string;
  name: string;
  marketType: string;
  roadAddress: string | null;
  lotAddress: string | null;
  latitude: number;
  longitude: number;
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
