import marketData from "../../data/markets.json";

import type { PublicMarket } from "./market";

export const publicMarkets = marketData as unknown as PublicMarket[];
