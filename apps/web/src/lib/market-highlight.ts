import type { HighlightCategoryCode } from "../db/codes";

/** 승인된 방문자 제보 한 항목. marketId는 화면이 쓰는 시장 id다. */
export interface MarketHighlight {
  marketId: string;
  name: string;
  description: string | null;
  category: HighlightCategoryCode;
  /** 승인되어 공개된 시각(ISO). */
  createdAt: string;
}
