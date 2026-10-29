-- 경남·전남·경북·전북·경기 정기 장날 시장 12곳의 검수 가이드를 운영 DB에 넣는다. market-editorial.json·editorial-highlight-categories.ts와 같은 값이다.
-- 빈 DB(CI·로컬)에서는 markets가 비어 아무것도 넣지 않고, 시드가 JSON에서 같은 값을 넣는다. 이미 있는 행은 건너뛴다.
INSERT INTO "sources" ("name", "url")
SELECT v.name, v.url FROM (VALUES
  ('전국전통시장표준데이터', 'https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y'),
  ('한국관광공사 삼천포 중앙시장', 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=13103f75-362b-4fc9-8ae9-adf41062aa99'),
  ('한국관광공사 고흥전통시장', 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=a64d836f-3a9c-4e69-aafd-87e4dbcf9835'),
  ('한국관광공사 일로전통시장', 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=87cf1800-1998-4ed0-8568-8d573a15a8a2'),
  ('한국관광공사 보성장 / 녹차골 보성향토시장', 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=856eb86b-0cae-47ad-91f2-0c7cd0a71da8'),
  ('한국관광공사 남지시장', 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=b5f5e2c9-7250-471b-9192-6c869a0ad874'),
  ('한국관광공사 진주 문산장', 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=d68eab8f-511f-4773-a7b9-32ede66f4887'),
  ('한국관광공사 옥종장', 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=a91da9cf-3108-44f0-9473-b5d8f335a6f2'),
  ('한국관광공사 진영전통시장', 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=96dcce48-1fe6-4fcb-b5cf-57bd7077142d'),
  ('한국관광공사 시종장', 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=4c20c7d8-cc9b-491f-8312-4a2dec7c2f18'),
  ('한국관광공사 화령시장', 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=55bdd79e-5847-4b61-b208-688048cfabf7'),
  ('한국관광공사 고창장', 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=969feea4-9762-4ac8-b6a9-9bae77e3d34b'),
  ('한국관광공사 양수리전통시장', 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=5705faf0-80d4-4ff6-80d6-c1a19767fdcd')
) AS v(name, url)
WHERE EXISTS (SELECT 1 FROM "markets")
ON CONFLICT ("url") DO NOTHING;
--> statement-breakpoint
INSERT INTO "market_guides" ("market_id", "summary", "transportation", "parking", "status", "reviewed_at")
SELECT m.id, v.summary, v.transportation, v.parking, 'reviewed', v.reviewed_at::date FROM (VALUES
  ('market-a73adeabfa3f38f0', '삼천포중앙시장은 사천 삼천포 지역의 중심 상권에 자리한 상설시장으로, 원본 데이터에는 끝자리 4·9일 장날이 함께 기록되어 있습니다. 한국관광공사는 바다와 가까워 수산물·건어물 도매 상점이 많아 비교적 저렴하게 장을 볼 수 있고, 농산물과 과일도 살 수 있다고 소개합니다.', '기본 데이터의 주소는 경상남도 사천시 중앙시장2길 37(선구동)입니다. 관광공사 소개처럼 바다와 가까워 수산시장 일정과 묶기 좋습니다.', '원본 시장 데이터에는 주차 가능한 시장으로 기록되어 있습니다. 관광공사 자료에는 주차장 위치나 요금이 없어 4·9일 장날에는 현장 안내를 따르세요.', '2026-10-29'),
  ('market-ef1ad4aee9150cfa', '고흥전통시장은 고흥읍 한가운데에 있어 끝자리 4·9일 장날마다 상인과 군민으로 붐비는 시장입니다. 한국관광공사는 이른 아침부터 오후까지 식료품과 의류를 주로 팔고, 우시장은 읍 외곽의 넓은 터로 옮겨 갔으며, 숯불에 구운 생선이 이 시장의 대표 먹거리라고 소개합니다.', '기본 데이터의 주소는 전라남도 고흥군 고흥읍 시장길 1(남계리)입니다. 관광공사 소개처럼 고흥읍 중심에 있습니다.', '원본 시장 데이터에는 주차 가능한 시장으로 기록되어 있습니다. 관광공사 소개에는 주차 정보가 없으니 고흥읍 장날에는 시장(061-833-3203)이나 현장 안내로 확인하세요.', '2026-10-29'),
  ('market-4de8c16f3d14c7cf', '일로전통시장은 영산강 하류 무안 일로읍에서 끝자리 1·6일에 서는 시장입니다. 한국관광공사는 조선 전기에 열린 장의 전통을 잇고, 호남선이 지나는 일로를 중심으로 상권을 지켜 왔으며, 장날에는 인근 주민까지 약 2만 명이 찾는다고 소개합니다.', '기본 데이터의 주소는 전라남도 무안군 일로읍 시장길 11-22(월암리)입니다. 관광공사 소개처럼 호남선 일로역이 있는 읍내에 자리합니다.', '원본 시장 데이터에는 주차 가능한 시장으로 기록되어 있습니다. 장날 방문객이 많다고 소개된 곳이라 1·6일에는 읍내 주차가 붐빌 수 있어 일찍 도착하는 편이 낫습니다.', '2026-10-29'),
  ('market-4e62b34ad5d7cd60', '녹차골보성향토시장은 보성읍에서 끝자리 2·7일에 서는 보성장입니다. 한국관광공사는 조선 후기에 열린 우시장, 특히 송아지 거래로 이름난 장에서 출발해 1970년대에는 진주·남원에서도 소를 몰고 왔고, 2011년 아케이드를 갖춘 현대식 시장으로 단장했다고 소개합니다.', '기본 데이터의 주소는 전라남도 보성군 보성읍 현충로 42-1(원봉리)입니다. 보성 읍내에 있어 녹차밭 일정 전후로 들르기 좋습니다.', '원본 시장 데이터에는 주차 가능한 시장으로 기록되어 있습니다. 관광공사 소개에는 주차장 정보가 없어 2·7일 장날에는 현장 안내를 확인하세요.', '2026-10-29'),
  ('market-7b18a4915ec952a7', '남지시장은 창녕 남지읍에서 매월 2·7·12·17·22·27일에 서는 장입니다. 한국관광공사는 이곳이 시설채소로 유명해 장날이면 인근 비닐하우스에서 난 채소가 대량으로 나오고 외지 상인도 몰리며, 산지와 가까워 채소를 싸게 살 수 있다고 소개합니다.', '기본 데이터의 주소는 경상남도 창녕군 남지읍 본동길 4(남지리)입니다. 낙동강과 가까운 남지 읍내 중심에 있습니다.', '원본 시장 데이터에는 주차 가능한 시장으로 기록되어 있습니다. 외지 상인이 몰리는 2·7일 장날에는 주차가 붐빌 수 있어 현장 안내를 확인하세요.', '2026-10-29'),
  ('market-750f14ffa93fe86f', '문산시장은 진주 문산읍에서 매월 4·9·14·19·24·29일에 서는 오일장입니다. 한국관광공사는 예전부터 장터가 있었으나 인근에 상설시장이 생기며 오일장이 줄었고, 규모는 작아도 장날에는 주민이 직접 기른 채소·과일·곡식을 판다고 소개합니다.', '기본 데이터의 주소는 경상남도 진주시 문산읍 소문길 68(소문리)입니다. 관광공사는 진주 고속버스터미널과 진주역에서 6km 이내라고 안내합니다.', '원본 시장 데이터에는 주차 가능한 시장으로 기록되어 있습니다. 관광공사 소개에는 주차 정보가 없어 문산읍 장날에는 현장 안내를 따르세요.', '2026-10-29'),
  ('market-b420843dee9afa83', '옥종공설시장은 하동 옥종면에서 끝자리 3·8일에 서는 오일장입니다. 한국관광공사는 한국전쟁 뒤인 1953년에 개설해 1996년 2월 개축했고, 옥종·북천·청암·수곡면과 산청 주민까지 이용하며, 지리산 농산물과 임산물, 사천·진교에서 들어온 해산물을 판다고 소개합니다.', '기본 데이터의 주소는 경상남도 하동군 옥종면 옥종사장길 5(청룡리)입니다. 하동 북부 내륙 면 소재지에 있어 산청 방면 일정과 이어 가기 좋습니다.', '원본 시장 데이터에는 주차 가능한 시장으로 기록되어 있습니다. 관광공사 자료에는 일반 주차 안내가 없어 3·8일 장날에는 면 소재지 현장 안내를 확인하세요.', '2026-10-29'),
  ('market-f74d08ff24b86099', '진영전통시장은 김해 진영읍에서 1935년부터 이어 온 재래시장으로, 매달 끝자리 4·9일에 장이 섭니다. 한국관광공사는 진영 단감으로 알려진 시장이며, 인근 농촌에서 기른 농산물을 직접 팔아 비교적 싸고, 점포가 가지런해 처음 와도 장보기가 편하다고 소개합니다.', '기본 데이터의 주소는 경상남도 김해시 진영읍 진영산복로115번길 9(진영리)입니다. 진영 읍내 중심에 있습니다.', '원본 시장 데이터에는 주차 가능한 시장으로 기록되어 있습니다. 관광공사 소개에는 주차 안내가 없으니 4·9일 장날에는 시장(055-343-6493)이나 현장 안내로 확인하세요.', '2026-10-29'),
  ('market-f6fe35229e9ea6c0', '시종5일시장은 영암 시종면에서 매월 2·7·12·17·22·27일에 서는 시장입니다. 한국관광공사는 1969년 10월 12일 개설해 1998년 장옥을 새로 단장했고, 대지 3,873㎡에 점포 62동이 있으며, 이른 새벽 마을버스가 닿을 때부터 해질 무렵까지 장이 선다고 소개합니다.', '기본 데이터의 주소는 전라남도 영암군 시종면 내동중앙로 26(만수리)입니다. 영암 북서쪽 면 소재지에 있습니다.', '원본 시장 데이터에는 주차 가능한 시장으로 기록되어 있습니다. 관광공사 자료에는 주차 세부 정보가 없어 2·7일 장날에는 현장 안내를 확인하세요.', '2026-10-29'),
  ('market-e94bd09af9785a9c', '화령시장은 상주 화서면에서 1965년 2월 18일 문을 연 시장으로, 지금도 끝자리 3·8일에 오일장이 섭니다. 한국관광공사는 개장 무렵에는 큰 시장이었으나 1980년대 유통시장 개방과 농촌 인구 감소로 줄어, 장날 이용객이 100여 명 정도라고 소개합니다.', '기본 데이터의 주소는 경상북도 상주시 화서면 화령남6길 7(신봉리)입니다. 상주 서쪽 화서면 소재지에 있습니다.', '원본 시장 데이터에는 주차 가능한 시장으로 기록되어 있습니다. 관광공사 자료에는 주차 세부 정보가 없어 현장 안내를 따르세요.', '2026-10-29'),
  ('market-e25aed5a6852c4e4', '고창전통시장은 끝자리 3·8일에 서는 고창읍내장입니다. 한국관광공사는 『동국문헌비고』에 3·8일 장이 기록되어 있어 1770년대 이전부터 오일장이 섰다고 볼 수 있고, 조선 말 서부·동부시장으로 나뉘었다가 한국전쟁 뒤 서부시장 한 곳으로 합쳐졌다고 소개합니다.', '기본 데이터의 주소는 전북특별자치도 고창군 고창읍 동리로 62-11(읍내리)입니다. 고창읍성 북서쪽 읍내에 있습니다.', '원본 시장 데이터에는 주차 가능한 시장으로 기록되어 있습니다. 관광공사 소개에는 주차 정보가 없으니 시장(063-564-3097)이나 현장 안내로 확인하세요.', '2026-10-29'),
  ('market-4facf5c16ca9e841', '양수리전통시장은 북한강과 남한강이 만나는 양평 양서면의 시장으로, 매월 1·6일에 시장 입구에서 민속 오일장이 열립니다. 한국관광공사는 양평 3대 전통시장 가운데 하나로, 옛 양수리 나루터에서 비롯해 정선·단양과 뚝섬·마포나루를 잇는 물길 덕분에 번창했다고 소개합니다.', '기본 데이터의 주소는 경기도 양평군 양서면 양수로150번길 3-15(양수리)입니다. 관광공사는 서울에서 약 40분 거리라고 안내합니다.', '관광공사는 시장 입구에 넓은 주차장과 택시 승강장이 있다고 소개합니다. 요금과 면수는 원문에 없어 두물머리 나들이객이 몰리는 주말 장날에는 일찍 가는 편이 낫습니다.', '2026-10-29')
) AS v(legacy_id, summary, transportation, parking, reviewed_at)
JOIN "markets" AS m ON m.legacy_id = v.legacy_id
ON CONFLICT ("market_id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "market_guide_tips" ("guide_id", "position", "body")
SELECT g.id, v.position, v.body FROM (VALUES
  ('market-a73adeabfa3f38f0', 0, '관광공사는 인근 종합시장·서부시장과 함께 둘러보면 볼거리가 많다고 안내합니다. 건어물은 무게가 가벼워 여러 시장을 돈 뒤 마지막에 사도 부담이 적습니다.'),
  ('market-a73adeabfa3f38f0', 1, '관광공사 무장애 정보에는 장애인 화장실과 전용 주차구역이 없고 주출입구에 단차가 있다고 나옵니다. 휠체어·유모차 이용자는 방문 전 시장(055-834-8676)에 확인하세요.'),
  ('market-ef1ad4aee9150cfa', 0, '관광공사는 간척지 쌀, 마늘, 유자, 석류 같은 고흥 특산물과 청정 연안의 제철 해산물을 이 시장의 볼거리로 꼽습니다.'),
  ('market-ef1ad4aee9150cfa', 1, '장이 오후까지 서는 것으로 소개되어 있어, 숯불 생선구이로 점심을 먹으려면 오전에 도착하는 동선을 제안합니다.'),
  ('market-4de8c16f3d14c7cf', 0, '관광공사는 1980년대 일로시장에서 1인극 ''품바''가 탄생해 전국적인 인기를 끌었다고 전합니다. 장 구경에 이 이야기를 곁들이면 시장이 더 재미있게 보입니다.'),
  ('market-4de8c16f3d14c7cf', 1, '관광공사는 가축시장인 소전이 이 시장과 함께 지역을 대표한다고 소개합니다. 소전 운영 여부와 날짜는 원문에 없어 방문 전 현지에 확인하세요.'),
  ('market-4e62b34ad5d7cd60', 0, '관광공사는 현대식 건물과 함께 녹돈 전문 시장, 특산물 판매장, 공연장을 갖췄다고 소개합니다. 보성 녹차 여행 길에 녹돈 코너를 들러 보세요.'),
  ('market-4e62b34ad5d7cd60', 1, '관광공사는 녹차 떡갈비와 꼬막비빔밥을 맛볼 수 있는 식당을 함께 소개합니다. 가게 이름과 영업 여부는 바뀔 수 있어 현장에서 확인하세요.'),
  ('market-7b18a4915ec952a7', 0, '관광공사는 낙동강변 평야에서 쌀·보리·복숭아와 함께 고추, 양파, 마늘, 참깨가 난다고 소개합니다. 양념 채소를 넉넉히 사려면 장날 오전이 좋습니다.'),
  ('market-7b18a4915ec952a7', 1, '관광공사는 남지의 누에고치 생산량이 군에서 가장 많고, 강 포구를 끼고 농산물 거래가 활발하다고 전합니다. 낙동강 쪽 풍경과 함께 둘러보세요.'),
  ('market-750f14ffa93fe86f', 0, '관광공사는 문산성당, 월산재 같은 문화유적과 함께 둘러보기 좋다고 안내합니다. 장 구경은 짧게 하고 읍내 유적 산책을 곁들이는 일정을 제안합니다.'),
  ('market-750f14ffa93fe86f', 1, '주민이 직접 내다 파는 소량 농산물이 중심이라, 원하는 품목은 이른 시간에 사는 편이 낫습니다.'),
  ('market-b420843dee9afa83', 0, '관광공사는 비닐하우스에서 기른 옥종딸기와 토마토가 유명하다고 소개합니다. 3·8일 장날에 맞춰 가 보세요.'),
  ('market-b420843dee9afa83', 1, '산과 바다 물건이 함께 나오는 장이라, 임산물은 먼저 사고 해산물은 마지막에 사는 동선을 제안합니다.'),
  ('market-f74d08ff24b86099', 0, '관광공사는 국밥, 떡볶이, 족발, 뻥튀기를 시장 먹거리로 꼽고, 장날이 아니어도 횟집·채소·보리밥집·꽃가게가 문을 여는 상설시장이 있다고 안내합니다.'),
  ('market-f74d08ff24b86099', 1, '관광공사는 근처 봉하마을 생태문화공원과 함께 둘러보기 좋다고 소개합니다.'),
  ('market-f6fe35229e9ea6c0', 0, '관광공사는 농산물이 풍부하고 골짜기에서 캔 산채와 제철 과일이 나오며, 여름에는 수박이 특히 인기라고 소개합니다.'),
  ('market-f6fe35229e9ea6c0', 1, '관광공사는 시골 주민들이 소식을 나누는 장소로 이용된다고 전합니다. 이른 오전에 가야 마을에서 나온 물건을 고루 볼 수 있습니다.'),
  ('market-e94bd09af9785a9c', 0, '관광공사가 소개하는 거래 품목은 농산물, 의류, 잡화입니다. 규모가 작은 시골장이라 짧게 둘러보는 일정으로 잡으세요.'),
  ('market-e94bd09af9785a9c', 1, '이용객이 적은 장이라 노점 수가 날마다 다를 수 있습니다. 먼 길이라면 출발 전 면사무소나 현지에 장이 서는지 확인하세요.'),
  ('market-e25aed5a6852c4e4', 0, '관광공사는 고창천을 사이에 두고 장터가 길게 이어지며 채소전, 가축전, 어물전, 잡화전, 과일전으로 나뉜다고 안내합니다. 개천을 따라 구역별로 걸어 보세요.'),
  ('market-e25aed5a6852c4e4', 1, '관광공사는 현대화로 옛 모습은 거의 남지 않았고 상설시장과 오일장을 함께 운영한다고 전합니다. 장날이 아닌 날에도 상설 점포는 둘러볼 수 있습니다.'),
  ('market-4facf5c16ca9e841', 0, '관광공사는 두물머리와 세미원이 바로 곁에 있다고 안내합니다. 산책 전후로 장을 보면 동선이 깔끔합니다.'),
  ('market-4facf5c16ca9e841', 1, '관광공사는 아케이드 공사를 마쳐 장보기가 편해졌고, 음식·생활용품·의류·신발을 판다고 소개합니다.')
) AS v(legacy_id, position, body)
JOIN "markets" AS m ON m.legacy_id = v.legacy_id
JOIN "market_guides" AS g ON g.market_id = m.id
ON CONFLICT ("guide_id", "position") DO NOTHING;
--> statement-breakpoint
INSERT INTO "market_guide_sources" ("guide_id", "source_id", "checked_at", "position")
SELECT g.id, s.id, v.checked_at::date, v.position FROM (VALUES
  ('market-a73adeabfa3f38f0', 'https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y', '2026-09-21', 0),
  ('market-a73adeabfa3f38f0', 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=13103f75-362b-4fc9-8ae9-adf41062aa99', '2026-10-29', 1),
  ('market-ef1ad4aee9150cfa', 'https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y', '2026-09-21', 0),
  ('market-ef1ad4aee9150cfa', 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=a64d836f-3a9c-4e69-aafd-87e4dbcf9835', '2026-10-29', 1),
  ('market-4de8c16f3d14c7cf', 'https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y', '2026-09-21', 0),
  ('market-4de8c16f3d14c7cf', 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=87cf1800-1998-4ed0-8568-8d573a15a8a2', '2026-10-29', 1),
  ('market-4e62b34ad5d7cd60', 'https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y', '2026-09-21', 0),
  ('market-4e62b34ad5d7cd60', 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=856eb86b-0cae-47ad-91f2-0c7cd0a71da8', '2026-10-29', 1),
  ('market-7b18a4915ec952a7', 'https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y', '2026-09-21', 0),
  ('market-7b18a4915ec952a7', 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=b5f5e2c9-7250-471b-9192-6c869a0ad874', '2026-10-29', 1),
  ('market-750f14ffa93fe86f', 'https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y', '2026-09-21', 0),
  ('market-750f14ffa93fe86f', 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=d68eab8f-511f-4773-a7b9-32ede66f4887', '2026-10-29', 1),
  ('market-b420843dee9afa83', 'https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y', '2026-09-21', 0),
  ('market-b420843dee9afa83', 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=a91da9cf-3108-44f0-9473-b5d8f335a6f2', '2026-10-29', 1),
  ('market-f74d08ff24b86099', 'https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y', '2026-09-21', 0),
  ('market-f74d08ff24b86099', 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=96dcce48-1fe6-4fcb-b5cf-57bd7077142d', '2026-10-29', 1),
  ('market-f6fe35229e9ea6c0', 'https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y', '2026-09-21', 0),
  ('market-f6fe35229e9ea6c0', 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=4c20c7d8-cc9b-491f-8312-4a2dec7c2f18', '2026-10-29', 1),
  ('market-e94bd09af9785a9c', 'https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y', '2026-09-21', 0),
  ('market-e94bd09af9785a9c', 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=55bdd79e-5847-4b61-b208-688048cfabf7', '2026-10-29', 1),
  ('market-e25aed5a6852c4e4', 'https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y', '2026-09-21', 0),
  ('market-e25aed5a6852c4e4', 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=969feea4-9762-4ac8-b6a9-9bae77e3d34b', '2026-10-29', 1),
  ('market-4facf5c16ca9e841', 'https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y', '2026-09-21', 0),
  ('market-4facf5c16ca9e841', 'https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=5705faf0-80d4-4ff6-80d6-c1a19767fdcd', '2026-10-29', 1)
) AS v(legacy_id, url, checked_at, position)
JOIN "markets" AS m ON m.legacy_id = v.legacy_id
JOIN "market_guides" AS g ON g.market_id = m.id
JOIN "sources" AS s ON s.url = v.url
ON CONFLICT DO NOTHING;
--> statement-breakpoint
INSERT INTO "market_highlights" ("market_id", "name", "category", "origin")
SELECT m.id, v.name, v.category, 'editorial' FROM (VALUES
  ('market-a73adeabfa3f38f0', '건어물 도매', 'specialty'),
  ('market-a73adeabfa3f38f0', '삼천포 수산물', 'specialty'),
  ('market-a73adeabfa3f38f0', '주변 종합·서부시장', 'tip'),
  ('market-ef1ad4aee9150cfa', '숯불 생선구이', 'food'),
  ('market-ef1ad4aee9150cfa', '고흥 유자·석류', 'specialty'),
  ('market-ef1ad4aee9150cfa', '간척지 쌀·마늘', 'specialty'),
  ('market-4de8c16f3d14c7cf', '품바 탄생지', 'sight'),
  ('market-4de8c16f3d14c7cf', '영산강 농산물', 'specialty'),
  ('market-4de8c16f3d14c7cf', '1·6일 오일장', 'tip'),
  ('market-4e62b34ad5d7cd60', '보성 녹돈', 'specialty'),
  ('market-4e62b34ad5d7cd60', '녹차 떡갈비·꼬막비빔밥', 'food'),
  ('market-4e62b34ad5d7cd60', '옛 우시장 이야기', 'sight'),
  ('market-7b18a4915ec952a7', '남지 시설채소', 'specialty'),
  ('market-7b18a4915ec952a7', '고추·양파·마늘', 'specialty'),
  ('market-7b18a4915ec952a7', '2·7일 오일장', 'tip'),
  ('market-750f14ffa93fe86f', '주민 직판 채소·곡식', 'specialty'),
  ('market-750f14ffa93fe86f', '문산성당', 'sight'),
  ('market-750f14ffa93fe86f', '4·9일 오일장', 'tip'),
  ('market-b420843dee9afa83', '옥종딸기·토마토', 'specialty'),
  ('market-b420843dee9afa83', '지리산 임산물', 'specialty'),
  ('market-b420843dee9afa83', '사천·진교 해산물', 'specialty'),
  ('market-f74d08ff24b86099', '진영 단감', 'specialty'),
  ('market-f74d08ff24b86099', '국밥·족발', 'food'),
  ('market-f74d08ff24b86099', '봉하마을 생태문화공원', 'sight'),
  ('market-f6fe35229e9ea6c0', '여름 수박', 'specialty'),
  ('market-f6fe35229e9ea6c0', '골짜기 산채', 'specialty'),
  ('market-f6fe35229e9ea6c0', '제철 과일', 'specialty'),
  ('market-e94bd09af9785a9c', '시골 농산물', 'specialty'),
  ('market-e94bd09af9785a9c', '의류·잡화', 'specialty'),
  ('market-e94bd09af9785a9c', '3·8일 오일장', 'tip'),
  ('market-e25aed5a6852c4e4', '고창천 장터길', 'sight'),
  ('market-e25aed5a6852c4e4', '구역별 전(채소·어물·과일)', 'tip'),
  ('market-e25aed5a6852c4e4', '3·8일 오일장', 'tip'),
  ('market-4facf5c16ca9e841', '두물머리·세미원', 'sight'),
  ('market-4facf5c16ca9e841', '1·6일 민속오일장', 'tip'),
  ('market-4facf5c16ca9e841', '나루터 시장 이야기', 'sight')
) AS v(legacy_id, name, category)
JOIN "markets" AS m ON m.legacy_id = v.legacy_id
ON CONFLICT ("market_id", "name") DO NOTHING;
