-- 경남·전남 오일장 8곳의 검수 가이드를 운영 DB에 넣는다. market-editorial.json·editorial-highlight-categories.ts와 같은 값이다.
-- 빈 DB(CI·로컬)에서는 markets가 비어 아무것도 넣지 않고, 시드가 JSON에서 같은 값을 넣는다. 이미 있는 행은 건너뛴다.
INSERT INTO "sources" ("name", "url")
SELECT v.name, v.url FROM (VALUES
  ('전국전통시장표준데이터', 'https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y'),
  ('한국관광공사 거창장', 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=6debb307-c031-4a6b-8254-bd54cf9ea9db'),
  ('한국관광공사 양산 남부시장', 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=121ed07a-d146-4a79-9eb7-9df934e9b68e'),
  ('한국관광공사 광양5일장', 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=49155406-f4a7-45e1-9447-367a13f865d4'),
  ('한국관광공사 옥곡5일장', 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=2e3b8fb8-a77d-45b6-a28f-76090022f404'),
  ('한국관광공사 창원 상남시장 여행기사(2019년 10월 갱신)', 'https://korean.visitkorea.or.kr/detail/rem_detail.do?cotid=65003a0d-a470-4704-9c2e-fcbe10927bd9'),
  ('한국관광공사 남해전통시장', 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=e3fd5100-2842-424f-a2ef-0b24d3d0e459'),
  ('한국관광공사 곡성기차마을전통시장', 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=038e960f-9977-4921-bded-5aaca78802c7'),
  ('한국관광공사 순천 웃장', 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=f26fd9ab-ae44-4fd9-9ef2-ade488fba9da'),
  ('한국관광공사 순천웃장 여행기사(2023년 6월 작성)', 'https://korean.visitkorea.or.kr/detail/rem_detail.do?cotid=523e8205-7a41-4649-a8c4-99baad888d3b')
) AS v(name, url)
WHERE EXISTS (SELECT 1 FROM "markets")
ON CONFLICT ("url") DO NOTHING;
--> statement-breakpoint
INSERT INTO "market_guides" ("market_id", "summary", "transportation", "parking", "status", "reviewed_at")
SELECT m.id, v.summary, v.transportation, v.parking, 'reviewed', v.reviewed_at::date FROM (VALUES
  ('market-a9fb2a38a92e44c8', '거창시장은 매월 끝자리 1·6일 오일장이 서는 거창읍의 전통시장입니다. 한국관광공사는 조선시대부터 합천, 함양, 산청 등 이웃 고을의 장꾼이 모여 문전성시를 이루던 곳으로 소개하며, ''가고 싶은 전통시장 50선''에 뽑혔고 문화관광형 시장과 청년몰 사업에도 참여하고 있다고 전합니다.', '기본 데이터의 주소는 경상남도 거창군 거창읍 중앙로 140입니다. 한국관광공사 무장애 정보에는 주출입구에 단차가 있다고 나와 있으니 휠체어나 유모차로 간다면 입구를 미리 확인하세요.', '원본 시장 데이터에는 주차 가능한 시장으로 기록되어 있습니다. 1·6일에는 이웃 고을에서도 사람이 모이는 장이라 주차 위치를 일찍 확인하는 편이 좋습니다.', '2026-10-29'),
  ('market-db175b498c2c0d46', '양산남부시장은 양산 중부동의 전통시장으로, 매월 끝자리 1·6일에 오일장이 섭니다. 한국관광공사는 낙동강 뱃길이 쇠퇴한 뒤에도 장 규모가 컸고, 양산우시장과 가설극장이 있었으며 상권이 부산, 김해, 울주, 경주까지 닿았다고 소개합니다.', '기본 데이터의 주소는 경상남도 양산시 중앙로 133입니다. 장날에는 도로변까지 노점이 들어선다고 안내되니 차량 통행에 유의하세요.', '원본 시장 데이터에는 주차 가능한 시장으로 기록되어 있습니다. 관광공사 소개에는 주차장 정보가 없어 도심 장날에는 현장 안내를 확인하세요.', '2026-10-29'),
  ('market-1fa559134e5986d4', '광양5일시장은 1964년에 처음 문을 연 광양읍의 오일장으로, 매월 끝자리 1·6일에 섭니다. 한국관광공사는 광양 닭구이가 맛있는 시장으로 소개하며, 신선한 농수산물과 여러 먹거리, 빵집과 식당이 있어 장을 보며 식사나 간식을 해결할 수 있다고 전합니다.', '기본 데이터의 주소는 전라남도 광양시 광양읍 백운로 3입니다. 광양읍 중심에 있어 읍내 일정과 함께 들르기 좋습니다.', '원본 시장 데이터에는 주차 가능한 시장으로 기록되어 있습니다. 관광공사 소개에는 주차장 위치와 요금이 없어 광양읍 장날에는 현장 안내를 확인하세요.', '2026-10-29'),
  ('market-a50e6a3f09290dbe', '옥곡5일시장은 매월 끝자리 4·9일에 서는 광양 동부의 중심 장입니다. 한국관광공사는 약 500년 전 지금의 장동교 아래쪽에 자리를 잡아 ''옥실장''으로도 불렸고, 바다로 이어지는 옥곡천과 수어천 뱃길 덕분에 섬 주민들이 주로 찾던 장이라고 소개합니다.', '기본 데이터의 주소는 전라남도 광양시 옥곡면 큰골1길 2-26입니다. 한국관광공사 무장애 정보에는 주출입구에 단차가 있다고 나와 있으니 이동 보조기구를 쓴다면 미리 확인하세요.', '한국관광공사는 지하주차장과 비 가림 시설이 있어 이용하기 편하다고 소개합니다. 주차 요금은 이번 확인 자료에 없습니다.', '2026-10-29'),
  ('market-6a95347b99ffa190', '상남시장은 매일 여는 상설시장이면서 끝자리 4·9일마다 오일장이 서는 창원 성산구의 시장입니다. 한국관광공사 기사(2019년 10월 갱신)는 경사진 터에 3층 건물이 있어 남문으로 들어가면 1층, 북쪽에서 들어가면 2층이 되니 층별 안내를 먼저 확인하라고 권합니다.', '기본 데이터와 관광공사 기사의 주소는 경상남도 창원시 성산구 마디미로 28입니다. 기사는 창원시청과 상남동 일대 대형마트 가까이에 있다고 소개합니다.', '2019년 관광공사 기사는 약 500대를 세울 수 있는 큰 주차장이 있지만, 오일장 날에는 1·2층 바깥 주차장이 장터로 바뀐다고 안내합니다.', '2026-10-29'),
  ('market-3a89105daad39f5b', '남해전통시장은 120년이 넘는 역사를 가진 남해읍의 상설시장으로, 매월 끝자리 2·7일에는 오일장이 함께 섭니다. 한국관광공사는 문화관광형 육성 사업으로 시설을 고쳤고, 예부터 신선한 해산물과 청정 지역에서 기른 제철 농산물로 알려진 시장이라고 소개합니다.', '기본 데이터의 주소는 경상남도 남해군 남해읍 화전로 110입니다. 남해읍 중심에 있어 남해 여행 중 장날에 맞춰 들르기 좋습니다.', '원본 시장 데이터에는 주차 가능한 시장으로 기록되어 있습니다. 관광공사 소개에는 주차 정보가 없어 2·7일 장날에는 현장 안내를 확인하세요.', '2026-10-29'),
  ('market-6328449811d9f47a', '곡성기차마을전통시장은 매월 끝자리 3·8일에 서는 장옥형 중형 시장입니다. 한국관광공사는 1956년에 개설된 곡성 오일장이 2009년 전통시장 현대화 사업으로 새 건물에 들어서며 이어지고 있다고 소개합니다.', '기본 데이터의 주소는 전라남도 곡성군 곡성읍 곡성로 856입니다. 한국관광공사 무장애 정보에는 저상버스 접근이 어렵다고 나와 있으니 대중교통 노선을 미리 확인하세요.', '원본 시장 데이터에는 주차 가능한 시장으로 기록되어 있습니다. 관광공사 소개에는 주차장 정보가 없어 곡성읍 장날에는 현장 안내를 확인하세요.', '2026-10-29'),
  ('market-71be3409d13899e2', '순천 웃장은 상설시장의 편리함과 오일장의 정겨움을 함께 갖춘 순천의 대표 오일장으로, 매월 끝자리 5·10일에 노점이 들어서 붐빕니다. 한국관광공사는 이곳이 전라남도가 지정한 남도 음식 거리이자 순천 음식 특화 거리이며 국밥으로 유명하다고 소개합니다.', '기본 데이터의 주소는 전라남도 순천시 북문길 40입니다. 2023년 관광공사 기사는 순천역에서 대중교통으로 약 20분, 순천종합버스터미널에서 약 15분 걸린다고 안내합니다.', '원본 시장 데이터에는 주차 가능한 시장으로 기록되어 있습니다. 관광공사 자료에는 주차 정보가 없어 5·10일 장날에는 현장 안내를 확인하세요.', '2026-10-29')
) AS v(legacy_id, summary, transportation, parking, reviewed_at)
JOIN "markets" AS m ON m.legacy_id = v.legacy_id
ON CONFLICT ("market_id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "market_guide_tips" ("guide_id", "position", "body")
SELECT g.id, v.position, v.body FROM (VALUES
  ('market-a9fb2a38a92e44c8', 0, '한국관광공사는 1·6일 오일장 날이면 시장이 북새통을 이룬다고 소개합니다. 장날 풍경을 보려면 1·6·11·16·21·26일에 맞춰 가세요.'),
  ('market-a9fb2a38a92e44c8', 1, '청년몰 사업에 참여한 시장이라 전통 점포와 함께 청년 상인의 가게도 둘러볼 수 있습니다. 운영 점포는 바뀔 수 있으니 현장에서 확인하세요.'),
  ('market-db175b498c2c0d46', 0, '한국관광공사는 장날이면 남부시장 골목뿐 아니라 주택가 골목과 도로변까지 노점이 선다고 안내합니다. 골목 노점까지 보려면 1·6·11·16·21·26일에 가세요.'),
  ('market-db175b498c2c0d46', 1, '옛 양산오일장 터는 지금 음식점과 금융기관이 모인 도심이 되었다고 소개됩니다. 장보기와 시내 식사를 함께 잡기 좋은 위치입니다.'),
  ('market-1fa559134e5986d4', 0, '장 구경을 하려면 1·6·11·16·21·26일에 맞춰 가세요. 한국관광공사는 시장의 대표 먹거리로 닭구이를 꼽습니다.'),
  ('market-1fa559134e5986d4', 1, '농산물과 수산물을 함께 파는 장이라 수산물은 마지막에 사서 보관 시간을 줄이는 동선을 제안합니다.'),
  ('market-a50e6a3f09290dbe', 0, '주변 들판과 바다에서 나는 농수산물이 많고, 지역 주민이 직접 파는 노점이 많아 로컬푸드를 구하기 쉽다고 안내됩니다. 농산물 값이 다른 장보다 비교적 저렴하다는 소개도 있습니다.'),
  ('market-a50e6a3f09290dbe', 1, '장날은 4·9·14·19·24·29일입니다. 제철 농수산물을 사려면 오전 일찍 가는 일정을 제안합니다.'),
  ('market-6a95347b99ffa190', 0, '같은 기사는 1층에 생선·떡·반찬 가게와 방앗간, 2층에 옷·신발·이불·한복·과일 가게와 먹거리 야시장, 3층에 식당이 모여 있다고 소개합니다. 찾는 품목의 층부터 가세요.'),
  ('market-6a95347b99ffa190', 1, '기사는 상설시장이 첫째·셋째 일요일에 쉬지만 그날이 장날이면 오일장은 선다고 안내합니다. 기사 이후 바뀌었을 수 있으니 휴무일을 확인하세요.'),
  ('market-3a89105daad39f5b', 0, '입구 양쪽에는 과일과 농산물, 가운데 구역에는 어시장 좌판이 길게 이어지며 제철 해산물을 그 자리에서 손질해 준다고 안내됩니다. 대부분 좌판이 생선 이름과 가격을 써 둔다고 소개됩니다.'),
  ('market-3a89105daad39f5b', 1, '시장 안팎 식당에서 멸치쌈밥, 도다리쑥국, 전복죽을 맛볼 수 있다고 소개됩니다.'),
  ('market-6328449811d9f47a', 0, '곡물과 면포, 죽공예품, 밤, 그릇 같은 일용잡화가 주로 거래되고, 토종꿀과 석곡면의 돌실 삼베가 특산물로 안내됩니다.'),
  ('market-6328449811d9f47a', 1, '장날은 3·8·13·18·23·28일입니다. 곡성 여행 일정을 짠다면 장날에 맞춰 보세요.'),
  ('market-71be3409d13899e2', 0, '한국관광공사는 국밥을 2인분 이상 시키면 돼지머리 수육과 순대가 서비스로 나온다고 소개합니다. 여럿이 가면 국밥골목에서 식사해 보세요.'),
  ('market-71be3409d13899e2', 1, '2023년 6월 관광공사 기사는 2012년부터 해마다 웃장국밥축제가 열리고, 국밥거리는 화·수요일에 돌아가며 쉬되 장날에는 정상 영업한다고 안내합니다. 기사 이후 바뀌었을 수 있습니다.')
) AS v(legacy_id, position, body)
JOIN "markets" AS m ON m.legacy_id = v.legacy_id
JOIN "market_guides" AS g ON g.market_id = m.id
ON CONFLICT ("guide_id", "position") DO NOTHING;
--> statement-breakpoint
INSERT INTO "market_guide_sources" ("guide_id", "source_id", "checked_at", "position")
SELECT g.id, s.id, v.checked_at::date, v.position FROM (VALUES
  ('market-a9fb2a38a92e44c8', 'https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y', '2026-09-21', 0),
  ('market-a9fb2a38a92e44c8', 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=6debb307-c031-4a6b-8254-bd54cf9ea9db', '2026-10-29', 1),
  ('market-db175b498c2c0d46', 'https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y', '2026-09-21', 0),
  ('market-db175b498c2c0d46', 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=121ed07a-d146-4a79-9eb7-9df934e9b68e', '2026-10-29', 1),
  ('market-1fa559134e5986d4', 'https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y', '2026-09-21', 0),
  ('market-1fa559134e5986d4', 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=49155406-f4a7-45e1-9447-367a13f865d4', '2026-10-29', 1),
  ('market-a50e6a3f09290dbe', 'https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y', '2026-09-21', 0),
  ('market-a50e6a3f09290dbe', 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=2e3b8fb8-a77d-45b6-a28f-76090022f404', '2026-10-29', 1),
  ('market-6a95347b99ffa190', 'https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y', '2026-09-21', 0),
  ('market-6a95347b99ffa190', 'https://korean.visitkorea.or.kr/detail/rem_detail.do?cotid=65003a0d-a470-4704-9c2e-fcbe10927bd9', '2026-10-29', 1),
  ('market-3a89105daad39f5b', 'https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y', '2026-09-21', 0),
  ('market-3a89105daad39f5b', 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=e3fd5100-2842-424f-a2ef-0b24d3d0e459', '2026-10-29', 1),
  ('market-6328449811d9f47a', 'https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y', '2026-09-21', 0),
  ('market-6328449811d9f47a', 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=038e960f-9977-4921-bded-5aaca78802c7', '2026-10-29', 1),
  ('market-71be3409d13899e2', 'https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y', '2026-09-21', 0),
  ('market-71be3409d13899e2', 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=f26fd9ab-ae44-4fd9-9ef2-ade488fba9da', '2026-10-29', 1),
  ('market-71be3409d13899e2', 'https://korean.visitkorea.or.kr/detail/rem_detail.do?cotid=523e8205-7a41-4649-a8c4-99baad888d3b', '2026-10-29', 2)
) AS v(legacy_id, url, checked_at, position)
JOIN "markets" AS m ON m.legacy_id = v.legacy_id
JOIN "market_guides" AS g ON g.market_id = m.id
JOIN "sources" AS s ON s.url = v.url
ON CONFLICT DO NOTHING;
--> statement-breakpoint
INSERT INTO "market_highlights" ("market_id", "name", "category", "origin")
SELECT m.id, v.name, v.category, 'editorial' FROM (VALUES
  ('market-a9fb2a38a92e44c8', '합천·함양·산청 장꾼이 모이던 장', 'sight'),
  ('market-a9fb2a38a92e44c8', '청년몰', 'sight'),
  ('market-a9fb2a38a92e44c8', '1·6일 오일장', 'tip'),
  ('market-db175b498c2c0d46', '옛 양산우시장 터', 'sight'),
  ('market-db175b498c2c0d46', '골목·도로변 노점장', 'sight'),
  ('market-db175b498c2c0d46', '1·6일 오일장', 'tip'),
  ('market-1fa559134e5986d4', '광양 닭구이', 'food'),
  ('market-1fa559134e5986d4', '농수산물 장보기', 'specialty'),
  ('market-1fa559134e5986d4', '1·6일 오일장', 'tip'),
  ('market-a50e6a3f09290dbe', '500년 옥실장', 'sight'),
  ('market-a50e6a3f09290dbe', '주민 직판 농수산물', 'specialty'),
  ('market-a50e6a3f09290dbe', '지하주차장·비 가림 시설', 'tip'),
  ('market-6a95347b99ffa190', '층별 시장 건물', 'tip'),
  ('market-6a95347b99ffa190', '2층 먹거리 야시장', 'food'),
  ('market-6a95347b99ffa190', '4·9일 오일장', 'tip'),
  ('market-3a89105daad39f5b', '어시장 좌판 해산물', 'specialty'),
  ('market-3a89105daad39f5b', '멸치쌈밥·도다리쑥국', 'food'),
  ('market-3a89105daad39f5b', '2·7일 오일장', 'tip'),
  ('market-6328449811d9f47a', '토종꿀', 'specialty'),
  ('market-6328449811d9f47a', '돌실 삼베', 'specialty'),
  ('market-6328449811d9f47a', '곡물·밤·죽공예품', 'specialty'),
  ('market-71be3409d13899e2', '국밥골목 돼지국밥·수육', 'food'),
  ('market-71be3409d13899e2', '제철 농수산물', 'specialty'),
  ('market-71be3409d13899e2', '5·10일 오일장', 'tip')
) AS v(legacy_id, name, category)
JOIN "markets" AS m ON m.legacy_id = v.legacy_id
ON CONFLICT ("market_id", "name") DO NOTHING;
