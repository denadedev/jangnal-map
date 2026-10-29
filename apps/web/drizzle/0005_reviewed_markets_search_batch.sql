-- 검색 노출이 있지만 상세 페이지가 없던 시장 7곳의 검수 가이드를 운영 DB에 넣는다. market-editorial.json·editorial-highlight-categories.ts와 같은 값이다.
-- 빈 DB(CI·로컬)에서는 markets가 비어 아무것도 넣지 않고, 시드가 JSON에서 같은 값을 넣는다. 이미 있는 행은 건너뛴다.
INSERT INTO "sources" ("name", "url")
SELECT v.name, v.url FROM (VALUES
  ('전국전통시장표준데이터', 'https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y'),
  ('한국관광공사 진부전통시장', 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=85399e34-7562-4389-a531-941a5dccf25b'),
  ('한국관광공사 장수장', 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=3b475baa-6ce1-46a6-9f26-34db1ff88585'),
  ('한국관광공사 당진전통시장', 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=cef0a1ec-bd43-458b-9be9-610f0c520cb8'),
  ('한국관광공사 당진 오일장 여행기사(2015년 5월 작성)', 'https://korean.visitkorea.or.kr/detail/rem_detail.do?cotid=52522eed-5778-4527-81f1-8374c2397ad7'),
  ('한국관광공사 아우내장 / 병천5일장', 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=bdadd3cc-3e99-4581-8af8-e1ae569629a3'),
  ('한국관광공사 여주한글시장 여행기사(2020년 4월 작성)', 'https://korean.visitkorea.or.kr/detail/rem_detail.do?cotid=e9d63036-8d0b-4ad5-8cee-d7a0b686d4b6'),
  ('한국관광공사 여주오일장 여행기사(2017년 8월 갱신)', 'https://korean.visitkorea.or.kr/detail/rem_detail.do?cotid=435cb2ad-0be2-45fd-851f-3f041d290ced'),
  ('한국관광공사 화순고인돌전통시장', 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=82fede1e-da87-42e6-b390-1ba72916df44'),
  ('김포시 문화관광 양곡오라니장터시장', 'https://www.gimpo.go.kr/culture/selectTourCntntsWebView.do?tourNo=774&pageUnit=8&pageIndex=1&searchCnd=all&key=6874&ctgry=31&sortTy=RECOMEND')
) AS v(name, url)
WHERE EXISTS (SELECT 1 FROM "markets")
ON CONFLICT ("url") DO NOTHING;
--> statement-breakpoint
INSERT INTO "market_guides" ("market_id", "summary", "transportation", "parking", "status", "reviewed_at")
SELECT m.id, v.summary, v.transportation, v.parking, 'reviewed', v.reviewed_at::date FROM (VALUES
  ('market-8cdaed119306675d', '진부전통시장은 매월 끝자리 3·8일에 서는 평창군에서 가장 큰 오일장입니다. 한국관광공사는 조선시대 한양에서 대관령을 넘어 강릉으로 가는 길목에서 가장 큰 장이 진부장이었다고 소개하며, 지금도 평창뿐 아니라 홍천 내면, 정선, 북평면에서 사람들이 찾아온다고 전합니다.', '기본 데이터의 주소는 강원특별자치도 평창군 진부면 진부새싹길 28-7입니다. 한국관광공사는 고속도로가 가까워 찾아오는 사람이 많다고 소개하므로 자가용 일정에 넣기 쉽습니다.', '원본 시장 데이터에는 주차 가능한 시장으로 기록되어 있습니다. 이번에 확인한 관광공사 소개에는 주차장 위치와 요금이 없어 3·8일 장날에는 현장 안내를 확인하세요.', '2026-10-29'),
  ('market-7135505a40ee733c', '장수시장은 매월 끝자리 5·10일에 서는 장수읍의 오일장입니다. 한국관광공사는 시설이 깨끗하고 장날에도 크게 붐비지 않는 아담한 시장으로, 지역 농민이 직접 기른 채소와 과일이 주로 나와 신선한 농산물을 살 수 있다고 소개합니다.', '기본 데이터의 주소는 장수군 장수읍 시장로 11입니다. 한국관광공사 무장애 정보에는 저상버스 접근이 어렵다고 나와 있으니 대중교통으로 간다면 노선을 미리 확인하세요.', '한국관광공사는 시장 전용 주차장이 있고 아케이드가 있어 비가 와도 장을 볼 수 있다고 소개합니다. 주차 요금은 이번 확인 자료에 없습니다.', '2026-10-29'),
  ('market-cf6ee1cadd50f341', '당진전통시장은 매월 끝자리 5·10일에 서는 당진장의 중심 시장으로, 한국관광공사는 충청남도에서 홍성장 다음으로 큰 오일장이라고 소개합니다. 2015년 5월 관광공사 기사는 1974년 용장천 옆에 문을 연 상설시장 일대에서 당진시장 사거리부터 시장교 입구까지 약 500m에 장이 선다고 전합니다.', '기본 데이터의 주소는 충청남도 당진시 당진시장길 100입니다. 2015년 관광공사 기사는 당진버스터미널이 가깝고 당진IC에서 시내까지 10km가 채 안 된다고 안내합니다.', '2015년 관광공사 기사는 당진시장 사거리 근처와 수산시장 예정지 앞 공영주차장 두 곳을 안내합니다. 요금은 기사 이후 바뀌었을 수 있으니 현장에서 확인하세요.', '2026-10-29'),
  ('market-23aef33a6c7b3b38', '병천시장은 ''아우내장''으로 불리는 천안 병천면의 오일장으로, 매월 끝자리 1·6일에 섭니다. 한국관광공사는 조선시대부터 청주, 진천, 조치원, 예산 등지의 상인과 소가 모여 이 지역에서 가장 큰 장이 되었고, 1919년 유관순 열사가 이 장터에서 태극기를 나눠 주며 만세를 외쳤다고 소개합니다.', '기본 데이터의 주소는 충청남도 천안시 동남구 병천면 아우내장터1길 46입니다. 한국관광공사는 유관순 열사 생가와 조병옥 박사 생가가 가까이 있다고 소개하니 함께 둘러보세요.', '원본 시장 데이터에는 주차 가능한 시장으로 기록되어 있습니다. 관광공사 소개에는 주차 정보가 없고 장날에는 골목까지 천막이 들어서니 주차 위치를 먼저 확인하세요.', '2026-10-29'),
  ('market-380fc44e140f40f2', '여주한글시장은 1980년대부터 ''중앙로상점가''로 불리던 상점가가 2016년 문화관광형 시장 육성 사업에 선정되며 이름을 바꾼 시장입니다. 상설로 운영되고 매월 끝자리 5·10일에 오일장이 섭니다. 세종대왕 영릉이 여주에 있다는 데서 한글을 주제로 삼아 한글 조형물과 세종대왕 일대기 벽화, 한글 간판이 시장 곳곳에 있습니다.', '기본 데이터의 주소는 경기도 여주시 세종로14번길 24-1입니다. 관광공사 기사는 여주종합터미널에서 걸어서 가까우며, 경강선 여주역에서는 버스로 이동한다고 안내합니다.', '원본 시장 데이터에는 주차 가능한 시장으로 기록되어 있습니다. 장날에는 중앙통이 차 없는 거리가 된다고 안내되므로 주변 주차장을 미리 확인하세요.', '2026-10-29'),
  ('market-c1599911a16641bc', '화순고인돌전통시장은 매월 끝자리 3·8일에 서는 화순에서 가장 큰 오일장입니다. 한국관광공사는 1919년 시장 거리에서 3·1운동을 계획했던 기록을 들어 조선 말기에서 일제강점기 초에 장이 열린 것으로 보며, 2000년까지 삼일장이었다가 2000년대 초 오일장으로 바뀌었다고 소개합니다.', '기본 데이터의 주소는 전라남도 화순군 화순읍 시장길 42입니다. 화순 여행 중에 들른다면 끝자리 3·8일에 맞춰 일정을 잡으세요.', '원본 시장 데이터에는 주차 가능한 시장으로 기록되어 있습니다. 이번에 확인한 관광공사 소개에는 주차 정보가 없어 화순읍 장날에는 현장 안내를 확인하세요.', '2026-10-29'),
  ('market-3951be244225aa7c', '양곡오라니장터시장은 김포 양촌읍 양곡리의 상설시장입니다. 김포시 문화관광은 옛 이름 ''오라니장터''가 경기 서부에서 규모가 큰 오일장이 서던 곳이었고, 근대에는 우시장으로 유명했으며 1919년 3월 23일 독립만세운동 시위가 벌어진 곳이라고 소개합니다.', '김포시 문화관광의 주소는 김포시 양촌읍 양곡1로56번길 13 일원입니다. 이용 시간은 점포별로 다르다고 안내되니 목적 점포의 영업 시간을 확인하세요.', '원본 시장 데이터에는 주차 가능한 시장으로 기록되어 있습니다. 김포시 안내에는 주차 정보가 없어 축제 기간에는 특히 현장 안내를 확인하세요.', '2026-10-29')
) AS v(legacy_id, summary, transportation, parking, reviewed_at)
JOIN "markets" AS m ON m.legacy_id = v.legacy_id
ON CONFLICT ("market_id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "market_guide_tips" ("guide_id", "position", "body")
SELECT g.id, v.position, v.body FROM (VALUES
  ('market-8cdaed119306675d', 0, '한국관광공사는 고속도로와 대형마트가 생기면서 장의 규모가 예전보다 줄었지만 장날의 활기는 여전하다고 소개합니다. 장터 풍경을 보려면 3·8·13·18·23·28일에 맞춰 가세요.'),
  ('market-8cdaed119306675d', 1, '오대산과 대관령 쪽 여행길에 들르기 좋은 위치입니다. 산지 장이라 철마다 나오는 품목이 달라지니 방문 시기에 맞춰 장을 보세요.'),
  ('market-7135505a40ee733c', 0, '생선, 화분, 모종, 국수, 건어물, 옷도 나오지만 내륙이라 다른 장에서 흔한 생선회 좌판은 드물다고 안내됩니다. 대표 품목은 철마다 바뀌니 제철 농산물을 기대하세요.'),
  ('market-7135505a40ee733c', 1, '시장 안 장수철공 대장간에서 작은 농기구를 판다고 소개되어 있습니다. 근처 논개사당과 뜬봉샘생태공원을 함께 둘러보는 일정도 좋습니다.'),
  ('market-cf6ee1cadd50f341', 0, '같은 기사는 실치(4월~5월 초), 주꾸미, 꽃게, 멸치, 학꽁치 같은 수산물이 많고 어란이 특산물이라고 소개합니다. 실치를 보려면 봄에 가세요.'),
  ('market-cf6ee1cadd50f341', 1, '기사는 이른 아침 7~8시쯤 사람과 물건이 모여 가장 붐빈다고 안내합니다. 장 구경에는 한두 시간을 잡으라고 권합니다. 기사가 오래되어 가게와 가격은 바뀌었을 수 있습니다.'),
  ('market-23aef33a6c7b3b38', 0, '병천순대가 이 장의 대표 먹거리로 소개됩니다. 양배추, 파, 고추, 마늘을 다져 선지와 함께 돼지 창자에 넣은 순대입니다.'),
  ('market-23aef33a6c7b3b38', 1, '장날이 아니면 한산하고, 장날에는 아우내슈퍼 옆 공터와 주변 골목까지 천막이 들어선다고 안내됩니다. 뻥튀기 기계도 볼거리로 꼽히니 1·6일에 맞춰 가세요.'),
  ('market-380fc44e140f40f2', 0, '한국관광공사 기사(2020년 4월)는 생활문화 전시관 ''여주두지''와 자음이 찍힌 찹쌀빵 ''한글빵''을 소개합니다. 운영 시간은 바뀌었을 수 있으니 방문 전에 확인하세요.'),
  ('market-380fc44e140f40f2', 1, '2017년 관광공사 기사는 장날에 시청 인근 중앙통 거리가 차 없는 거리가 되고 홍어회무침, 막걸리, 통닭, 꽈배기 같은 장터 먹거리가 나온다고 소개합니다.'),
  ('market-c1599911a16641bc', 0, '어물전, 옹기전, 야채전, 가축전, 싸전이 모여 있고 철따라 나오는 계절 상품이 많다고 안내됩니다. 찾는 품목에 맞춰 전을 골라 둘러보세요.'),
  ('market-c1599911a16641bc', 1, '현대화 사업 때 농민이 직접 기른 농산물을 파는 시골 장터 공간도 만들어졌다고 소개됩니다. 산지 농산물을 사려면 3·8·13·18·23·28일 오전에 가는 일정을 제안합니다.'),
  ('market-3951be244225aa7c', 0, '김포시는 해마다 가을에 ''Again! 오라니장터 축제''가 열린다고 안내합니다. 축제 날짜는 해마다 달라지니 김포시 공지를 확인하세요.'),
  ('market-3951be244225aa7c', 1, '김포시 문화관광에는 같은 양곡리의 ''양곡5일장''이 별도 항목으로 올라 있습니다. 오일장 풍경을 보려면 그 장날을 따로 확인하세요.')
) AS v(legacy_id, position, body)
JOIN "markets" AS m ON m.legacy_id = v.legacy_id
JOIN "market_guides" AS g ON g.market_id = m.id
ON CONFLICT ("guide_id", "position") DO NOTHING;
--> statement-breakpoint
INSERT INTO "market_guide_sources" ("guide_id", "source_id", "checked_at", "position")
SELECT g.id, s.id, v.checked_at::date, v.position FROM (VALUES
  ('market-8cdaed119306675d', 'https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y', '2026-09-21', 0),
  ('market-8cdaed119306675d', 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=85399e34-7562-4389-a531-941a5dccf25b', '2026-10-29', 1),
  ('market-7135505a40ee733c', 'https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y', '2026-09-21', 0),
  ('market-7135505a40ee733c', 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=3b475baa-6ce1-46a6-9f26-34db1ff88585', '2026-10-29', 1),
  ('market-cf6ee1cadd50f341', 'https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y', '2026-09-21', 0),
  ('market-cf6ee1cadd50f341', 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=cef0a1ec-bd43-458b-9be9-610f0c520cb8', '2026-10-29', 1),
  ('market-cf6ee1cadd50f341', 'https://korean.visitkorea.or.kr/detail/rem_detail.do?cotid=52522eed-5778-4527-81f1-8374c2397ad7', '2026-10-29', 2),
  ('market-23aef33a6c7b3b38', 'https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y', '2026-09-21', 0),
  ('market-23aef33a6c7b3b38', 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=bdadd3cc-3e99-4581-8af8-e1ae569629a3', '2026-10-29', 1),
  ('market-380fc44e140f40f2', 'https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y', '2026-09-21', 0),
  ('market-380fc44e140f40f2', 'https://korean.visitkorea.or.kr/detail/rem_detail.do?cotid=e9d63036-8d0b-4ad5-8cee-d7a0b686d4b6', '2026-10-29', 1),
  ('market-380fc44e140f40f2', 'https://korean.visitkorea.or.kr/detail/rem_detail.do?cotid=435cb2ad-0be2-45fd-851f-3f041d290ced', '2026-10-29', 2),
  ('market-c1599911a16641bc', 'https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y', '2026-09-21', 0),
  ('market-c1599911a16641bc', 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=82fede1e-da87-42e6-b390-1ba72916df44', '2026-10-29', 1),
  ('market-3951be244225aa7c', 'https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y', '2026-09-21', 0),
  ('market-3951be244225aa7c', 'https://www.gimpo.go.kr/culture/selectTourCntntsWebView.do?tourNo=774&pageUnit=8&pageIndex=1&searchCnd=all&key=6874&ctgry=31&sortTy=RECOMEND', '2026-10-29', 1)
) AS v(legacy_id, url, checked_at, position)
JOIN "markets" AS m ON m.legacy_id = v.legacy_id
JOIN "market_guides" AS g ON g.market_id = m.id
JOIN "sources" AS s ON s.url = v.url
ON CONFLICT DO NOTHING;
--> statement-breakpoint
INSERT INTO "market_highlights" ("market_id", "name", "category", "origin")
SELECT m.id, v.name, v.category, 'editorial' FROM (VALUES
  ('market-8cdaed119306675d', '대관령길 옛 큰장', 'sight'),
  ('market-8cdaed119306675d', '3·8일 오일장', 'tip'),
  ('market-8cdaed119306675d', '평창·정선 산지 장보기', 'specialty'),
  ('market-7135505a40ee733c', '지역 농민의 채소·과일', 'specialty'),
  ('market-7135505a40ee733c', '장수철공 대장간 농기구', 'sight'),
  ('market-7135505a40ee733c', '5·10일 오일장', 'tip'),
  ('market-cf6ee1cadd50f341', '실치·주꾸미·꽃게', 'specialty'),
  ('market-cf6ee1cadd50f341', '어란', 'specialty'),
  ('market-cf6ee1cadd50f341', '5·10일 오일장', 'tip'),
  ('market-23aef33a6c7b3b38', '병천순대', 'food'),
  ('market-23aef33a6c7b3b38', '유관순 3·1 만세운동 장터', 'sight'),
  ('market-23aef33a6c7b3b38', '1·6일 아우내장', 'tip'),
  ('market-380fc44e140f40f2', '한글 조형물·세종대왕 벽화', 'sight'),
  ('market-380fc44e140f40f2', '한글빵', 'food'),
  ('market-380fc44e140f40f2', '5·10일 여주장', 'tip'),
  ('market-c1599911a16641bc', '어물전·옹기전·싸전', 'specialty'),
  ('market-c1599911a16641bc', '농민 직판 시골 장터', 'specialty'),
  ('market-c1599911a16641bc', '3·8일 오일장', 'tip'),
  ('market-3951be244225aa7c', '옛 오라니장터·우시장', 'sight'),
  ('market-3951be244225aa7c', '1919년 만세운동 장터', 'sight'),
  ('market-3951be244225aa7c', '가을 오라니장터 축제', 'sight')
) AS v(legacy_id, name, category)
JOIN "markets" AS m ON m.legacy_id = v.legacy_id
ON CONFLICT ("market_id", "name") DO NOTHING;
