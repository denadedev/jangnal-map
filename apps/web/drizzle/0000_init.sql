CREATE TABLE "market_districts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"region_code" text NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "market_districts_region_code_name_key" UNIQUE("region_code","name")
);
--> statement-breakpoint
CREATE TABLE "market_guide_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"guide_id" uuid NOT NULL,
	"source_id" uuid NOT NULL,
	"checked_at" date NOT NULL,
	"position" smallint NOT NULL,
	CONSTRAINT "market_guide_sources_guide_id_source_id_key" UNIQUE("guide_id","source_id"),
	CONSTRAINT "market_guide_sources_guide_id_position_key" UNIQUE("guide_id","position"),
	CONSTRAINT "market_guide_sources_position_range" CHECK ("market_guide_sources"."position" >= 0)
);
--> statement-breakpoint
CREATE TABLE "market_guide_tips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"guide_id" uuid NOT NULL,
	"position" smallint NOT NULL,
	"body" text NOT NULL,
	CONSTRAINT "market_guide_tips_guide_id_position_key" UNIQUE("guide_id","position"),
	CONSTRAINT "market_guide_tips_position_range" CHECK ("market_guide_tips"."position" >= 0),
	CONSTRAINT "market_guide_tips_body_present" CHECK (btrim("market_guide_tips"."body") <> '')
);
--> statement-breakpoint
CREATE TABLE "market_guides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"market_id" uuid NOT NULL,
	"summary" text NOT NULL,
	"transportation" text NOT NULL,
	"parking" text NOT NULL,
	"status" text DEFAULT 'reviewed' NOT NULL,
	"reviewed_at" date NOT NULL,
	CONSTRAINT "market_guides_market_id_unique" UNIQUE("market_id")
);
--> statement-breakpoint
CREATE TABLE "market_nearby" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"market_id" uuid NOT NULL,
	"nearby_market_id" uuid NOT NULL,
	"position" smallint NOT NULL,
	CONSTRAINT "market_nearby_market_id_nearby_market_id_key" UNIQUE("market_id","nearby_market_id"),
	CONSTRAINT "market_nearby_market_id_position_key" UNIQUE("market_id","position"),
	CONSTRAINT "market_nearby_not_self" CHECK ("market_nearby"."market_id" <> "market_nearby"."nearby_market_id"),
	CONSTRAINT "market_nearby_position_range" CHECK ("market_nearby"."position" >= 0)
);
--> statement-breakpoint
CREATE TABLE "market_onnuri_merchant_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"market_id" uuid NOT NULL,
	"total_count" integer NOT NULL,
	"digital_count" integer NOT NULL,
	"paper_count" integer NOT NULL,
	"reference_date" date NOT NULL,
	"source_id" uuid NOT NULL,
	CONSTRAINT "market_onnuri_merchant_stats_market_id_unique" UNIQUE("market_id"),
	CONSTRAINT "market_onnuri_merchant_stats_total_count_range" CHECK ("market_onnuri_merchant_stats"."total_count" >= 0),
	CONSTRAINT "market_onnuri_merchant_stats_digital_count_range" CHECK ("market_onnuri_merchant_stats"."digital_count" between 0 and "market_onnuri_merchant_stats"."total_count"),
	CONSTRAINT "market_onnuri_merchant_stats_paper_count_range" CHECK ("market_onnuri_merchant_stats"."paper_count" between 0 and "market_onnuri_merchant_stats"."total_count")
);
--> statement-breakpoint
CREATE TABLE "market_schedule_days" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"schedule_id" uuid NOT NULL,
	"day_digit" smallint NOT NULL,
	CONSTRAINT "market_schedule_days_schedule_id_day_digit_key" UNIQUE("schedule_id","day_digit"),
	CONSTRAINT "market_schedule_days_day_digit_range" CHECK ("market_schedule_days"."day_digit" between 0 and 9)
);
--> statement-breakpoint
CREATE TABLE "market_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"market_id" uuid NOT NULL,
	"raw" text DEFAULT '' NOT NULL,
	"kind" text NOT NULL,
	"skips_first_after_31st" boolean DEFAULT false NOT NULL,
	"source_id" uuid,
	"checked_at" date,
	CONSTRAINT "market_schedules_market_id_unique" UNIQUE("market_id"),
	CONSTRAINT "market_schedules_source_checked_pair" CHECK (("market_schedules"."source_id" is null) = ("market_schedules"."checked_at" is null))
);
--> statement-breakpoint
CREATE TABLE "market_specialties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"market_id" uuid NOT NULL,
	"name" text NOT NULL,
	"position" smallint NOT NULL,
	"origin" text DEFAULT 'editorial' NOT NULL,
	CONSTRAINT "market_specialties_market_id_name_key" UNIQUE("market_id","name"),
	CONSTRAINT "market_specialties_market_id_position_key" UNIQUE("market_id","position"),
	CONSTRAINT "market_specialties_position_range" CHECK ("market_specialties"."position" >= 0)
);
--> statement-breakpoint
CREATE TABLE "markets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"legacy_id" text,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"market_type" text NOT NULL,
	"district_id" uuid NOT NULL,
	"road_address" text,
	"lot_address" text,
	"latitude" double precision,
	"longitude" double precision,
	"phone" text,
	"has_parking" boolean,
	"status" text NOT NULL,
	"status_verified" boolean DEFAULT false NOT NULL,
	"source_id" uuid NOT NULL,
	"reference_date" date,
	CONSTRAINT "markets_legacy_id_unique" UNIQUE("legacy_id"),
	CONSTRAINT "markets_slug_unique" UNIQUE("slug"),
	CONSTRAINT "markets_address_present" CHECK ("markets"."road_address" is not null or "markets"."lot_address" is not null),
	CONSTRAINT "markets_coordinates_pair" CHECK (("markets"."latitude" is null) = ("markets"."longitude" is null)),
	CONSTRAINT "markets_coordinates_range" CHECK ("markets"."latitude" between -90 and 90 and "markets"."longitude" between -180 and 180)
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	CONSTRAINT "sources_url_unique" UNIQUE("url"),
	CONSTRAINT "sources_url_https" CHECK ("sources"."url" like 'https://%')
);
--> statement-breakpoint
ALTER TABLE "market_guide_sources" ADD CONSTRAINT "market_guide_sources_guide_id_market_guides_id_fk" FOREIGN KEY ("guide_id") REFERENCES "public"."market_guides"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_guide_sources" ADD CONSTRAINT "market_guide_sources_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_guide_tips" ADD CONSTRAINT "market_guide_tips_guide_id_market_guides_id_fk" FOREIGN KEY ("guide_id") REFERENCES "public"."market_guides"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_guides" ADD CONSTRAINT "market_guides_market_id_markets_id_fk" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_nearby" ADD CONSTRAINT "market_nearby_market_id_markets_id_fk" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_nearby" ADD CONSTRAINT "market_nearby_nearby_market_id_markets_id_fk" FOREIGN KEY ("nearby_market_id") REFERENCES "public"."markets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_onnuri_merchant_stats" ADD CONSTRAINT "market_onnuri_merchant_stats_market_id_markets_id_fk" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_onnuri_merchant_stats" ADD CONSTRAINT "market_onnuri_merchant_stats_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_schedule_days" ADD CONSTRAINT "market_schedule_days_schedule_id_market_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."market_schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_schedules" ADD CONSTRAINT "market_schedules_market_id_markets_id_fk" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_schedules" ADD CONSTRAINT "market_schedules_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_specialties" ADD CONSTRAINT "market_specialties_market_id_markets_id_fk" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "markets" ADD CONSTRAINT "markets_district_id_market_districts_id_fk" FOREIGN KEY ("district_id") REFERENCES "public"."market_districts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "markets" ADD CONSTRAINT "markets_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "market_nearby_nearby_market_id_idx" ON "market_nearby" USING btree ("nearby_market_id");--> statement-breakpoint
CREATE INDEX "market_schedule_days_day_digit_idx" ON "market_schedule_days" USING btree ("day_digit");--> statement-breakpoint
CREATE INDEX "market_schedules_kind_idx" ON "market_schedules" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "markets_district_id_idx" ON "markets" USING btree ("district_id");