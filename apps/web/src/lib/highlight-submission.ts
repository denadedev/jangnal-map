import { HIGHLIGHT_CATEGORY_LABELS, type HighlightCategoryCode } from "../db/codes";

export const HIGHLIGHT_NAME_MAX = 30;
export const HIGHLIGHT_DESCRIPTION_MAX = 100;

export interface HighlightSubmissionInput {
  name: string;
  description: string | null;
  category: HighlightCategoryCode;
}

const tidy = (value: unknown): string => typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";

export const isHighlightCategory = (value: unknown): value is HighlightCategoryCode =>
  typeof value === "string" && Object.prototype.hasOwnProperty.call(HIGHLIGHT_CATEGORY_LABELS, value);

/** 앞뒤·연속 공백을 정리하고 길이와 카테고리를 검사한다. 틀리면 null. */
export function parseHighlightSubmission(body: Record<string, unknown>): HighlightSubmissionInput | null {
  const name = tidy(body.name);
  const description = tidy(body.description);
  if (!name || [...name].length > HIGHLIGHT_NAME_MAX) return null;
  if ([...description].length > HIGHLIGHT_DESCRIPTION_MAX) return null;
  if (!isHighlightCategory(body.category)) return null;
  return { name, description: description || null, category: body.category };
}

/** 중복 비교용. 공백을 모두 뺀다. */
export const highlightNameKey = (name: string): string => name.replace(/\s+/g, "");
