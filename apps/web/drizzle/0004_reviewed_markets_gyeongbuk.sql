-- 경북 오일장 10곳의 검수 가이드를 운영 DB에 넣는다. market-editorial.json·editorial-highlight-categories.ts와 같은 값이다.
-- 빈 DB(CI·로컬)에서는 markets가 비어 아무것도 넣지 않고, 시드가 JSON에서 같은 값을 넣는다. 이미 있는 행은 건너뛴다.
INSERT INTO "sources" ("name", "url")
SELECT v.name, v.url FROM (VALUES
  ('전국전통시장표준데이터', 'https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y'),
  ('한국관광공사 경주 중앙시장', 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=f663b502-7e06-4814-9851-8b86731ddf07'),
  ('한국관광공사 경산공설시장', 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=972816d5-34e3-45e1-81c9-4cd7a9537c3c'),
  ('한국관광공사 경산시장 여행기사(2019년 3월 갱신)', 'https://korean.visitkorea.or.kr/detail/rem_detail.do?cotid=ce81899a-d131-4d1e-93f3-8fa05607d82d'),
  ('한국관광공사 구미새마을중앙시장', 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=92e1b08c-d05c-4fe1-9cf1-684be061656e'),
  ('구미시 새마을중앙시장 공영주차장 이용 안내(2024년 4월)', 'https://www.gumi.go.kr/imo/board/post/view.do?bcIdx=1&mid=0201000000&idx=803576'),
  ('한국관광공사 상주장 / 상주중앙시장', 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=3d6cf93d-848b-4bb9-a60b-06fdf168e6d2'),
  ('포항시 관광 전통시장 안내 — 구룡포장', 'https://www.pohang.go.kr/phtour/wmap/tourInformation/view.do?menu_idx=63&tour_info_idx=586'),
  ('한국관광공사 청하공진시장·구룡포 여행기사(2023년 1월 작성)', 'https://korean.visitkorea.or.kr/detail/rem_detail.do?cotid=3e09029e-387a-400d-80f7-a3aa67d093a6&con_type=11000'),
  ('한국관광공사 영해관광시장 여행기사(2015년 10월 작성)', 'https://korean.visitkorea.or.kr/detail/rem_detail.do?cotid=cf217632-81b4-45a4-8ad8-d1b6612ea52d'),
  ('한국관광공사 선산5일장', 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=f399cc5c-278a-4157-9d1d-1500a9f1f529'),
  ('한국관광공사 청하공진시장', 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=b9ce16b0-9078-4787-be83-fa895202c889'),
  ('한국관광공사 고령대가야시장 / 고령장', 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=a4b6532f-a8c0-434c-bc63-409745d64f59'),
  ('한국관광공사 점촌전통시장', 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=b552000a-33ca-4267-b91a-1a00fb198625')
) AS v(name, url)
WHERE EXISTS (SELECT 1 FROM "markets")
ON CONFLICT ("url") DO NOTHING;
--> statement-breakpoint
INSERT INTO "market_guides" ("market_id", "summary", "transportation", "parking", "status", "reviewed_at")
SELECT m.id, v.summary, v.transportation, v.parking, 'reviewed', v.reviewed_at::date FROM (VALUES
  ('market-d422169d3b759268', '경주중앙시장은 상설 점포와 매월 끝자리 2·7일에 서는 오일장을 함께 볼 수 있는 경주의 큰 시장입니다. 한국관광공사는 1900년대 초 농민과 보부상이 모이던 장터에서 시작해 1983년 상가 건물 시장으로 커졌고, 지금은 건물 11개 동에 점포 600여 개와 노점 100여 곳이 있다고 소개합니다. 현지에서는 ''아래 시장''이라고도 부릅니다.', '기본 데이터의 주소는 경상북도 경주시 금성로 295입니다. 한국관광공사 무장애 정보에는 저상버스 접근이 어렵고 주출입구에 단차가 있다고 나와 있으니, 휠체어나 유모차로 간다면 입구를 미리 확인하세요.', '원본 시장 데이터에는 주차 가능한 시장으로 기록되어 있습니다. 이번에 확인한 관광공사 소개에는 주차장 위치와 요금이 없어 무료 여부를 단정하지 않습니다.', '2026-10-29'),
  ('market-c20a79a7a17cc677', '경산공설시장은 1956년에 문을 연 경산의 중심 시장으로, 매월 끝자리 5·10일에 장이 섭니다. 한국관광공사는 경산 주민뿐 아니라 대구에서도 찾아오는 시장이며, 시설 현대화로 아케이드가 생겨 눈이나 비가 와도 장보기가 편하다고 소개합니다.', '기본 데이터와 한국관광공사 기사의 주소는 경상북도 경산시 경안로31길 19입니다. 5·10일 장날에는 주변이 붐비니 도착 시각에 여유를 두세요.', '원본 시장 데이터에는 주차 가능한 시장으로 기록되어 있습니다. 이번에 확인한 관광공사 자료에는 주차장 위치와 요금이 없어 현장 안내를 기준으로 확인하세요.', '2026-10-29'),
  ('market-e9d93c6ca75ef263', '구미새마을중앙시장은 점포 400여 개가 모인 구미의 대표 전통시장입니다. 한국관광공사는 순대골목, 국수골목, 족발골목, 한복골목처럼 품목별 골목이 나뉘어 있고, 먹자골목과 한복골목에 쉼터가 있다고 소개합니다. 원본 데이터에는 끝자리 1·6일 장날이 기록되어 있습니다.', '기본 데이터의 주소는 경상북도 구미시 구미중앙로9길 11입니다. 한국관광공사는 구미역 역세권에 있어 찾아가기 쉽다고 소개하므로 기차로 와서 걸어가는 일정도 잡을 수 있습니다.', '구미시는 2024년 4월 공지에서 시장 제2주차장을 청년·소상공인 상생센터 조성으로 폐쇄하고, 4월 19일부터 시장 공영주차장을 쓰도록 안내했습니다. 요금은 공지에 없으니 현장 안내를 확인하세요.', '2026-10-29'),
  ('market-3b31b8efb49ad7d8', '상주중앙시장은 조선시대부터 이어진 상주 읍내장의 맥을 잇는 시장입니다. 한국관광공사는 일제강점기 말에 장터가 커졌고 1987년 상설시장 건물이 들어섰으며, 매월 끝자리 2·7일 오일장에는 시장 거리 전체가 노점으로 채워진다고 소개합니다.', '기본 데이터의 주소는 경상북도 상주시 남성로 35입니다. 상주 시내 중심에 있어 읍내 일정과 함께 들르기 좋습니다.', '원본 시장 데이터에는 주차 가능한 시장으로 기록되어 있습니다. 2·7일에는 시장 거리 전체가 노점으로 채워지므로, 차를 시장 거리 안으로 몰고 들어가기 전에 주차 위치를 먼저 확인하세요.', '2026-10-29'),
  ('market-a4495f0c448bf4df', '구룡포시장은 포항 구룡포읍에서 매월 끝자리 3·8일에 서는 오일장입니다. 포항시 관광 안내는 배오징어와 과메기, 소라·전복·성게알·해삼 같은 바다 해물을 대표 품목으로 꼽고, 마른오징어·꽁치·가자미·미역과 함께 채소·나물·잡곡도 거래되며 장터 안쪽에 횟집이 모여 있다고 소개합니다.', '포항시 관광 안내의 주소는 경상북도 포항시 남구 구룡포읍 구룡포길 72-1입니다. 포항터미널에서 좌석버스로 약 50분 걸린다고 안내하지만 노선과 배차는 바뀔 수 있으니 출발 전에 확인하세요.', '원본 시장 데이터에는 주차 가능한 시장으로 기록되어 있습니다. 포항시 안내에는 주차장 정보가 비어 있어 장날 주차 위치는 현장에서 확인하세요.', '2026-10-29'),
  ('market-882bef396d717f15', '영해만세시장은 영덕 영해면에서 매월 끝자리 5·10일에 서는 오일장입니다. 한국관광공사는 1919년 3월 18일 이 장터에서 주민 3,000여 명이 독립 만세를 외친 일이 영덕 만세운동의 시작이 되었다고 소개하며, 현장에 영해3·18독립만세운동기념탑이 있습니다.', '기본 데이터의 주소는 경상북도 영덕군 영해면 예주시장5길 21이고, 한국관광공사 기사에는 예주시장5길 20-27로 실려 있습니다. 기사는 괴시리전통마을이 1km 안쪽에 있다고 소개하니 함께 둘러보세요.', '원본 시장 데이터에는 주차 가능한 시장으로 기록되어 있습니다. 이번에 확인한 관광공사 기사에는 주차 정보가 없어 장날 주차 위치는 현장에서 확인하세요.', '2026-10-29'),
  ('market-d2c646a224002f84', '선산봉황시장은 매월 끝자리 2·7일에 서는 선산 오일장의 중심 시장입니다. 한국관광공사는 선산농협에서 수문교까지 복개천 도로를 따라 약 400m 장이 이어지고, 노점상 140여 명 중 약 70%가 선산 사람이라고 소개합니다. 조선 후기부터 선산·인동은 2·7일에 장을 열었다고 전합니다.', '기본 데이터의 주소는 경상북도 구미시 선산읍 단계동길 24입니다. 장날에는 복개천 도로가 장터가 되므로 차량 통행에 유의하세요.', '원본 시장 데이터에는 주차 가능한 시장으로 기록되어 있습니다. 이번에 확인한 관광공사 소개에는 주차장 정보가 없어 장날에는 현장 안내를 확인하세요.', '2026-10-29'),
  ('market-bce7d94ed3dd046e', '청하시장은 포항에서 영덕 방향으로 약 18km 떨어진 청하면에서 매월 끝자리 1·6일에 서는 오일장입니다. 한국관광공사는 1920년대 중반 이후 정기시장이 생겼고, 드라마 〈갯마을 차차차〉 촬영지가 된 뒤 청하공진시장이라는 이름으로 알려졌다고 소개합니다. 농수산물, 생선, 건어물, 곡물, 채소, 과일이 주로 거래됩니다.', '기본 데이터의 주소는 경상북도 포항시 북구 청하면 청하로 200번길 4입니다. 한국관광공사 기사는 포항역과 포항고속버스터미널 쪽에서 청하시장 정류장까지 가는 버스를 안내하니 출발 전에 최신 노선을 확인하세요.', '원본 시장 데이터에는 주차 가능한 시장으로 기록되어 있습니다. 이번에 확인한 관광공사 자료에는 주차 정보가 없어 현장 안내를 확인하세요.', '2026-10-29'),
  ('market-c1bdb90b0aee2a24', '고령대가야시장은 ''고령 큰장''으로도 불리는 고령읍의 시장으로, 매월 끝자리 4·9일에 오일장이 섭니다. 한국관광공사는 장날이면 많은 점포와 노점이 나와 다양한 물품을 판다고 소개합니다.', '기본 데이터의 주소는 경상북도 고령군 대가야읍 시장3길 29입니다. 한국관광공사 무장애 정보에는 저상버스 접근이 어렵다고 나와 있으니 대중교통으로 간다면 노선을 미리 확인하세요.', '원본 시장 데이터에는 주차 가능한 시장으로 기록되어 있습니다. 이번에 확인한 관광공사 소개에는 주차장 위치와 요금이 없어 현장 안내를 확인하세요.', '2026-10-29'),
  ('market-b6ae8f703b2f9521', '점촌전통시장은 1995년 신흥시장으로 문을 열어 2017년 지금 이름으로 바뀐 문경 점촌의 대표 시장입니다. 한국관광공사는 매월 끝자리 3·8일 오일장이 서는 날이면 점포 200여 곳과 노점 200여 곳이 나와 시골 장터 분위기가 난다고 소개합니다.', '기본 데이터의 주소는 경상북도 문경시 신흥시장길 19입니다. 한국관광공사는 시장 가까이에 버스터미널이 있다고 소개하므로 버스로 가는 일정도 잡을 수 있습니다.', '원본 시장 데이터에는 주차 가능한 시장으로 기록되어 있습니다. 3·8일에는 노점 200여 곳이 더해져 붐비니, 주차 위치를 미리 확인하거나 시장 가까운 버스터미널을 이용하는 방법도 고려하세요.', '2026-10-29')
) AS v(legacy_id, summary, transportation, parking, reviewed_at)
JOIN "markets" AS m ON m.legacy_id = v.legacy_id
ON CONFLICT ("market_id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "market_guide_tips" ("guide_id", "position", "body")
SELECT g.id, v.position, v.body FROM (VALUES
  ('market-d422169d3b759268', 0, '오일장 풍경을 보려면 2·7·12·17·22·27일에 맞춰 가세요. 한국관광공사는 지역 주민이 직접 기른 농산물과 토산품을 이 시장의 볼거리로 꼽습니다.'),
  ('market-d422169d3b759268', 1, '한국관광공사는 목요일부터 일요일까지 ''달빛 미행'' 야시장이 열린다고 안내합니다. 저녁 일정이 있다면 운영 시간과 휴장일을 시장 안내로 먼저 확인하세요.'),
  ('market-c20a79a7a17cc677', 0, '한국관광공사의 2019년 3월 기사는 이 시장의 먹거리로 상어고기를 숙성해 찐 돔배기와 닭발편육, 오래된 분식집·빵집·칼국수집을 소개합니다. 기사 이후 바뀐 가게가 있을 수 있으니 찾는 집은 미리 확인하세요.'),
  ('market-c20a79a7a17cc677', 1, '같은 기사는 구제 옷가게 50여 곳이 모여 있다고 소개합니다. 농산물 장보기와 함께 옷 골목을 둘러보는 동선을 제안합니다.'),
  ('market-e9d93c6ca75ef263', 0, '식사가 목적이면 순대·국수·족발 골목을 먼저 찾고, 한복이나 원단을 보러 왔다면 한복골목으로 바로 가는 동선을 제안합니다.'),
  ('market-e9d93c6ca75ef263', 1, '장날 풍경을 보려면 원본 데이터 기준 1·6·11·16·21·26일에 맞춰 가세요. 상설시장이라는 분류가 모든 점포의 매일 영업을 뜻하지는 않으니 목적 점포의 휴무를 확인하세요.'),
  ('market-3b31b8efb49ad7d8', 0, '상주 특산물과 농산물, 과일 장보기가 중심입니다. 장날이 아니어도 상설 점포에서 장을 볼 수 있지만 거리 노점까지 보려면 2·7일에 가세요.'),
  ('market-3b31b8efb49ad7d8', 1, '한국관광공사는 시가 지원한 청년 상인의 공방, 꽃집, 카페도 시장 안에 있다고 소개합니다. 장보기 뒤 쉬어 갈 곳으로 들러 보세요.'),
  ('market-a4495f0c448bf4df', 0, '과메기와 해산물을 사려면 3·8·13·18·23·28일에 맞춰 가세요. 포항시 안내 문구 일부에는 날짜가 빠져 있으니 출발 전에 장날을 한 번 더 확인하세요.'),
  ('market-a4495f0c448bf4df', 1, '한국관광공사의 2023년 1월 기사는 구룡포 근대문화역사거리와 과메기문화관을 함께 소개합니다. 장을 본 뒤 항구 주변을 걷는 일정으로 묶기 좋습니다.'),
  ('market-882bef396d717f15', 0, '한국관광공사의 2015년 10월 기사는 대게, 물가자미, 참문어, 미역, 과메기 같은 수산물과 영해 시금치를 대표 품목으로 소개합니다. 대게는 겨울에 많이 나오니 철을 맞춰 가세요.'),
  ('market-882bef396d717f15', 1, '같은 기사는 물가자미회를 사서 근처 식당에서 비빔밥과 함께 먹거나 물가자미무침으로 즐기는 방법을 소개합니다. 기사가 오래되어 가게와 가격은 바뀌었을 수 있습니다.'),
  ('market-d2c646a224002f84', 0, '한국관광공사는 인근 농민이 가져온 농산물과 모종, 농기구, 병아리·강아지처럼 일반 시장에서 보기 어려운 품목을 이 장의 특징으로 꼽습니다. 봄 모종철에 가면 볼거리가 많습니다.'),
  ('market-d2c646a224002f84', 1, '장터국밥과 전통과자, 간식거리도 소개되어 있습니다. 복개천 도로를 따라 길게 이어지는 장이니 한쪽 끝에서 시작해 걸어가며 둘러보세요.'),
  ('market-bce7d94ed3dd046e', 0, '한국관광공사의 2023년 1월 기사는 시장 입구의 오징어 조형물과 드라마에 나온 보라슈퍼, 청호철물, 오윤카페를 소개합니다. 주말에는 사진을 찍으려는 줄이 길 수 있습니다.'),
  ('market-bce7d94ed3dd046e', 1, '촬영지만 보고 지나치기보다 1·6일 장날에 맞춰 가면 농수산물 장까지 함께 볼 수 있습니다.'),
  ('market-c1bdb90b0aee2a24', 0, '한국관광공사는 중앙네거리에서 고령지구대까지 이어지는 시장길과 그 오른쪽 안쪽 골목에 장이 선다고 안내합니다. 이 구간을 따라 걸으며 둘러보세요.'),
  ('market-c1bdb90b0aee2a24', 1, '장날은 4·9·14·19·24·29일입니다. 관광공사 페이지 제목에는 4·9일만 적혀 있으니 끝자리 기준으로 읽으면 됩니다.'),
  ('market-b6ae8f703b2f9521', 0, '한국관광공사는 백두대간에서 나는 제철 산나물과 문경사과, 문경 오미자, 약돌한우·약돌돼지를 대표 품목으로 소개합니다. 산나물은 봄, 사과와 오미자는 가을에 맞춰 가면 좋습니다.'),
  ('market-b6ae8f703b2f9521', 1, '노점까지 보려면 3·8·13·18·23·28일에 가세요. 장날이 아닌 날에 간다면 목적 점포의 영업 여부를 미리 확인하세요.')
) AS v(legacy_id, position, body)
JOIN "markets" AS m ON m.legacy_id = v.legacy_id
JOIN "market_guides" AS g ON g.market_id = m.id
ON CONFLICT ("guide_id", "position") DO NOTHING;
--> statement-breakpoint
INSERT INTO "market_guide_sources" ("guide_id", "source_id", "checked_at", "position")
SELECT g.id, s.id, v.checked_at::date, v.position FROM (VALUES
  ('market-d422169d3b759268', 'https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y', '2026-09-21', 0),
  ('market-d422169d3b759268', 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=f663b502-7e06-4814-9851-8b86731ddf07', '2026-10-29', 1),
  ('market-c20a79a7a17cc677', 'https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y', '2026-09-21', 0),
  ('market-c20a79a7a17cc677', 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=972816d5-34e3-45e1-81c9-4cd7a9537c3c', '2026-10-29', 1),
  ('market-c20a79a7a17cc677', 'https://korean.visitkorea.or.kr/detail/rem_detail.do?cotid=ce81899a-d131-4d1e-93f3-8fa05607d82d', '2026-10-29', 2),
  ('market-e9d93c6ca75ef263', 'https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y', '2026-09-21', 0),
  ('market-e9d93c6ca75ef263', 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=92e1b08c-d05c-4fe1-9cf1-684be061656e', '2026-10-29', 1),
  ('market-e9d93c6ca75ef263', 'https://www.gumi.go.kr/imo/board/post/view.do?bcIdx=1&mid=0201000000&idx=803576', '2026-10-29', 2),
  ('market-3b31b8efb49ad7d8', 'https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y', '2026-09-21', 0),
  ('market-3b31b8efb49ad7d8', 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=3d6cf93d-848b-4bb9-a60b-06fdf168e6d2', '2026-10-29', 1),
  ('market-a4495f0c448bf4df', 'https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y', '2026-09-21', 0),
  ('market-a4495f0c448bf4df', 'https://www.pohang.go.kr/phtour/wmap/tourInformation/view.do?menu_idx=63&tour_info_idx=586', '2026-10-29', 1),
  ('market-a4495f0c448bf4df', 'https://korean.visitkorea.or.kr/detail/rem_detail.do?cotid=3e09029e-387a-400d-80f7-a3aa67d093a6&con_type=11000', '2026-10-29', 2),
  ('market-882bef396d717f15', 'https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y', '2026-09-21', 0),
  ('market-882bef396d717f15', 'https://korean.visitkorea.or.kr/detail/rem_detail.do?cotid=cf217632-81b4-45a4-8ad8-d1b6612ea52d', '2026-10-29', 1),
  ('market-d2c646a224002f84', 'https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y', '2026-09-21', 0),
  ('market-d2c646a224002f84', 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=f399cc5c-278a-4157-9d1d-1500a9f1f529', '2026-10-29', 1),
  ('market-bce7d94ed3dd046e', 'https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y', '2026-09-21', 0),
  ('market-bce7d94ed3dd046e', 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=b9ce16b0-9078-4787-be83-fa895202c889', '2026-10-29', 1),
  ('market-bce7d94ed3dd046e', 'https://korean.visitkorea.or.kr/detail/rem_detail.do?cotid=3e09029e-387a-400d-80f7-a3aa67d093a6&con_type=11000', '2026-10-29', 2),
  ('market-c1bdb90b0aee2a24', 'https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y', '2026-09-21', 0),
  ('market-c1bdb90b0aee2a24', 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=a4b6532f-a8c0-434c-bc63-409745d64f59', '2026-10-29', 1),
  ('market-b6ae8f703b2f9521', 'https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y', '2026-09-21', 0),
  ('market-b6ae8f703b2f9521', 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=b552000a-33ca-4267-b91a-1a00fb198625', '2026-10-29', 1)
) AS v(legacy_id, url, checked_at, position)
JOIN "markets" AS m ON m.legacy_id = v.legacy_id
JOIN "market_guides" AS g ON g.market_id = m.id
JOIN "sources" AS s ON s.url = v.url
ON CONFLICT DO NOTHING;
--> statement-breakpoint
INSERT INTO "market_highlights" ("market_id", "name", "category", "origin")
SELECT m.id, v.name, v.category, 'editorial' FROM (VALUES
  ('market-d422169d3b759268', '2·7일 오일장과 상설 점포', 'tip'),
  ('market-d422169d3b759268', '달빛 미행 야시장', 'food'),
  ('market-d422169d3b759268', '지역 농산물·토산품', 'specialty'),
  ('market-c20a79a7a17cc677', '돔배기·닭발편육', 'food'),
  ('market-c20a79a7a17cc677', '구제 옷가게 골목', 'specialty'),
  ('market-c20a79a7a17cc677', '5·10일 오일장', 'tip'),
  ('market-e9d93c6ca75ef263', '순대·국수·족발 골목', 'food'),
  ('market-e9d93c6ca75ef263', '한복골목', 'specialty'),
  ('market-e9d93c6ca75ef263', '1·6일 장날', 'tip'),
  ('market-3b31b8efb49ad7d8', '상주 특산물·과일', 'specialty'),
  ('market-3b31b8efb49ad7d8', '2·7일 거리 노점장', 'tip'),
  ('market-3b31b8efb49ad7d8', '청년 상인 공방·카페', 'sight'),
  ('market-a4495f0c448bf4df', '과메기·배오징어', 'specialty'),
  ('market-a4495f0c448bf4df', '소라·전복·성게알 해물', 'specialty'),
  ('market-a4495f0c448bf4df', '장터 안쪽 횟집', 'food'),
  ('market-882bef396d717f15', '3·18 독립만세운동 기념탑', 'sight'),
  ('market-882bef396d717f15', '물가자미·대게', 'specialty'),
  ('market-882bef396d717f15', '5·10일 오일장', 'tip'),
  ('market-d2c646a224002f84', '모종·농기구·병아리', 'specialty'),
  ('market-d2c646a224002f84', '장터국밥·전통과자', 'food'),
  ('market-d2c646a224002f84', '복개천 400m 노점장', 'sight'),
  ('market-bce7d94ed3dd046e', '〈갯마을 차차차〉 촬영지', 'sight'),
  ('market-bce7d94ed3dd046e', '농수산물·건어물', 'specialty'),
  ('market-bce7d94ed3dd046e', '1·6일 오일장', 'tip'),
  ('market-c1bdb90b0aee2a24', '고령 큰장', 'sight'),
  ('market-c1bdb90b0aee2a24', '중앙네거리~고령지구대 시장길', 'tip'),
  ('market-c1bdb90b0aee2a24', '4·9일 오일장', 'tip'),
  ('market-b6ae8f703b2f9521', '문경사과·오미자', 'specialty'),
  ('market-b6ae8f703b2f9521', '약돌한우·약돌돼지', 'specialty'),
  ('market-b6ae8f703b2f9521', '백두대간 제철 산나물', 'specialty')
) AS v(legacy_id, name, category)
JOIN "markets" AS m ON m.legacy_id = v.legacy_id
ON CONFLICT ("market_id", "name") DO NOTHING;
