-- market_specialties를 market_highlights로 바꾸고(데이터 유지), 카테고리·설명을 더한다. 사용자 제보 대기열 테이블을 만든다.
-- drizzle-kit은 이름 바꾸기를 drop/create로 만들어서 직접 썼다. 스냅샷(meta/0002)은 drizzle-kit generate가 만든 그대로다.
ALTER TABLE "market_specialties" RENAME TO "market_highlights";--> statement-breakpoint
ALTER TABLE "market_highlights" RENAME CONSTRAINT "market_specialties_pkey" TO "market_highlights_pkey";--> statement-breakpoint
ALTER TABLE "market_highlights" RENAME CONSTRAINT "market_specialties_market_id_name_key" TO "market_highlights_market_id_name_key";--> statement-breakpoint
ALTER TABLE "market_highlights" RENAME CONSTRAINT "market_specialties_market_id_markets_id_fk" TO "market_highlights_market_id_markets_id_fk";--> statement-breakpoint
ALTER TABLE "market_highlights" DROP CONSTRAINT "market_specialties_market_id_position_key";--> statement-breakpoint
ALTER TABLE "market_highlights" DROP CONSTRAINT "market_specialties_position_range";--> statement-breakpoint
ALTER TABLE "market_highlights" DROP COLUMN "position";--> statement-breakpoint
ALTER TABLE "market_highlights" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "market_highlights" ADD COLUMN "category" text;--> statement-breakpoint
ALTER TABLE "market_highlights" ADD CONSTRAINT "market_highlights_description_length" CHECK (char_length("market_highlights"."description") <= 100);--> statement-breakpoint
-- 이미 들어간 검수 품목 163개의 카테고리. src/db/editorial-highlight-categories.ts와 같은 값이다.
-- 빈 DB에서는 바꿀 행이 없고, 시드가 같은 값으로 넣는다. 하나라도 빠지면 아래 SET NOT NULL이 실패한다.
UPDATE "market_highlights" AS h SET "category" = v.category, "updated_at" = now()
FROM (VALUES
  ('market-46dd8e03711ba7b6', '소머리국밥거리', 'food'),
  ('market-46dd8e03711ba7b6', '해산물·채소 좌판', 'sight'),
  ('market-46dd8e03711ba7b6', '3·8일 노점형 오일장', 'tip'),
  ('market-c3983f871839ecc8', '닭전골목의 닭강정', 'food'),
  ('market-c3983f871839ecc8', '젓갈·건어물 장보기', 'specialty'),
  ('market-c3983f871839ecc8', '상가 지하 활어회센터', 'food'),
  ('market-389b4a24f06ccd11', '떡골목·순대골목', 'food'),
  ('market-389b4a24f06ccd11', '잡화골목', 'specialty'),
  ('market-389b4a24f06ccd11', '상설시장과 5·10일 오일장', 'tip'),
  ('market-d8d1a37e4d63609b', '종합 장보기 시장', 'tip'),
  ('market-d8d1a37e4d63609b', '인접 의류·가구 상권', 'sight'),
  ('market-d8d1a37e4d63609b', '1970년대부터 이어진 시장 골목', 'sight'),
  ('market-f9785614947c1065', '빈대떡·김밥·육회', 'food'),
  ('market-f9785614947c1065', '한복·포목·직물', 'specialty'),
  ('market-f9785614947c1065', '동문·북2문·남1문 사이 먹거리장터', 'food'),
  ('market-5207a19f315d3216', '농산물 장보기', 'specialty'),
  ('market-5207a19f315d3216', '인삼·한약재 상권', 'specialty'),
  ('market-5207a19f315d3216', '1960년 개설 시장', 'sight'),
  ('market-a977f620b61db85b', '소래포구의 새우·꽃게·젓갈', 'specialty'),
  ('market-a977f620b61db85b', '수산물 장보기', 'specialty'),
  ('market-a977f620b61db85b', '포구 산책과 연계', 'sight'),
  ('market-a096b1a38138db75', '4·9일 오일장과 상설점포', 'tip'),
  ('market-a096b1a38138db75', '수제 만두·씨앗호떡', 'food'),
  ('market-a096b1a38138db75', '조치원 테마거리', 'sight'),
  ('market-46fa9022c9bff08d', '밤·밤과자·밤막걸리', 'specialty'),
  ('market-46fa9022c9bff08d', '공산성과 연계한 시장 방문', 'sight'),
  ('market-46fa9022c9bff08d', '1937년 개설 문화관광형 시장', 'sight'),
  ('market-a3999c03b9b3e221', '의류·주단·포목 상점', 'specialty'),
  ('market-a3999c03b9b3e221', '충주천 주변 전통시장 상권', 'sight'),
  ('market-a3999c03b9b3e221', '인접 순대만두골목 연계', 'food'),
  ('market-7bee231bddce4e22', '제철 생선·수산물', 'specialty'),
  ('market-7bee231bddce4e22', '건어물', 'specialty'),
  ('market-7bee231bddce4e22', '횟집 식사', 'food'),
  ('market-57efa2a61ea8b011', '활어·선어·건어물', 'specialty'),
  ('market-57efa2a61ea8b011', '꿀빵·바지개떡', 'food'),
  ('market-57efa2a61ea8b011', '나전칠기·누비 제품', 'specialty'),
  ('market-54abc96559102d3e', '우엉김밥·찰순대', 'food'),
  ('market-54abc96559102d3e', '한식뷔페촌', 'food'),
  ('market-54abc96559102d3e', '품목별 농수산물 골목', 'specialty'),
  ('market-989da9eee01d8dda', '안동 간고등어', 'specialty'),
  ('market-989da9eee01d8dda', '문어·제수용품', 'specialty'),
  ('market-989da9eee01d8dda', '2·7일장 농산물', 'specialty'),
  ('market-863a810b24632a10', '서문시장 주단·포목 상권', 'specialty'),
  ('market-863a810b24632a10', '여러 지구 중 2지구 종합상가', 'sight'),
  ('market-1d91da2272ddf46a', '청과·수산물 장보기', 'specialty'),
  ('market-1d91da2272ddf46a', '돼지·닭·튀밥 골목', 'food'),
  ('market-1d91da2272ddf46a', '신천둔치 칠성야시장', 'sight'),
  ('market-a88b6fad98af479e', '수산물 장보기', 'specialty'),
  ('market-a88b6fad98af479e', '의류·잡화점', 'specialty'),
  ('market-a88b6fad98af479e', '상설시장과 원본 4·9일장 정보', 'tip'),
  ('market-5f7c435508d5a3b5', '성북 오일장·금계매일시장 통합 시장', 'sight'),
  ('market-5f7c435508d5a3b5', '원본 데이터 기준 4·9일장', 'tip'),
  ('market-df4d34f3be577ba5', '콩나물국밥·피순대국밥', 'food'),
  ('market-df4d34f3be577ba5', '전통공예 생활용품', 'specialty'),
  ('market-df4d34f3be577ba5', '전주천변 새벽시장', 'sight'),
  ('market-a8530c90ef5bf06a', '생선·건어물·젓갈', 'specialty'),
  ('market-a8530c90ef5bf06a', '시장 횟집', 'food'),
  ('market-a8530c90ef5bf06a', '포목·그릇·미곡상', 'specialty'),
  ('market-263aa2113b292a27', '의류·신발·잡화', 'specialty'),
  ('market-263aa2113b292a27', '가구·침구', 'specialty'),
  ('market-263aa2113b292a27', '커튼·혼수용품', 'specialty'),
  ('market-8a0a187a44eb648a', '채소·생선·육류', 'specialty'),
  ('market-8a0a187a44eb648a', '떡볶이·족발·샌드위치', 'food'),
  ('market-8a0a187a44eb648a', '의류·생활용품', 'specialty'),
  ('market-67f0b7c541707a6c', '막창 골목', 'food'),
  ('market-67f0b7c541707a6c', '채소·생선·육류', 'specialty'),
  ('market-67f0b7c541707a6c', '의류·생활용품', 'specialty'),
  ('market-ac45198fd61b05ce', '한복·원단', 'specialty'),
  ('market-ac45198fd61b05ce', '이불·그릇 등 혼수용품', 'specialty'),
  ('market-ac45198fd61b05ce', '의류·액세서리', 'specialty'),
  ('market-2279d714eda1634a', '3·8일 오일장과 상설 점포', 'tip'),
  ('market-2279d714eda1634a', '해산물·건어물', 'specialty'),
  ('market-2279d714eda1634a', '장터 먹거리', 'food'),
  ('market-8151f0a3f713aa4d', '3·8일 오일장', 'tip'),
  ('market-8151f0a3f713aa4d', '서생배 등 지역 농산물', 'specialty'),
  ('market-8151f0a3f713aa4d', '외고산 옹기 유통의 역사', 'sight'),
  ('market-2190eaf44c48bbd8', '2·7일 오일장', 'tip'),
  ('market-2190eaf44c48bbd8', '곡물·채소·제철 과일', 'specialty'),
  ('market-2190eaf44c48bbd8', '화훼·잡화·분식', 'specialty'),
  ('market-2adc6a0bdfc73a7b', '4·9일 오일장', 'tip'),
  ('market-2adc6a0bdfc73a7b', '감귤류·은갈치 등 농수산물', 'specialty'),
  ('market-2adc6a0bdfc73a7b', '농기구·생활잡화', 'specialty'),
  ('market-0b1ee7b765707fb2', '상설시장과 4·9일 오일장', 'tip'),
  ('market-0b1ee7b765707fb2', '반찬·떡·빵·농수산물', 'specialty'),
  ('market-0b1ee7b765707fb2', '샘솟는거리 족욕장', 'sight'),
  ('market-00f8629bf12716ac', '2·7일 오일장과 상설 상점가', 'tip'),
  ('market-00f8629bf12716ac', '주민이 판매하는 농산물', 'specialty'),
  ('market-00f8629bf12716ac', '이동 상인의 생활잡화', 'specialty'),
  ('market-9a33164f76fa5a0d', '4·9일 오일장', 'tip'),
  ('market-9a33164f76fa5a0d', '대장간 농기구', 'specialty'),
  ('market-9a33164f76fa5a0d', '한림항 수산물', 'specialty'),
  ('market-ba7e0c23fa4189c8', '세화해변 옆 장터', 'sight'),
  ('market-ba7e0c23fa4189c8', '수산물·생활용품', 'specialty'),
  ('market-ba7e0c23fa4189c8', '5·10일 오일장', 'tip'),
  ('market-298fe32a8bfbbb65', '어시장 제철 수산물', 'specialty'),
  ('market-298fe32a8bfbbb65', '순대국밥·고기국수', 'food'),
  ('market-298fe32a8bfbbb65', '2·7일 오일장', 'tip'),
  ('market-e668bef943d8adcf', '제주 서부 최대 오일장', 'sight'),
  ('market-e668bef943d8adcf', '1·6일장(31일 예외)', 'tip'),
  ('market-e668bef943d8adcf', '다양한 장터 먹거리', 'food'),
  ('market-709aad4bc63dacf7', '성산 지역 유일 오일장', 'sight'),
  ('market-709aad4bc63dacf7', '청과·수산·정육', 'specialty'),
  ('market-709aad4bc63dacf7', '4·9일 시골 장터', 'tip'),
  ('market-f62d739ffad346df', '곤드레밥·콧등치기', 'food'),
  ('market-f62d739ffad346df', '계절 산나물', 'specialty'),
  ('market-f62d739ffad346df', '2·7일장과 토요 주말장', 'tip'),
  ('market-c3863976485aebe6', '메밀 음식', 'food'),
  ('market-c3863976485aebe6', '「메밀꽃 필 무렵」 배경지', 'sight'),
  ('market-c3863976485aebe6', '2·7일 오일장', 'tip'),
  ('market-1beae503f360cf74', '2·7일 오일장', 'tip'),
  ('market-1beae503f360cf74', '봄나물·모종', 'specialty'),
  ('market-1beae503f360cf74', '인근 새벽시장(4~12월)', 'tip'),
  ('market-e20567bfb276f468', '3·8일 오일장', 'tip'),
  ('market-e20567bfb276f468', '양평해장국·수수부꾸미', 'food'),
  ('market-e20567bfb276f468', '토요일 청개구리프리마켓', 'sight'),
  ('market-9d181b5ed800d1f0', '2·7일 강화5일장', 'tip'),
  ('market-9d181b5ed800d1f0', '회센터·식당', 'food'),
  ('market-9d181b5ed800d1f0', '월 2회 월요일 휴무', 'tip'),
  ('market-f659e22b6f20050a', '5·10일 오일장', 'tip'),
  ('market-f659e22b6f20050a', '예산 사과', 'specialty'),
  ('market-f659e22b6f20050a', '국밥거리', 'food'),
  ('market-043a587570b5d1b7', '1·6일 오일장', 'tip'),
  ('market-043a587570b5d1b7', '천수만 수산물', 'specialty'),
  ('market-043a587570b5d1b7', '농산물 직거래', 'specialty'),
  ('market-2f2bae63ddbbd65a', '금산 인삼', 'specialty'),
  ('market-2f2bae63ddbbd65a', '인삼·약초 제품', 'specialty'),
  ('market-2f2bae63ddbbd65a', '2·7일 장날', 'tip'),
  ('market-f20b3b53f55c1fd7', '지리산 산나물', 'specialty'),
  ('market-f20b3b53f55c1fd7', '한약재', 'specialty'),
  ('market-f20b3b53f55c1fd7', '구례 산수유', 'specialty'),
  ('market-64f80404644775de', '2·7일 오일장', 'tip'),
  ('market-64f80404644775de', '순천·여수·벌교 농수산물', 'specialty'),
  ('market-64f80404644775de', '금·토 야시장', 'sight'),
  ('market-4733543783a779bc', '남원 순대국밥', 'food'),
  ('market-4733543783a779bc', '지리산 약초·남원 목기', 'specialty'),
  ('market-4733543783a779bc', '4·9일 남원장', 'tip'),
  ('market-6b4a8d56fc88c687', '장흥 한우', 'specialty'),
  ('market-6b4a8d56fc88c687', '표고·낙지·헛개', 'specialty'),
  ('market-6b4a8d56fc88c687', '2·7일장과 토요장', 'tip'),
  ('market-640545c0b5eda862', '벌교 꼬막', 'specialty'),
  ('market-640545c0b5eda862', '역전 아침 매일장', 'tip'),
  ('market-640545c0b5eda862', '4·9일 장날', 'tip'),
  ('market-3e76796de6f0d836', '‘함평 큰 소장’의 역사', 'sight'),
  ('market-3e76796de6f0d836', '지역 농산물', 'specialty'),
  ('market-3e76796de6f0d836', '2·7일 장날', 'tip'),
  ('market-99ed28cdfd3c4bb0', '2·7일 정기장', 'tip'),
  ('market-99ed28cdfd3c4bb0', '함양 대표 재래시장', 'sight'),
  ('market-99ed28cdfd3c4bb0', '인근 면 단위 장날', 'tip'),
  ('market-7d2e42169c1823bf', '섬진강 영호남 장터', 'sight'),
  ('market-7d2e42169c1823bf', '「토지」의 모티브', 'sight'),
  ('market-7d2e42169c1823bf', '2·7일 장날', 'tip'),
  ('market-29bcc366c3ff2867', '돔배기', 'specialty'),
  ('market-29bcc366c3ff2867', '곰탕·수육 먹거리골목', 'food'),
  ('market-29bcc366c3ff2867', '2·7일 오일장', 'tip'),
  ('market-833e8dec220195df', '청도반시·감말랭이', 'specialty'),
  ('market-833e8dec220195df', '새벽 번개시장', 'tip'),
  ('market-833e8dec220195df', '4·9일 오일장', 'tip'),
  ('market-9efff992a0bc51c9', '‘7읍장’의 역사', 'sight'),
  ('market-9efff992a0bc51c9', '2·7일 언양장', 'tip'),
  ('market-9efff992a0bc51c9', '장옥형 시장 골목', 'sight'),
  ('market-cca87bc624c29f28', '마늘만두', 'food'),
  ('market-cca87bc624c29f28', '소백산 산나물', 'specialty'),
  ('market-cca87bc624c29f28', '1·6일 단양장', 'tip')
) AS v(legacy_id, name, category)
JOIN "markets" AS m ON m."legacy_id" = v.legacy_id
WHERE h."market_id" = m."id" AND h."name" = v.name;--> statement-breakpoint
ALTER TABLE "market_highlights" ALTER COLUMN "category" SET NOT NULL;--> statement-breakpoint
CREATE TABLE "market_highlight_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"market_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"decided_at" timestamp with time zone,
	"decided_by" text,
	"highlight_id" uuid,
	CONSTRAINT "market_highlight_submissions_highlight_id_unique" UNIQUE("highlight_id"),
	CONSTRAINT "market_highlight_submissions_name_length" CHECK (char_length("market_highlight_submissions"."name") between 1 and 30),
	CONSTRAINT "market_highlight_submissions_description_length" CHECK (char_length("market_highlight_submissions"."description") <= 100),
	CONSTRAINT "market_highlight_submissions_decided_pair" CHECK (("market_highlight_submissions"."decided_at" is null) = ("market_highlight_submissions"."decided_by" is null))
);
--> statement-breakpoint
ALTER TABLE "market_highlight_submissions" ADD CONSTRAINT "market_highlight_submissions_market_id_markets_id_fk" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_highlight_submissions" ADD CONSTRAINT "market_highlight_submissions_highlight_id_fk" FOREIGN KEY ("highlight_id") REFERENCES "public"."market_highlights"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "market_highlight_submissions_market_id_idx" ON "market_highlight_submissions" USING btree ("market_id");--> statement-breakpoint
CREATE INDEX "market_highlight_submissions_status_created_at_idx" ON "market_highlight_submissions" USING btree ("status","created_at");--> statement-breakpoint
-- 테이블·컬럼 설명. 이름을 바꾼 테이블의 id·created_at·updated_at·market_id·origin 설명은 그대로 따라온다.
comment on table market_highlights is '시장의 대표 품목·먹거리·이용 팁·볼거리. 검수 가이드(market-editorial.json의 specialties)와 승인된 사용자 제보';
--> statement-breakpoint
comment on column market_highlights.name is '이름 (예: 안동 간고등어, 소머리국밥거리)';
--> statement-breakpoint
comment on column market_highlights.description is '한 줄 설명 (100자 이내). 사용자 제보에만 있고 검수 품목은 null';
--> statement-breakpoint
comment on column market_highlights.category is '카테고리 코드값 (specialty / food / tip / sight). 화면 표시는 특산물 / 먹거리 / 이용 팁 / 볼거리·체험, 이 순서로 보인다';
--> statement-breakpoint
comment on table market_highlight_submissions is '방문자가 시장 상세에서 보낸 제보. 제보 1건당 1행, 운영자가 슬랙에서 승인하면 market_highlights에 1행이 생긴다';
--> statement-breakpoint
comment on column market_highlight_submissions.market_id is '제보한 시장 (markets.id)';
--> statement-breakpoint
comment on column market_highlight_submissions.name is '제보한 이름 (1~30자)';
--> statement-breakpoint
comment on column market_highlight_submissions.description is '한 줄 설명 (100자 이내, 선택)';
--> statement-breakpoint
comment on column market_highlight_submissions.category is '카테고리 코드값 (specialty / food / tip / sight). 제보자가 고르고, 승인할 때 운영자가 슬랙에서 고른 값으로 덮어쓴다';
--> statement-breakpoint
comment on column market_highlight_submissions.status is '처리 상태 코드값 (pending / approved / rejected). 화면 표시는 검토 중 / 승인 / 반려';
--> statement-breakpoint
comment on column market_highlight_submissions.decided_at is '승인·반려한 시각. 검토 중이면 null';
--> statement-breakpoint
comment on column market_highlight_submissions.decided_by is '승인·반려한 운영자의 슬랙 user id. 검토 중이면 null';
--> statement-breakpoint
comment on column market_highlight_submissions.highlight_id is '승인으로 생긴 항목 (market_highlights.id). 승인 전이거나 그 항목을 지웠으면 null';
--> statement-breakpoint
comment on column market_highlight_submissions.id is '행 id (uuid). 모든 테이블은 자기 id를 PK로 갖는 비식별 관계';
--> statement-breakpoint
comment on column market_highlight_submissions.created_at is '행 생성 시각 (제보 접수 시각)';
--> statement-breakpoint
comment on column market_highlight_submissions.updated_at is '행 마지막 수정 시각 (ORM이 수정할 때 갱신)';
