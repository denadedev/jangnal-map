-- 테이블·컬럼 설명. drizzle-kit이 comment를 만들지 않아서 직접 둔다.
comment on table sources is '외부 출처(공공데이터, 관광공사 기사 등). 여러 테이블이 함께 참조한다';
--> statement-breakpoint
comment on column sources.name is '화면에 보일 출처 이름';
--> statement-breakpoint
comment on column sources.url is '출처 URL (https만, 중복 불가)';
--> statement-breakpoint
comment on table market_districts is '시·군·구. 시장 주소의 두 번째 단어에서 만든다. 시·군·구가 없는 세종은 세종특별자치시 1행';
--> statement-breakpoint
comment on column market_districts.region_code is '시·도 코드값 (seoul, busan, … gyeongbuk, jeju 17종). 이름은 앱 enum(REGIONS)에서 치환하고 /jangnal/<code> URL에도 쓴다';
--> statement-breakpoint
comment on column market_districts.name is '시·군·구 이름 (예: 경주시)';
--> statement-breakpoint
comment on table markets is '전통시장. 공공데이터 전국전통시장표준데이터 기준';
--> statement-breakpoint
comment on column markets.legacy_id is '기존 JSON의 해시 id (market-<16자리>). 옛 ?market= 링크 리다이렉트용';
--> statement-breakpoint
comment on column markets.slug is '시장 상세 URL 조각 (/markets/<slug>). 기존 값 유지';
--> statement-breakpoint
comment on column markets.name is '시장 이름';
--> statement-breakpoint
comment on column markets.market_type is '공공데이터 시장 유형 코드값 (permanent, periodic-3/4/5, permanent-periodic-3/4/5). 이름은 앱 enum에서 치환';
--> statement-breakpoint
comment on column markets.district_id is '소재 시·군·구 (market_districts.id)';
--> statement-breakpoint
comment on column markets.road_address is '도로명 주소';
--> statement-breakpoint
comment on column markets.lot_address is '지번 주소';
--> statement-breakpoint
comment on column markets.latitude is '위도 (좌표가 유효하지 않으면 null)';
--> statement-breakpoint
comment on column markets.longitude is '경도 (좌표가 유효하지 않으면 null)';
--> statement-breakpoint
comment on column markets.phone is '전화번호';
--> statement-breakpoint
comment on column markets.has_parking is '주차장 보유 여부 (모르면 null)';
--> statement-breakpoint
comment on column markets.status is '운영 상태 코드값 (open / closed). 화면 표시는 운영 / 폐장';
--> statement-breakpoint
comment on column markets.status_verified is '운영 상태를 별도로 확인했는지';
--> statement-breakpoint
comment on column markets.source_id is '기본 데이터 출처 (sources.id)';
--> statement-breakpoint
comment on column markets.reference_date is '기본 데이터 기준일';
--> statement-breakpoint
comment on table market_schedules is '시장의 장날 규칙 (시장당 1행)';
--> statement-breakpoint
comment on column market_schedules.market_id is '시장 (markets.id). 시장당 1행이라 unique';
--> statement-breakpoint
comment on column market_schedules.raw is '공공데이터 장날 원문 (예: 4일+9일, 매일)';
--> statement-breakpoint
comment on column market_schedules.kind is '장날 종류 코드값 (daily / digit-pair / unknown)';
--> statement-breakpoint
comment on column market_schedules.skips_first_after_31st is '31일에 장이 선 달은 다음 날 1일 장을 쉬는지 (대정오일시장)';
--> statement-breakpoint
comment on column market_schedules.source_id is '공공데이터와 다르게 고친 경우 그 출처 (sources.id). 고치지 않았으면 null';
--> statement-breakpoint
comment on column market_schedules.checked_at is '보정 출처를 확인한 날짜';
--> statement-breakpoint
comment on table market_schedule_days is '끝자리 장날 숫자. digit-pair 장날만 2행';
--> statement-breakpoint
comment on column market_schedule_days.schedule_id is '장날 규칙 (market_schedules.id)';
--> statement-breakpoint
comment on column market_schedule_days.day_digit is '날짜 끝자리 0~9 (5·10일장이면 5와 0)';
--> statement-breakpoint
comment on table market_onnuri_merchant_stats is '시장별 온누리상품권 가맹점 집계 (시장당 최대 1행)';
--> statement-breakpoint
comment on column market_onnuri_merchant_stats.market_id is '시장 (markets.id). 시장당 1행이라 unique';
--> statement-breakpoint
comment on column market_onnuri_merchant_stats.total_count is '전체 가맹점 수';
--> statement-breakpoint
comment on column market_onnuri_merchant_stats.digital_count is '디지털 상품권 가맹점 수';
--> statement-breakpoint
comment on column market_onnuri_merchant_stats.paper_count is '지류 상품권 가맹점 수';
--> statement-breakpoint
comment on column market_onnuri_merchant_stats.reference_date is '집계 기준일';
--> statement-breakpoint
comment on column market_onnuri_merchant_stats.source_id is '집계 출처 (sources.id)';
--> statement-breakpoint
comment on table market_guides is '운영자가 검수한 시장 가이드 (기존 market-editorial.json, 시장당 최대 1행)';
--> statement-breakpoint
comment on column market_guides.market_id is '시장 (markets.id). 시장당 1행이라 unique';
--> statement-breakpoint
comment on column market_guides.summary is '시장 소개 요약';
--> statement-breakpoint
comment on column market_guides.transportation is '교통 안내';
--> statement-breakpoint
comment on column market_guides.parking is '주차 안내';
--> statement-breakpoint
comment on column market_guides.status is '검수 상태 코드값 (draft / reviewed). reviewed만 노출';
--> statement-breakpoint
comment on column market_guides.reviewed_at is '마지막 검수일';
--> statement-breakpoint
comment on table market_guide_tips is '시장 가이드의 방문 팁';
--> statement-breakpoint
comment on column market_guide_tips.guide_id is '가이드 (market_guides.id)';
--> statement-breakpoint
comment on column market_guide_tips.position is '표시 순서 (0부터)';
--> statement-breakpoint
comment on column market_guide_tips.body is '팁 본문';
--> statement-breakpoint
comment on table market_guide_sources is '시장 가이드의 편집 출처';
--> statement-breakpoint
comment on column market_guide_sources.guide_id is '가이드 (market_guides.id)';
--> statement-breakpoint
comment on column market_guide_sources.source_id is '출처 (sources.id)';
--> statement-breakpoint
comment on column market_guide_sources.checked_at is '출처를 확인한 날짜';
--> statement-breakpoint
comment on column market_guide_sources.position is '표시 순서 (0부터)';
--> statement-breakpoint
comment on table market_specialties is '시장의 대표 품목·특산물';
--> statement-breakpoint
comment on column market_specialties.market_id is '시장 (markets.id)';
--> statement-breakpoint
comment on column market_specialties.name is '품목 이름 (예: 대게, 소머리국밥)';
--> statement-breakpoint
comment on column market_specialties.position is '표시 순서 (0부터)';
--> statement-breakpoint
comment on column market_specialties.origin is '등록 경로 코드값 (editorial: 운영자 검수 / user: 사용자 제보)';
--> statement-breakpoint
comment on table market_nearby is '시장 가이드에서 함께 소개하는 주변 시장';
--> statement-breakpoint
comment on column market_nearby.market_id is '기준 시장 (markets.id)';
--> statement-breakpoint
comment on column market_nearby.nearby_market_id is '주변 시장 (markets.id)';
--> statement-breakpoint
comment on column market_nearby.position is '표시 순서 (0부터)';
--> statement-breakpoint
-- 공통 컬럼(id, created_at, updated_at) 설명을 모든 테이블에 건다
do $$
declare t text;
begin
  foreach t in array array['sources', 'market_districts', 'markets', 'market_schedules', 'market_schedule_days', 'market_onnuri_merchant_stats', 'market_guides', 'market_guide_tips', 'market_guide_sources', 'market_specialties', 'market_nearby'] loop
    execute format('comment on column %I.id is %L', t, '행 id (uuid). 모든 테이블은 자기 id를 PK로 갖는 비식별 관계');
    execute format('comment on column %I.created_at is %L', t, '행 생성 시각');
    execute format('comment on column %I.updated_at is %L', t, '행 마지막 수정 시각 (ORM이 수정할 때 갱신)');
  end loop;
end $$;
