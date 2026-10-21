import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  doublePrecision,
  foreignKey,
  index,
  integer,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

// 모든 테이블 공통 컬럼. updated_at은 DB 트리거 없이 ORM이 수정할 때 갱신한다.
const base = {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
};

const position = () => smallint("position").notNull();

export const sources = pgTable("sources", {
  ...base,
  name: text("name").notNull(),
  url: text("url").notNull().unique(),
}, (t) => [check("sources_url_https", sql`${t.url} like 'https://%'`)]);

export const marketDistricts = pgTable("market_districts", {
  ...base,
  regionCode: text("region_code").notNull(),
  name: text("name").notNull(),
}, (t) => [unique("market_districts_region_code_name_key").on(t.regionCode, t.name)]);

export const markets = pgTable("markets", {
  ...base,
  legacyId: text("legacy_id").unique(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  marketType: text("market_type").notNull(),
  districtId: uuid("district_id").notNull().references(() => marketDistricts.id),
  roadAddress: text("road_address"),
  lotAddress: text("lot_address"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  phone: text("phone"),
  hasParking: boolean("has_parking"),
  status: text("status").notNull(),
  statusVerified: boolean("status_verified").notNull().default(false),
  sourceId: uuid("source_id").notNull().references(() => sources.id),
  referenceDate: date("reference_date"),
}, (t) => [
  index("markets_district_id_idx").on(t.districtId),
  check("markets_address_present", sql`${t.roadAddress} is not null or ${t.lotAddress} is not null`),
  check("markets_coordinates_pair", sql`(${t.latitude} is null) = (${t.longitude} is null)`),
  check("markets_coordinates_range", sql`${t.latitude} between -90 and 90 and ${t.longitude} between -180 and 180`),
]);

export const marketSchedules = pgTable("market_schedules", {
  ...base,
  marketId: uuid("market_id").notNull().unique().references(() => markets.id, { onDelete: "cascade" }),
  raw: text("raw").notNull().default(""),
  kind: text("kind").notNull(),
  skipsFirstAfter31st: boolean("skips_first_after_31st").notNull().default(false),
  sourceId: uuid("source_id").references(() => sources.id),
  checkedAt: date("checked_at"),
}, (t) => [
  index("market_schedules_kind_idx").on(t.kind),
  check("market_schedules_source_checked_pair", sql`(${t.sourceId} is null) = (${t.checkedAt} is null)`),
]);

export const marketScheduleDays = pgTable("market_schedule_days", {
  ...base,
  scheduleId: uuid("schedule_id").notNull().references(() => marketSchedules.id, { onDelete: "cascade" }),
  dayDigit: smallint("day_digit").notNull(),
}, (t) => [
  unique("market_schedule_days_schedule_id_day_digit_key").on(t.scheduleId, t.dayDigit),
  index("market_schedule_days_day_digit_idx").on(t.dayDigit),
  check("market_schedule_days_day_digit_range", sql`${t.dayDigit} between 0 and 9`),
]);

export const marketOnnuriMerchantStats = pgTable("market_onnuri_merchant_stats", {
  ...base,
  marketId: uuid("market_id").notNull().unique().references(() => markets.id, { onDelete: "cascade" }),
  totalCount: integer("total_count").notNull(),
  digitalCount: integer("digital_count").notNull(),
  paperCount: integer("paper_count").notNull(),
  referenceDate: date("reference_date").notNull(),
  sourceId: uuid("source_id").notNull().references(() => sources.id),
}, (t) => [
  check("market_onnuri_merchant_stats_total_count_range", sql`${t.totalCount} >= 0`),
  check("market_onnuri_merchant_stats_digital_count_range", sql`${t.digitalCount} between 0 and ${t.totalCount}`),
  check("market_onnuri_merchant_stats_paper_count_range", sql`${t.paperCount} between 0 and ${t.totalCount}`),
]);

export const marketGuides = pgTable("market_guides", {
  ...base,
  marketId: uuid("market_id").notNull().unique().references(() => markets.id, { onDelete: "cascade" }),
  summary: text("summary").notNull(),
  transportation: text("transportation").notNull(),
  parking: text("parking").notNull(),
  status: text("status").notNull().default("reviewed"),
  reviewedAt: date("reviewed_at").notNull(),
});

export const marketGuideTips = pgTable("market_guide_tips", {
  ...base,
  guideId: uuid("guide_id").notNull().references(() => marketGuides.id, { onDelete: "cascade" }),
  position: position(),
  body: text("body").notNull(),
}, (t) => [
  unique("market_guide_tips_guide_id_position_key").on(t.guideId, t.position),
  check("market_guide_tips_position_range", sql`${t.position} >= 0`),
  check("market_guide_tips_body_present", sql`btrim(${t.body}) <> ''`),
]);

export const marketGuideSources = pgTable("market_guide_sources", {
  ...base,
  guideId: uuid("guide_id").notNull().references(() => marketGuides.id, { onDelete: "cascade" }),
  sourceId: uuid("source_id").notNull().references(() => sources.id),
  checkedAt: date("checked_at").notNull(),
  position: position(),
}, (t) => [
  unique("market_guide_sources_guide_id_source_id_key").on(t.guideId, t.sourceId),
  unique("market_guide_sources_guide_id_position_key").on(t.guideId, t.position),
  check("market_guide_sources_position_range", sql`${t.position} >= 0`),
]);

export const marketHighlights = pgTable("market_highlights", {
  ...base,
  marketId: uuid("market_id").notNull().references(() => markets.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  origin: text("origin").notNull().default("editorial"),
}, (t) => [
  unique("market_highlights_market_id_name_key").on(t.marketId, t.name),
  check("market_highlights_description_length", sql`char_length(${t.description}) <= 100`),
]);

export const marketHighlightSubmissions = pgTable("market_highlight_submissions", {
  ...base,
  marketId: uuid("market_id").notNull().references(() => markets.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  status: text("status").notNull().default("pending"),
  decidedAt: timestamp("decided_at", { withTimezone: true }),
  decidedBy: text("decided_by"),
  highlightId: uuid("highlight_id").unique(),
}, (t) => [
  // 기본 이름은 63자를 넘어 PostgreSQL이 잘라 버려서 직접 짓는다.
  foreignKey({ name: "market_highlight_submissions_highlight_id_fk", columns: [t.highlightId], foreignColumns: [marketHighlights.id] }).onDelete("set null"),
  index("market_highlight_submissions_market_id_idx").on(t.marketId),
  index("market_highlight_submissions_status_created_at_idx").on(t.status, t.createdAt),
  check("market_highlight_submissions_name_length", sql`char_length(${t.name}) between 1 and 30`),
  check("market_highlight_submissions_description_length", sql`char_length(${t.description}) <= 100`),
  check("market_highlight_submissions_decided_pair", sql`(${t.decidedAt} is null) = (${t.decidedBy} is null)`),
]);

export const marketNearby = pgTable("market_nearby", {
  ...base,
  marketId: uuid("market_id").notNull().references(() => markets.id, { onDelete: "cascade" }),
  nearbyMarketId: uuid("nearby_market_id").notNull().references(() => markets.id, { onDelete: "cascade" }),
  position: position(),
}, (t) => [
  unique("market_nearby_market_id_nearby_market_id_key").on(t.marketId, t.nearbyMarketId),
  unique("market_nearby_market_id_position_key").on(t.marketId, t.position),
  index("market_nearby_nearby_market_id_idx").on(t.nearbyMarketId),
  check("market_nearby_not_self", sql`${t.marketId} <> ${t.nearbyMarketId}`),
  check("market_nearby_position_range", sql`${t.position} >= 0`),
]);

export const tableNames = [
  "sources",
  "market_districts",
  "markets",
  "market_schedules",
  "market_schedule_days",
  "market_onnuri_merchant_stats",
  "market_guides",
  "market_guide_tips",
  "market_guide_sources",
  "market_highlights",
  "market_highlight_submissions",
  "market_nearby",
] as const;
