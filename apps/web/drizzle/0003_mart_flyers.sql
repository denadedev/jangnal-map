-- 대형마트 주간 전단. 운영자가 슬랙 /flyer로 올리고, 이미지는 S3 호환 저장소(Garage)에 두고 키만 적는다. 브랜드 3행을 함께 넣는다.
CREATE TABLE "mart_brands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"official_flyer_url" text NOT NULL,
	"hidden" boolean DEFAULT false NOT NULL,
	"position" smallint NOT NULL,
	CONSTRAINT "mart_brands_code_unique" UNIQUE("code"),
	CONSTRAINT "mart_brands_position_unique" UNIQUE("position"),
	CONSTRAINT "mart_brands_official_flyer_url_https" CHECK ("mart_brands"."official_flyer_url" like 'https://%')
);
--> statement-breakpoint
CREATE TABLE "mart_flyer_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"flyer_id" uuid NOT NULL,
	"position" smallint NOT NULL,
	"storage_key" text NOT NULL,
	"content_type" text NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"byte_size" integer NOT NULL,
	CONSTRAINT "mart_flyer_pages_storage_key_unique" UNIQUE("storage_key"),
	CONSTRAINT "mart_flyer_pages_flyer_id_position_key" UNIQUE("flyer_id","position"),
	CONSTRAINT "mart_flyer_pages_position_range" CHECK ("mart_flyer_pages"."position" >= 0),
	CONSTRAINT "mart_flyer_pages_size_range" CHECK ("mart_flyer_pages"."width" > 0 and "mart_flyer_pages"."height" > 0 and "mart_flyer_pages"."byte_size" between 1 and 2000000)
);
--> statement-breakpoint
CREATE TABLE "mart_flyers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"brand_id" uuid NOT NULL,
	"starts_on" date NOT NULL,
	"ends_on" date NOT NULL,
	"base_store_name" text,
	"status" text NOT NULL,
	"uploaded_by_slack_user" text NOT NULL,
	"slack_message_ts" text,
	CONSTRAINT "mart_flyers_period" CHECK ("mart_flyers"."ends_on" >= "mart_flyers"."starts_on" and "mart_flyers"."ends_on" - "mart_flyers"."starts_on" <= 31)
);
--> statement-breakpoint
ALTER TABLE "mart_flyer_pages" ADD CONSTRAINT "mart_flyer_pages_flyer_id_mart_flyers_id_fk" FOREIGN KEY ("flyer_id") REFERENCES "public"."mart_flyers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mart_flyers" ADD CONSTRAINT "mart_flyers_brand_id_mart_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."mart_brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mart_flyers_brand_id_ends_on_idx" ON "mart_flyers" USING btree ("brand_id","ends_on");--> statement-breakpoint
-- 브랜드는 시드가 아니라 여기서 넣는다. 운영 DB는 이미 시드가 끝나 다시 돌지 않는다.
insert into mart_brands (code, name, official_flyer_url, position) values
  ('emart', '이마트', 'https://eapp.emart.com/leaflet/leafletView_EL.do', 0),
  ('homeplus', '홈플러스', 'https://my.homeplus.co.kr/leaflet', 1),
  ('lottemart', '롯데마트', 'https://www.lottemart.com/', 2);
--> statement-breakpoint
comment on table mart_brands is '전단을 싣는 대형마트 브랜드. 브랜드당 1행 (emart, homeplus, lottemart)';
--> statement-breakpoint
comment on column mart_brands.code is '브랜드 코드값 (emart / homeplus / lottemart). 화면 표시는 이마트 / 홈플러스 / 롯데마트';
--> statement-breakpoint
comment on column mart_brands.name is '화면에 보이는 브랜드 이름';
--> statement-breakpoint
comment on column mart_brands.official_flyer_url is '브랜드 공식 전단 페이지 URL (https). 출처 표기와 숨김·전단 없음 상태의 대체 링크로 쓴다';
--> statement-breakpoint
comment on column mart_brands.hidden is '브랜드 전단 숨김 여부. true면 전단 이미지를 내리고 공식 링크만 보여 준다 (권리자 요청 대응)';
--> statement-breakpoint
comment on column mart_brands.position is '목록에 보이는 순서 (0부터)';
--> statement-breakpoint
comment on table mart_flyers is '운영자가 올린 주간 전단. 브랜드·행사 기간당 1행. 종료일이 지나면 화면에서 내리고 30일 뒤 삭제한다';
--> statement-breakpoint
comment on column mart_flyers.brand_id is '브랜드 (mart_brands.id)';
--> statement-breakpoint
comment on column mart_flyers.starts_on is '행사 시작일 (한국 날짜)';
--> statement-breakpoint
comment on column mart_flyers.ends_on is '행사 종료일 (한국 날짜, 이날까지 보인다)';
--> statement-breakpoint
comment on column mart_flyers.base_store_name is '기준 매장 이름 (예: 금천점). null이면 전국 공통 전단';
--> statement-breakpoint
comment on column mart_flyers.status is '게시 상태 코드값 (published / removed). 화면 표시는 게시 중 / 내림';
--> statement-breakpoint
comment on column mart_flyers.uploaded_by_slack_user is '올린 운영자의 슬랙 user id';
--> statement-breakpoint
comment on column mart_flyers.slack_message_ts is '등록 확인 슬랙 메시지 ts. 메시지를 보내기 전이거나 보내지 못했으면 null';
--> statement-breakpoint
comment on table mart_flyer_pages is '전단 한 장의 페이지 이미지. 전단당 1~10행 (1행 이상은 등록 코드에서 검사)';
--> statement-breakpoint
comment on column mart_flyer_pages.flyer_id is '전단 (mart_flyers.id). 전단을 지우면 함께 지워진다';
--> statement-breakpoint
comment on column mart_flyer_pages.position is '페이지 순서 (0부터)';
--> statement-breakpoint
comment on column mart_flyer_pages.storage_key is '페이지 이미지의 저장소 키 (FLYER_S3_BUCKET 안, 예: flyers/{업로드 id}/0.webp). 가로 1,600px 이하로 줄인 WebP';
--> statement-breakpoint
comment on column mart_flyer_pages.content_type is '이미지 MIME 타입 (image/webp)';
--> statement-breakpoint
comment on column mart_flyer_pages.width is '이미지 가로 픽셀';
--> statement-breakpoint
comment on column mart_flyer_pages.height is '이미지 세로 픽셀';
--> statement-breakpoint
comment on column mart_flyer_pages.byte_size is '이미지 바이트 수 (2,000,000 이하)';
--> statement-breakpoint
do $$
declare t text;
begin
  foreach t in array array['mart_brands', 'mart_flyers', 'mart_flyer_pages'] loop
    execute format('comment on column %I.id is %L', t, '행 id (uuid). 모든 테이블은 자기 id를 PK로 갖는 비식별 관계');
    execute format('comment on column %I.created_at is %L', t, '행 생성 시각');
    execute format('comment on column %I.updated_at is %L', t, '행 마지막 수정 시각 (ORM이 수정할 때 갱신)');
  end loop;
end $$;
