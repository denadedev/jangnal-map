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

/** 장 이야기 목록의 "3일 전". 한 달이 넘으면 "9/28"처럼 날짜로 쓴다. */
export function formatStoryAge(createdAt: string, now: Date): string {
  const minutes = Math.max(0, Math.floor((now.getTime() - Date.parse(createdAt)) / 60_000));
  if (minutes < 60) return "방금";
  if (minutes < 24 * 60) return `${Math.floor(minutes / 60)}시간 전`;
  const days = Math.floor(minutes / (24 * 60));
  if (days <= 30) return `${days}일 전`;
  const date = new Date(createdAt);
  const korea = new Date(date.getTime() + 9 * 60 * 60_000);
  return `${korea.getUTCMonth() + 1}/${korea.getUTCDate()}`;
}
