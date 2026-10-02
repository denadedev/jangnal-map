# 시장 30곳 콘텐츠 출처 점검 — 2026-10-02

아래는 세 묶음으로 수행한 출처 조사 기록이다. 조사 결과를 `apps/web/public/data/market-editorial.json`에 통합했다. 원본 공공데이터를 새로 내려받은 작업은 아니며 기존 데이터 출처 확인일은 보존했다. 편집 확인일과 자료 자체의 작성일, 현장 영업 확인을 구분한다.

통합 시 수정: 나주 주소는 직접 읽은 관광공사 안내에만 귀속시켰다. 방문 조언에 불필요한 보장 문구와 기존 편집 과정 언급을 덜었다. 서귀포향토오일시장은 공식 4·9일장을 공개 데이터와 생성기에 반영하고, 기존 URL ID/주소/원본 기준일을 보존했다. 새 `scheduleSource` 필드로 일정 정정 근거와 확인일을 따로 표시한다.

상설시장에 정기휴무가 있다는 근거가 확인되어, 공공데이터만으로 `오늘 운영`이라고 단정하던 상세 화면 표기를 제거했다. 카탈로그의 daily는 정규 상설 일정이며 모든 점포의 실제 영업 여부를 뜻하지 않는다.

이하 조사 원본의 임시 파일·저장소 변경 여부는 조사자가 자료를 넘기던 시점의 기록이다.

# 시장 편집 감사 A — 2026-10-02 KST

범위: `market-editorial.json` index 0–9. 저장소 원본은 수정하지 않았으며, 제안 결과는 `/tmp/jangnal-editorial-a.json`에 저장했다.

## 공통 원칙과 한계

- 원본 전국전통시장표준데이터 링크 `https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y` 및 checkedAt `2026-09-21`를 모든 행에서 유지했다. 이번에는 원자료 다운로드/갱신을 수행하지 않았다. 기존 주소·주차장 보유 여부만 활용하는 경우 본문에 기본 데이터임을 표시했다.
- reviewedAt은 실제 편집 검토일인 2026-10-02다. 신규 sources의 checkedAt은 해당 상세 페이지 본문을 실제 읽은 날짜다. 검색 결과만 확보하고 원문 접근에 실패한 페이지는 신규 확인 출처로 싣지 않았다.
- 방문 체험, 영업 중 보장, 대기시간, 차량 소요시간, 노선 최신성, 요금 변경 여부를 추정하지 않았다. 동선·구매 순서·가격표 확인 등은 편집상 제안이며 조사자의 방문 후기나 시장의 규칙이 아니다.
- 한국관광공사 페이지의 접근성 아이콘은 실제 서술과 모순되거나 반복 기본값처럼 나타났다. 접근성 단정에 사용하지 않았다.
- 아래 모든 판매품목은 안내된 품목이지 당일 모든 점포의 재고를 뜻하지 않는다.

## 0. 북평민속시장 — market-46dd8e03711ba7b6

- 채택 원문: https://korean.visitkorea.or.kr/detail/rem_detail.do?cotid=5ae30f2f-607a-4569-9cde-6c501a81b9d6 (본문 직접 열람, 2025년 2월 작성 사실을 source 이름과 교통 안내에 표시).
- 검증: 끝자리 3·8일 오일장, 길을 따라 좌판이 서는 형태, 해산물·채소·생활용품, 문화광장 인근 소머리국밥거리, 북평우체국/북평농협 정류장, 시장 공영주차장. 국밥집별 국물 방식 차이도 원문에 명시된다.
- 기존 3·8일장/수산물/계절 농산물은 유지하고 국밥거리와 노점형 장터라는 구체성을 보강했다. 오일장길 32는 원자료 주소임을 표시했다.
- 기존 관광지 페이지 https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=1b7a1e40-ec2a-4f13-abbb-787201560936 는 직접 요청 타임아웃. 검색 결과에는 현재도 우시장이 열리는 듯한 오래된 문장이 있으나 더 최신 기사에서는 2008년 이전했다고 설명한다. 우시장 현행 운영을 쓰지 않고 검증한 상세 기사로 교체했다.
- 최신 버스 번호·배차·요금은 확인하지 않아 기재하지 않았다. 기사에 포함된 2025년 행사 날짜도 재사용하지 않았다.

## 1. 속초종합중앙시장 — market-c3983f871839ecc8

- 채택 원문: https://www.sokcho.go.kr/ct/tour/pleasure/shopping?contentSeq=131 (web open은 타임아웃, 이후 urllib 정상 HTTPS 응답으로 실제 본문 열람).
- 검증: 중앙로147번길 16, 청과·고추·순대·젓갈어시장·닭전 골목, 지하 회센터, 닭강정·젓갈·건어물, 주차장/주차권 이용. 시장 전체 연중개방과 회센터 둘째 주 수요일 휴무가 별개임을 확인했다.
- 기존 ‘관광형 상설시장’ 설명을 중앙시장 관광 상권의 일부로 조심스럽게 표현했다. 속초종합중앙시장과 관광수산시장 권역 전체의 법적 등록 명칭이 완전히 동일하다고 단정하지 않았다.
- 삭제/축소: 기존 공식 홈페이지 https://sokchotm.com/default/ 는 502 및 인증서 hostname mismatch로 읽지 못했다. ‘350대’, 공식 주소 12 병기, 자세한 무료주차 조건은 삭제했다.
- https://sokcho-central.co.kr/ 에서는 350대·1만원·1시간 정보가 확인되지만 상업시설 홍보가 섞여 있고 상인회 공식성도 확실하지 않아 채택하지 않았다. 오징어순대는 이 페이지에는 있지만 시 관광 상세에서는 직접 확인하지 못해 핵심 특산물에서는 뺐다.
- 시의 주차권 소개는 무료시간/최소구매액을 확정하지 않으므로 구매 시 확인하도록 표현했다.

## 2. 용인중앙시장 — market-389b4a24f06ccd11

- 채택 원문: https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=853c710b-9bc1-443b-b8a7-4a354004495e (직접 열람; 떡·순대·잡화 골목, 공영주차장 조성).
- 채택 원문: https://www.yongin.go.kr/user/bbs/BD_selectBbs.do?q_bbsCode=1076&q_bbscttSn=20260210112557706&q_clCode=1 (직접 열람; 상설 운영과 매월 5·10·15·20·25·30일 장날).
- 역명 교차 확인: https://pts.map.naver.com/end-subway/ends/web/1711/home (네이버 지도 직접 열람; 에버라인 용인중앙시장역 및 금학로 409). 정부·관광공사 이외 보조 출처로 현 역명 확인에만 사용했다.
- 용인시 도서관사업소 https://lib.yongin.go.kr/ 의 검색 색인에서도 ‘용인중앙시장역스마트도서관’, 금학로 409가 확인된다. 페이지에서 해당 동적 구역이 추출되지 않아 source checkedAt에는 추가하지 않았다.
- 핵심 교정: 관광공사 문서에 남아 있는 운동장·송담대역 명칭을 현재 용인중앙시장역으로 바꿨다. 역사적 개명 날짜는 조사하지 않았으므로 날짜는 쓰지 않았다.
- 기존 먹거리/상설+오일장 특징을 유지. 불명확한 ‘시장 주변 주차’가 노상 주차 허용처럼 읽히지 않도록 공영주차장 안내로 축소했다. 현행 요금/할인 미확인.

## 3. 광명전통시장 — market-d8d1a37e4d63609b

- 채택 원문: https://www.gm.go.kr/tour/gmNine/nine02.jsp (직접 열람).
- 검증: 1970년대 초 형성, 인접 의류·가구 상권, 광이로13번길 17-5, 7호선 광명사거리역, 광명로 938 및 광명로928번길 11의 주차장 두 곳, 시장 발급 주차권 최초 30분 감면/중복 할인 불가.
- 기존 ‘350여 개 점포’는 시 안내의 약 400개와 다르므로 가변 점포 수를 삭제했다. 전국 7위 등 순위도 검증기준 없이 재사용하지 않았다.
- 기존 한국관광공사 URL은 직접 열람 타임아웃. 실제 읽은 시 상세 페이지로 교체했다. 버스 번호와 전체 요금표는 변경 가능성과 불필요한 복잡성을 고려해 기재하지 않았다.
- 기존 농수산물/식료품 일반 표현은 원문에서 세부 품목까지 이번에 확인하지 않아 종합 장보기로 정리했다. 먹자골목은 인접 상권임을 고려해 시장의 고유 먹거리처럼 나열하지 않았다.

## 4. 광장시장 — market-f9785614947c1065

- 채택 원문: https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=242c556a-2365-47b9-be5c-ea36d8db3663 (직접 열람; 1905년, 한복·직물·침구, 동문·북2문·남1문 사이 먹거리장터).
- 채택 원문: https://korean.visitseoul.net/Tourist-Attractions-list1/%EA%B4%91%EC%9E%A5%EC%8B%9C%EC%9E%A5/KOP000286 (직접 열람; 페이지 수정일 2026-09-10; 빈대떡·김밥·육회, 종로5가역 8번 출구, 종묘 공영주차장, 일반 일요일 휴무/먹자골목 연중무휴).
- 기존 1905년과 상품군 유지. ‘마약김밥’은 소스와 먹는 김밥으로 평이하게 정리. 을지로4가역 경로는 이번 채택 교통 출처에 없어 생략했다.
- 가장 유용한 보강은 일요일의 업종별 운영 차이와 구체적인 외부 주차장 명칭이다. 일반 상가와 모든 개별 점포의 일정을 동일시하지 않는다.
- 관광공사 서술의 ‘국내 최초’, 역사 해석 등은 교차 검증하지 않아 확대하지 않았다. 서울관광재단 페이지 하단의 Tripadvisor 후기는 사실 출처로 사용하지 않았다.

## 5. 경동시장 — market-5207a19f315d3216

- 채택 원문: https://korean.visitseoul.net/dongdaemun-around/kyungdong-market/KOP3rjtd6 (직접 열람; 1960년 개설, 농산물, 인삼·한약재, 고산자로36길 3, 제기동역 2번 출구).
- 삭제/교정: 기존 한국관광공사 주차 가능·유료 단정. 관광공사 LOD https://data.visitkorea.or.kr/linkedview/948730 검색 색인은 ‘주차시설 불가능’인데, 서울관광재단은 장애인 전용 주차장 아이콘을 표시하고 열린관광 페이지는 주차장 경사로를 안내한다. 정의·구역 차이가 해소되지 않아 주차장을 확정하지 않았다.
- LOD 원문은 503, 기존 한국관광공사 상세 URL은 타임아웃. 두 URL을 새 확인 출처로 표시하지 않았다.
- 옛 경동극장/청년 상권은 관광공사 새 상세 URL 검색 결과 및 서울시 시민기자 글에서 확인되나 이번에는 안정적으로 읽은 시장 핵심 출처의 농산물·인삼·약재로 집중했다. 특정 문화시설의 현재 운영을 보장하지 않는다.
- ‘오전 방문’은 모든 점포 영업에 대한 근거가 없어 점포 확인 안내로 바꿨다. 청량리역 접근도 핵심 확인 경로인 제기동역으로 축소했다.

## 6. 소래포구전통어시장 — market-a977f620b61db85b

- 채택 원문: https://itour.incheon.go.kr/ssst/ssst/detail.do?cotId=ITD21122814501472898 (직접 열람; 최종수정 2026-09-29).
- 검증: 소래포구 관광권의 새우·꽃게·젓갈, 포구 역사, 유료 주차. 관광권 대표 주소 포구로 2-6은 전통어시장 데이터 주소 장도로 86-17과 다르다.
- 기존 설명은 포구 전체 출처를 개별 어시장 운영 안내처럼 읽을 여지가 있어 범위를 명시했다. 24시간/연중무휴는 포구 관광지 안내이며 개별 상점 운영시간으로 옮기지 않았다. ‘새우 파시 역사’는 출처에서 확인되지만 짧은 구매 안내에 집중해 특산물 목록에서는 제거했다.
- https://www.soraesijang.com/ 은 403, https://soraemall.com/ 및 www 변형은 502/만료 인증서로 본문 확인 실패. 상인회 사이트와 카카오채널의 검색 색인에서 시장 주소와 수산물 품목은 확인되지만 오늘 원문 확인한 출처로 추가하지 않았다.
- 한계: 정확한 시장별 전용 주차장, 구매 할인, 지하철 출구, 점포별 시간은 확인하지 못했다. 구체적인 시장 출처를 추가하려면 운영자 연락 또는 접근 가능한 상인회 자료가 필요하다. 현재는 기존 시장 데이터+공식 포구 상세 페이지 조합이며 범위를 본문에 공개했다.

## 7. 세종전통시장 — market-a096b1a38138db75

- 채택 원문: https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=b999314d-9ff1-480d-90df-3b751129bad8 (직접 열람; 1931년, 2013년 통합, 4·9일장, 수제 만두·씨앗호떡, 조치원 테마거리).
- 채택 원문: https://sjfmc.or.kr/kor/sub04_06_01.do (직접 열람 및 본문 find; 제1 새내로99/제2 조치원6길38/제3 정리110-5).
- 기존 ‘90년 전통’ 대신 기준연도 변화에 강한 1931년을 사용. 통합 시기와 시장명을 구체적으로 설명했다. 먹거리와 테마거리 기존 주장은 확인해 유지했다.
- 이전의 추상적인 주차 가능 안내를 실제 운영기관의 주차장명·주소로 교체했다. 주차면수/무료시간을 시장 전체에 일괄 적용하지 않았다.
- 주소는 원 데이터와 관광공사 여행기사 검색 결과가 일치하나 최신 원자료 재검증은 수행하지 않았다. 신도심과 조치원 구분은 주소에 근거한 편집상 길찾기 제안이다.

## 8. 공주산성시장 — market-46fa9022c9bff08d

- 채택 원문: https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=d47ae1d6-e149-4d73-8ca8-6f002e67673a (직접 열람; 1937년, 공산성 아래, 문화관광형 시장).
- 채택 원문: https://data.visitkorea.or.kr/page/2613453 (직접 열람; 밤·밤과자·밤막걸리·올방떡, 용당길22, 주차 가능, 주차 이용권, 주말이라도 장날이면 과금 예외).
- 기존 알밤 먹거리는 공식 품목 자료로 구체화했다. 공산성 연계는 유지하되 가깝다는 이유로 같은 입구나 정해진 도보 분수를 만들지 않았다.
- 야시장 관련 2026년 공주시 입찰 공고는 검색으로 확인했으나 실제 개최일/당일 운영 근거가 아니어서 채택 출처와 일정에 쓰지 않았다. 기존 ‘시장 행사’를 상시 특산물처럼 나열하는 대신 별도 일정 확인 팁으로 표현했다.
- 현행 주차 요금 갱신 여부를 알 수 없어 액수 없이 장날 예외만 출처 귀속으로 소개했다. ‘공주 유일의 장터’ 및 연중 행사 단정은 제외했다.

## 9. 충주자유시장 — market-a3999c03b9b3e221

- 채택 원문: https://korean.visitkorea.or.kr/detail/rem_detail.do?cotid=1f390d1d-6f63-4c6b-8b53-737dc3e1a0b2 (직접 열람).
- 검증: 충주천 주변 자유·무학·공설·충의·풍물시장 상권, 자유시장의 의류·주단·포목, 무학시장과 공설시장 사이 순대만두골목, 주변 감자떡/분식.
- 기존 ‘세 시장이 합쳐진 특징’과 충인상가 언급은 이 출처에 근거가 없어 삭제했다. 5개 시장이 인접한 것과 법적·운영상 통합은 다르다.
- 순대/감자떡을 자유시장의 독점적인 대표 먹거리로 단정하지 않고 주변 시장의 먹거리 동선으로 구분했다.
- 기존 ‘1만원 이상 구매 시 무료 주차권’은 공식 채널 URL이 없었고 이번 조사에서도 검증하지 못해 삭제하고 미확인 사실을 명시했다. 충인6길16/주차보유는 기존 데이터에 귀속했다.
- 충청북도 자유시장 소개의 검색 결과는 확인했으나 실제 페이지 요청은 502/접속 리셋 또는 내용 없는 응답으로 실패해 신규 출처로 추가하지 않았다.
- 관광공사 기사의 음료·만두 가격, 영화관 운영 및 할인은 오래된 운영정보일 수 있어 재사용하지 않았다. 시장 상권의 구조와 품목에만 제한해서 사용했다.


# Editorial audit: entries 10–19

Research date: 2026-10-02 KST. Desk research, not an on-site visit. Only temporary deliverables were written. Original dataset sources retain checkedAt 2026-09-21: upstream data was not downloaded or revalidated. New checkedAt dates represent source reading, not guaranteed current business operation. All purchase, packing, entrance and visit-order tips are editorial suggestions. No invented hours, fees, routes or firsthand experience.

## 10. 마산어시장

KTO market detail supports historical origins. Actual seafood, produce, address and parking evidence is in the newly added KTO travel article, explicitly written March 2022. Named this limitation in transport/parking; did not copy dated bus numbers. Removed unsupported 젓갈 and assumed specialty-zone structure. Retained supported fish, dried seafood and sashimi restaurants. No current fees or operational guarantees.

## 11. 통영중앙전통시장

KTO supports 400-year history, separate live/fresh/dried-fish, side-dish and honey-bread streets, lacquerware/quilted goods, 바지개떡, Dongpirang behind the market and nearby Gangguan. Address remains labeled original-data information. Readable detail body does not specify parking lot/fee; replaced vague harbor-parking implication with explicit limits.

## 12. 경주성동공설시장

Specific city market page replaces portal. Supports old-station location, produce category streets, burdock gimbap, sticky-rice sundae, Korean buffet and public parking. No designated five-day schedule. City address is 원화로281번길11 vs original 11-11; editorial follows city explicitly without editing base data. Clarifies old station vs current rail terminal. Replaced blanket daily opening; no current fees/hours guaranteed.

## 13. 안동 중앙신시장

KTO Korean detail supports permanent shops plus 2/7-day stalls, salted mackerel, octopus, beef, peppers/garlic and ritual goods. English detail lists all six dates and store-specific operating hours. Same English page has conflicting English 대안로98-15 and Korean 중앙시장1길54 addresses, disclosed in editorial. Removed unrelated old-market jjimdak suggestion. Parking remains only labeled original-data availability; lot and price unconfirmed.

## 14. 서문시장2지구종합상가

Daegu tourism market detail explicitly identifies 2지구 underground parking. KTO market-composition article establishes 2지구 as a component. KTO K-tourism article supports line 3 station exits 2/3 and market-wide first/third Sunday closure (January 2025 update). Overall fabric identity remains explicitly overall-market context; no unsupported claim that every 2지구 store sells it. Original component address retained and labeled. No daily-opening or night-market promise. City PDF excerpt mentioned a 2지구 food court but PDF opening failed, so that detail was not used.

## 15. 칠성시장

KTO access detail supports composite market, produce/fish, pig/chicken/puffed-grain alleys, line 1 station exits 1/4 and distinct riverside night market. English detail supports nearby paid parking. Whole-market tourist address 칠성시장로28 differs from original component 칠성남로229; identified both. Access page says night market closed Tue–Wed, English says Tue only, with different weekend hours. Exact schedule deliberately omitted. Did not copy contradictory automatically rendered accessibility defaults.

## 16. 여수서시장주변시장

Specific city page was read directly via Python urllib HTTPS after web tool reported Internal Error. Actual body supports permanent market, 1932 opening/2005 registration, seafood/clothing/restaurants/general goods, parking available, 서교2길2-7 and 061-641-0159. Original source says 4/9 and 중앙로3-2; both are identified as original data. Permanent shops can coexist with five-day stalls: no claim of false/abolished 4/9 schedule and no proposed catalog schedule change. No old bus numbers or guarantee that every shop opens every day.

## 17. 나주목사고을시장

KTO access page fully read: 2012 merger of Seongbuk and Geumgye daily markets, 청동길14, association contact, cultural program history and accessible parking. Original 4/9 schedule explicitly attributed to original data. No new event schedule guaranteed. Unverified generic product claims removed.

Limitation: [Naju city specific page](https://www.naju.go.kr/tour/sights/nature/all?idx=499&mode=view) failed with Internal Error and HTTP 400. Official search excerpt says no parking, conflicting with accessible parking on KTO and original parking flag. Do not stamp inaccessible city page checked today. It is not added as a verified source. General-car lot, fees and conditions remain unknown.

## 18. 전주남부시장

City market page and tour support Pungnammun/Hanok proximity, bean-sprout and blood-sausage soup, craft goods, riverside dawn market and multiple named parking facilities. Corrected 전북특별차치도 typo. City tour and recent KTO article differ in parking names/tariffs/discounts; no numeric tariff published. Dawn end time differs 09:00 vs 10:00 across city pages; omitted fixed hours. No guaranteed youth-mall or night-market opening.

## 19. 대인시장

Specific city page supports seafood/dried fish/젓갈, vegetables, cloth, kitchenware/rice merchants, fish restaurants, second/fourth Sunday holiday and store-specific times, paid lots 1/2 and named bus stops. Replaced blanket daily operation. Source address 제봉로184번길9-10 differs from original 제봉로194번길10; disclosed. No copied bus route numbers or art-market event guarantees. Administrative-label changes displayed on source were outside this market review; used 광주 동구/local streets and did not edit base administrative data.

## Source URLs by market (linked evidence retained in entries)

### 10. market-7bee231bddce4e22

- [전국전통시장표준데이터](https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y) — checkedAt 2026-09-21
- [한국관광공사 마산어시장](https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=897fb471-0923-4ff9-9f10-a76c6589bfdc) — checkedAt 2026-10-02
- [한국관광공사 마산 여행기사(2022년 작성)](https://korean.visitkorea.or.kr/detail/rem_detail.do?cotid=9310189a-9c12-4094-87f6-f14e8b78fe94) — checkedAt 2026-10-02

### 11. market-57efa2a61ea8b011

- [전국전통시장표준데이터](https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y) — checkedAt 2026-09-21
- [한국관광공사 통영중앙전통시장](https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=70630e73-c3e2-4b7d-baa5-2e64bd972730) — checkedAt 2026-10-02

### 12. market-54abc96559102d3e

- [전국전통시장표준데이터](https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y) — checkedAt 2026-09-21
- [경주시 문화관광 전통시장 안내 — 성동시장](https://gyeongju.go.kr/tour/page.do?mnu_uid=4826) — checkedAt 2026-10-02

### 13. market-989da9eee01d8dda

- [전국전통시장표준데이터](https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y) — checkedAt 2026-09-21
- [한국관광공사 안동 중앙신시장](https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=243665c4-9f5e-485f-941a-778ee88427aa) — checkedAt 2026-10-02
- [한국관광공사 안동 중앙신시장 장날·주소 안내](https://english.visitkorea.or.kr/svc/contents/contentsView.do?vcontsId=177574) — checkedAt 2026-10-02

### 14. market-863a810b24632a10

- [전국전통시장표준데이터](https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y) — checkedAt 2026-09-21
- [대구관광 서문시장 — 2지구 지하 주차시설 안내](https://tour.daegu.go.kr/index.do?menu_id=00002943&menu_link=%2Ffront%2Ftour%2FtourMapsView.do&tourId=KOATTR_229) — checkedAt 2026-10-02
- [한국관광공사 서문시장 구성 안내](https://korean.visitkorea.or.kr/detail/rem_detail.do?cotid=5914c765-2d7f-447b-a8e1-6bdd32b9d9e1) — checkedAt 2026-10-02
- [한국관광공사 K-관광마켓 서문시장 — 교통·휴무 안내](https://korean.visitkorea.or.kr/detail/rem_detail.do?cotid=efaf62c0-b493-4d29-82d5-d924c026bee7) — checkedAt 2026-10-02

### 15. market-1d91da2272ddf46a

- [전국전통시장표준데이터](https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y) — checkedAt 2026-09-21
- [한국관광공사 열린관광 칠성시장·칠성야시장](https://access.visitkorea.or.kr/ms/detail.do?cotId=1dc17cc1-8ded-47c9-aa76-efed16a21860) — checkedAt 2026-10-02
- [한국관광공사 칠성시장 영문 주차 안내](https://english.visitkorea.or.kr/svc/whereToGo/locIntrdn/rgnContentsView.do?menuSn=459&vcontsId=14681) — checkedAt 2026-10-02

### 16. market-a88b6fad98af479e

- [전국전통시장표준데이터](https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y) — checkedAt 2026-09-21
- [여수시 문화관광 서시장주변시장 상세 안내](https://www.yeosu.go.kr/tour/lodge_food/shopping/traditional_market?mode=view&idx=6121) — checkedAt 2026-10-02

### 17. market-5f7c435508d5a3b5

- [전국전통시장표준데이터](https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y) — checkedAt 2026-09-21
- [한국관광공사 열린관광 나주목사고을시장](https://access.visitkorea.or.kr/ms/detail.do?cotId=5be4e2ae-96db-4eb8-823e-400516167617) — checkedAt 2026-10-02

### 18. market-df4d34f3be577ba5

- [전국전통시장표준데이터](https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y) — checkedAt 2026-09-21
- [전주시 문화관광 남부시장](https://tour.jeonju.go.kr/index.jeonju?menuCd=DOM_000000104002001001) — checkedAt 2026-10-02
- [전주시 문화관광 남부시장 투어·주차장 안내](https://tour.jeonju.go.kr/index.jeonju?menuCd=DOM_000000112001002000) — checkedAt 2026-10-02
- [한국관광공사 전주남부시장 방문기사](https://korean.visitkorea.or.kr/detail/rem_detail.do?cotid=ac981b7d-e72d-46c5-bd23-3ca0c2c3019d) — checkedAt 2026-10-02

### 19. market-a8530c90ef5bf06a

- [전국전통시장표준데이터](https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y) — checkedAt 2026-09-21
- [광주관광 대인시장 — 품목·휴무·교통·주차 안내](https://tour.gwangju.go.kr/home/tour/info/shopping/002.cs?act=view&infoId=410) — checkedAt 2026-10-02


# 시장 콘텐츠 감사 C (index 20–29)

검토일: 2026-10-02 (Asia/Seoul). 공유 JSON·생산 파일은 수정하지 않고 /tmp/jangnal-editorial-c.json에 10개 대체 항목을 작성했다. 모든 ID와 기존 최상위 스키마를 유지했다. 전국전통시장표준데이터의 기존 checkedAt=2026-09-21은 보존했다. 데이터 파일을 읽었다는 이유로 온라인 데이터 원본을 재검증했다고 표시하지 않았다. 신규 source.checkedAt는 실제 본문 열람/직접 HTTP 수신으로 확인한 출처에만2026-10-02를 사용했다. reviewedAt는 편집 검토일이며 현장 방문일이나 정상영업 확인일이 아니다.

출처들은 공적 관광기관·지자체·전국우수시장박람회 공식 자료다. 방문 팁 중 치수 준비, 구매 순서, 약속 장소, 포장 문의 등은 편집상 제안이며 해당 시장이 그 서비스를 제공한다는 보장이 아니다.

## 20. 양동복개상가 — market-263aa2113b292a27

### 확인한 출처
- [전국전통시장표준데이터](https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y) — checkedAt 2026-09-21 (기존값 보존, 온라인 재확인 아님)
- [2025 전국우수시장박람회 공식 디렉터리 — 양동복개상가(105쪽)](https://www.xn--3e0bz5qrvd4vh91a71ocybuvaz82h.com/thema/aThema024a/download/K%EC%A0%84%ED%86%B5%EC%8B%9C%EC%9E%A5%ED%8E%98%EC%96%B4_%EB%94%94%EB%A0%89%ED%86%A0%EB%A6%AC%EB%B6%81_%EC%A0%84%EC%8B%9C%ED%8C%90%EB%A7%A4%EC%A1%B4.pdf#page=48) — checkedAt 2026-10-02
- [광주시 교통 — 양동복개상가 공영주차장 현황](https://www.gwangju.go.kr/traffic/contentsView.do?pageId=traffic18) — checkedAt 2026-10-02

**지원되는 사실:** 공식 박람회 디렉터리 인쇄105쪽/PDF48쪽의 시장정보에서 의류·가구·커튼·신발·잡화와 천변좌로243을 확인했다. 본문에는 침구류·혼수용품도 있다. 광주시 교통 페이지는 양동복개상가 앞 노상주차장(누문동324) 및 구 공영주차장 표의 상부/하부주차장을 구분한다.

**정정/제거:** 기존 수산물·건어물·생활 먹거리라는 대표품목을 삭제했다. 복개상가와 양동시장 전체의 성격을 혼동하지 않도록 공산품 중심으로 변경했다. 매일 운영 보장은 상설상가 분류로 완화했다.

**한계:** 현재 점포별 영업일, 요금, 설치·배송 서비스는 확인하지 않았다. 치수 준비, 점포 호수 기록은 편집부의 실용 제안이다. 구 시장 홈페이지 ydbgshoppingcenter.co.kr은 DNS/접근 실패로 출처에 넣지 않았다. 박람회 자료에는 역사 연도 관련 오탈자가 보여 연혁은 사용하지 않았다.

## 21. 도마큰시장 — market-8a0a187a44eb648a

### 확인한 출처
- [전국전통시장표준데이터](https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y) — checkedAt 2026-09-21 (기존값 보존, 온라인 재확인 아님)
- [한국관광공사 — 도마큰시장](https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=65c52434-e1ae-4613-88b8-5ecd04f61920) — checkedAt 2026-10-02
- [대전 서구청 — 전통시장 안내](https://www.seogu.go.kr/kor/sub06_09_02.do) — checkedAt 2026-10-02
- [대전 서구청 — 노외주차장 위치 안내](https://www.seogu.go.kr/prog/parkingLot/kor/sub06_10_06_04/02/list.do) — checkedAt 2026-10-02

**지원되는 사실:** 한국관광공사 상세 본문에서 채소·생선·육류·의류·생활용품, 떡볶이·족발·샌드위치를 확인했다. 서구 전통시장 안내는 도마4길69와 상인회042-531-8889를 확인한다. 구청 주차장 목록에서 제2 도마2길120, 제3 도마시장1길35를 확인했다.

**정정/제거:** 광범위한 매일 운영 문구를 제거하고 구체 품목·점포별 이용 팁을 썼다. 관광 포털에서 요금을 확인하라는 근거 없는 안내를 구청의 실명 주차장으로 대체했다.

**한계:** 구청 주차 페이지는 web 도구에서 오류였으나 urllib 직접 GET 200으로 본문을 읽고 /tmp/jangnal-source-2.html에 보관했다. 공식 카카오 채널 검색 발췌에는 제1주차장 공사 및 도마6길178 임시주차장 공지가 있었지만 직접 본문 확인이 안 되어 임시 위치/운영 확정은 본문에 사용하지 않았다. 배송은 이용 가능 여부를 문의하라는 제안만 포함한다.

## 22. 한민시장 — market-67f0b7c541707a6c

### 확인한 출처
- [전국전통시장표준데이터](https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y) — checkedAt 2026-09-21 (기존값 보존, 온라인 재확인 아님)
- [한국관광공사 — 한민시장](https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=5e807448-11d7-4970-8038-59127e75f4d1) — checkedAt 2026-10-02
- [대전 서구청 — 전통시장 안내](https://www.seogu.go.kr/kor/sub06_09_02.do) — checkedAt 2026-10-02
- [대전 서구청 — 노외주차장 위치 안내](https://www.seogu.go.kr/prog/parkingLot/kor/sub06_10_06_04/02/list.do) — checkedAt 2026-10-02

**지원되는 사실:** 한국관광공사 본문에서 1981년 개설, 괴정동, 막창 골목, 채소·생선·육류·의류·생활용품 및 용문역 접근을 확인했다. 구청에서 도솔로308번길27 주소, 괴정동제1·제2공영주차장 이름 및 위치를 확인했다.

**정정/제거:** 특색 없는 생활시장 설명을 막창 골목과 장보기의 구분으로 대체했다. 매일 운영이라는 보장을 제거했다.

**한계:** 공영주차장 요금과 구매 할인은 미확인이다. 관광공사 페이지의 자동 무장애 아이콘은 검색·열람 응답에서 상충하는 사례가 있어 사용하지 않았다. 용문역 출구·도보 소요시간은 확인하지 않아 쓰지 않았다.

## 23. 부산진시장 — market-ac45198fd61b05ce

### 확인한 출처
- [전국전통시장표준데이터](https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y) — checkedAt 2026-09-21 (기존값 보존, 온라인 재확인 아님)
- [한국관광공사 — 부산진시장](https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=f17b26af-ddb3-42d6-811a-94f028dc22d7) — checkedAt 2026-10-02

**지원되는 사실:** 한국관광공사 부산진시장 상세 본문은 혼수·원단 특화, 한복·이불·그릇·의류·액세서리 및 별도 주차 건물을 확인한다. 기존 등록 주소 진시장로24와 동구는 공식 시장 검색 발췌·동구청 자료와 일치했다.

**정정/제거:** 일상 식료품 종합시장 중심 설명을 혼수·원단 중심으로 정정했다. 매일 운영을 상설시장으로 바꾸고 점포 휴무 확인을 권했다.

**한계:** 공식 부산진시장 웹사이트는 검색 결과를 읽었으나 직접 열람은 SSL/406/timeout으로 불가하여 sources에 신규 checkedAt를 붙이지 않았다. 그 검색 결과의 정기휴무 캘린더는 매일 운영 보장을 제거하는 계기로만 사용했고 특정 휴무 날짜는 싣지 않았다. VisitBusan uc_seq269는 부산진시장 정류장을 교통편으로 소개하는 조선통신사역사관 페이지였으므로 시장 출처로 사용하지 않았다. 구청과 관광공사의 연혁·주차대수는 차이가 있어 수치를 생략했다.

## 24. 정이있는구포시장 — market-2279d714eda1634a

### 확인한 출처
- [전국전통시장표준데이터](https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y) — checkedAt 2026-09-21 (기존값 보존, 온라인 재확인 아님)
- [부산관광공사 비짓부산 — 구포시장](https://www.visitbusan.net/kr/index.do?lang_cd=ko&menuCd=DOM_000000201003001000&uc_seq=363) — checkedAt 2026-10-02

**지원되는 사실:** 비짓부산의 구포시장 상세 본문과 직접 HTTP GET에서 상설 점포·노점, 해산물·건어물, 덕천역2·3호선3번출구 도보3분, 구포시장2길7, 051-333-9033을 확인했다. 3·8일 일정은 기존 표준 데이터 및 별도 비짓부산 여행 기사 검색 발췌와 일치한다.

**정정/제거:** 상설 점포와 오일장을 구분했다. 관광 포털에 주차 요금이 있다는 인상을 제거하고 확인되지 않은 위치·요금을 명시했다. 주소7과 등록8의 표기 차이를 교통 문구에 노출했다.

**한계:** 비짓부산 영업시간08~20시는 모든 점포를 보장하지 않아 사용하지 않았다. 구포시장의 주차장 실명·요금은 확인하지 못했다. 3·8 일정의 재확인 검색 기사 URL은 길고 중복 매개변수가 많아 본 출처에는 안정적인 상세 주소를 사용했다. 원본 표준 데이터 checkedAt는 갱신하지 않았다.

## 25. 남창옹기종기시장 — market-8151f0a3f713aa4d

### 확인한 출처
- [전국전통시장표준데이터](https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y) — checkedAt 2026-09-21 (기존값 보존, 온라인 재확인 아님)
- [한국관광공사 — 남창옹기종기시장](https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=2e9e6931-dcb6-4920-805a-120c1cec2884) — checkedAt 2026-10-02

**지원되는 사실:** 한국관광공사 상세 본문에서 3·8일 및 토요일 장 안내, 외고산 옹기 유통 내력, 서생배·과일·육류·해산물·채소, 주차타워를 확인했다. 등록 주소는 유지했다.

**정정/제거:** 지역 장터라는 추상 설명을 옹기 유통 내력과 서생배 등으로 구체화했다. 기존3·8 일정은 유지하되 공식 관광 안내의 토요일 장을 별도로 설명했다.

**한계:** 토요일의 현재 운영 범위를 독립 확인하지 못해 확인 필요로 남겼다. 관광공사 본문의 온양면 표기는 기존 데이터의 온양읍으로 사용했다. 연중 서생배 판매, 옹기 판매점 상시 운영, 남창역 보행시간, 주차 요금은 보장하지 않았다. 울주군의회 자료에는2026년 시설 개선 논의가 있지만 완료 여부를 확인하지 않아 편의시설 확대를 주장하지 않았다.

## 26. 제주시민속오일시장 — market-2190eaf44c48bbd8

### 확인한 출처
- [전국전통시장표준데이터](https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y) — checkedAt 2026-09-21 (기존값 보존, 온라인 재확인 아님)
- [제주관광공사 비짓제주 — 제주시민속오일시장 구역·먹거리 안내](https://www.visitjeju.net/kr/themtour/view?contentsid=CNTS_300000000012889&menuId=DOM_700000000010831) — checkedAt 2026-10-02

**지원되는 사실:** 비짓제주2023-12-18작성 테마기사의 본문에서2·7일 일정, 오일장서길26, 품목별구역·내부길이름·식당부 위치·주차시설을 확인했다. 직접 열린 본문을 사용했다.

**정정/제거:** 단순 대형 오일장 설명을 내부길과 식당부 중심의 방문 판단 정보로 바꾸었다. 최고·최대 표현, 고정 점포수·주차대수와 오래된 음식가격은 옮기지 않았다.

**한계:** 이 글이 오래된 소개임을 주차 문구에 드러냈다. 시장 전체 최신 배치, 주차요금, 각 점포 영업시간·품목은 독립 확인하지 않았다. 관광공사 기사에서 사실 정보만 추려 독자적인 짧은 문장으로 작성했으며 사진이나 문장을 전재하지 않았다.

## 27. 서귀포향토오일시장 — market-2adc6a0bdfc73a7b

### 확인한 출처
- [전국전통시장표준데이터](https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y) — checkedAt 2026-09-21 (기존값 보존, 온라인 재확인 아님)
- [제주관광공사 비짓제주 — 서귀포향토오일시장](https://www.visitjeju.net/kr/detail/view?contentsid=CONT_000000000500732) — checkedAt 2026-10-02
- [2025 전국우수시장박람회 공식 디렉터리 — 서귀포향토오일시장(20쪽)](https://www.xn--3e0bz5qrvd4vh91a71ocybuvaz82h.com/thema/aThema024a/download/K%EC%A0%84%ED%86%B5%EC%8B%9C%EC%9E%A5%ED%8E%98%EC%96%B4_%EB%94%94%EB%A0%89%ED%86%A0%EB%A6%AC%EB%B6%81_%EC%A0%84%EC%8B%9C%ED%8C%90%EB%A7%A4%EC%A1%B4.pdf#page=6) — checkedAt 2026-10-02

**지원되는 사실:** VisitJeju의 서귀포향토오일시장 상세 본문을 직접 읽어4·9일 일정, 동홍동779-1, 중산간동로7894번길18-5, 064-763-0965, 공영주차장을 확인했다. 박람회 디렉터리 인쇄20쪽/PDF6쪽은 토평서로11번길142와 같은전화번호, 감귤류·은갈치·농기구·잡화를 확인한다.

**정정/제거:** 기존5·10일장 표기는 명백히 충돌하므로4·9일로 정정했다. 상위 작업에서 카탈로그 일정도 정정했다는 보고를 받아 최종 사용자 문구에서는 해소된 충돌 설명을 제거했다. 원본 주소 자체도 공식 박람회 자료의 지원이 있으므로 오기라고 단정하지 않고 두 주소를 구분했다.

**한계:** 두 도로명주소가 정확히 어느 출입구를 뜻하는지는 확인하지 못했다. 같은 지번과 전화번호가 일치하므로 매일올레시장과 혼동한 사례가 아님을 확인했다. 공영주차장 요금·할인은 미확인. 출처에 나오는 특정 감귤 품종과 어종은 상시판매라고 보장하지 않는다.

## 28. 온양온천시장 — market-0b1ee7b765707fb2

### 확인한 출처
- [전국전통시장표준데이터](https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y) — checkedAt 2026-09-21 (기존값 보존, 온라인 재확인 아님)
- [아산시청 — 온양온천시장·주차장 현황](https://www.asan.go.kr/main/cms/?no=286) — checkedAt 2026-10-02
- [한국관광공사 — 온양온천시장 족욕장과 4·9일장](https://korean.visitkorea.or.kr/detail/rem_detail.do?cotid=0c72f93a-1774-4c81-929b-a11bd03f3589) — checkedAt 2026-10-02
- [한국관광공사 — 온양온천시장 교통 안내](https://korean.visitkorea.or.kr/detail/rem_detail.do?cotid=911c4a93-6762-4a18-8f7c-3883bb71ec8d) — checkedAt 2026-10-02

**지원되는 사실:** 아산시 온양온천시장 페이지에서 상설시장, 시장길29, 식료품·농수산품·반찬·과일·정육·떡·빵, 주차장 네 종류를 확인했다. 한국관광공사2026년1월 기사는4·9일장과 샘솟는거리 족욕장, 별도 관광기사는1호선 온양온천역 접근을 확인한다.

**정정/제거:** 4·9일에만 운영하는 듯한 설명을 상설시장+오일장으로 명확히 했다. 주차 장소를 실명으로 구분하고 족욕장은 시설 존재만 소개했다.

**한계:** 아산시 페이지는 web 도구 timeout 뒤 직접 GET200으로 읽었다(/tmp/jangnal-source-0.html). 시청 안내의 최초30분 무료·별도 무료주차장은 현재 예외/운영시간을 완전히 재확인하지 못해 수치를 직접 기재하지 않았다. 오래된 관광기사의 버스배차·소요시간은 사용하지 않았다. 족욕장의 건강효능 주장도 배제했다.

## 29. 음성시장 — market-00f8629bf12716ac

### 확인한 출처
- [전국전통시장표준데이터](https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y) — checkedAt 2026-09-21 (기존값 보존, 온라인 재확인 아님)
- [한국관광공사 — 음성장(2·7일)](https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=95787f10-cc70-4946-bf9a-52b2808f2173) — checkedAt 2026-10-02
- [2025 전국우수시장박람회 공식 디렉터리 — 음성시장(82쪽)](https://www.xn--3e0bz5qrvd4vh91a71ocybuvaz82h.com/thema/aThema024a/download/K%EC%A0%84%ED%86%B5%EC%8B%9C%EC%9E%A5%ED%8E%98%EC%96%B4_%EB%94%94%EB%A0%89%ED%86%A0%EB%A6%AC%EB%B6%81_%EC%A0%84%EC%8B%9C%ED%8C%90%EB%A7%A4%EC%A1%B4.pdf#page=37) — checkedAt 2026-10-02

**지원되는 사실:** 한국관광공사 음성장(2,7일) 본문은 문화동 중심 시장거리, 상설 상가, 장날 도로 일부 통제, 주민 농산물과 이동상인 생활잡화를 설명한다. 박람회 디렉터리 인쇄82쪽/PDF37쪽은2·7일, 문화1길14, 043-873-1256을 확인한다.

**정정/제거:** 일반 농산물·먹거리 목록을 상설상가/오일장과 도로 사용 변화라는 구체 정보로 교체했다. 확인되지 않은 지역 특산물 또는 품바 국수거리 주장은 추가하지 않았다.

**한계:** 도로 통제의 현재 정확한 구간·시간 및 주차장별 위치·요금은 미확인이다. 관광공사에 나오는200m 수치는 업데이트일이 명확하지 않아 본문에서는 일부 구간이라고만 했다. 박람회에 소개된 대추빵의 의학적 효능은 채택하지 않았다.

## 카탈로그 충돌: 서귀포향토오일시장

대상 ID: market-2adc6a0bdfc73a7b. 기존 markets.json은 scheduleRaw=5일+10일, schedule.kind=digit-pair, days=[5,0]이다. 변경 근거는 아래 공식 상세 페이지의 일정 필드다. 조사자는 카탈로그를 직접 수정하지 않았으며, 통합 단계에서 공개 데이터와 생성기를 4·9일장으로 정정했다.

최종 상세 URL: https://www.visitjeju.net/kr/detail/view?contentsid=CONT_000000000500732

실제 본문에서 읽은 최소 증거(페이지 기본정보 부분):

> 운영일: 4, 9, 14, 19, 24, 29일

> 주소: 제주특별자치도 서귀포시 중산간동로7894번길 18-5

같은 페이지 구조화본문에 동홍동779-1, 전화064-763-0965가 있고 이 둘은 원본과 일치한다. 본문 제목도 서귀포향토오일시장이다. 따라서 일정은4·9로 정정할 근거가 명확하다. 주소는2025공식박람회 자료에 원본과 같은 토평서로11번길142가 실려 있으므로 카탈로그 원본값 유지 및 대체 주소 설명이 적절하다.

독립 보조 증거: [서귀포시 2021 안내 PDF](https://www.seogwipo.go.kr/files/editor/0fe54663-0199-467b-8409-42f51e1d2235.pdf)의 공식 검색 발췌는 서귀포매일올레시장(중앙로54번길35, 매일)과 서귀포향토오일시장(토평서로11번길150,4·9일장)을 서로 다른 항목으로 구분했다. 이 보조 PDF는 직접 열람하지 않았으므로 신규 sources에 넣거나 checkedAt를 붙이지 않았다.

## 그 밖의 카탈로그 해석상 주의

- 부산진시장 daily는 상설시장 분류로 해석하며 연중무휴를 뜻한다고 서술하지 않았다.
- 남창옹기종기시장3·8은 확인된다. 관광공사의 토요일장 설명은 별도 운영 형태로 단서만 추가했고 카탈로그 일정 변경을 요청하지 않는다.
- 구포시장 주소8과 비짓부산 주소7은 출입구/대표주소 차이일 수 있다. 원본 수정 없이 차이를 설명했다.

## 조사 C 묶음의 산출물 검증 (통합 전 10곳)

- JSON 배열10개, 원본index20..29 ID 순서 유지, 최상위 키 동일.
- sources[0] 원본 객체 보존. 신규출처는 시장 특정 상세/항목 자료로 교체.
- 정상영업, 빈 주차공간, 연중 특산물 판매, 할인적용을 보장하는 문구 없음.
- 사진·현장후기 미사용. 코드·테스트·커밋 수행하지 않음.

## 재현 가능한 열람 증거

- VisitJeju 최종 상세 HTML: `/tmp/jangnal-seogwipo-source.html` (직접 HTTPS GET 성공; 본문 운영일 필드 확인).
- 공식 박람회 디렉터리 원본 PDF: `/tmp/jangnal-primary-2.pdf` (HTTP200,30,404,905bytes; pypdf로 해당 쪽 본문 확인).
- 아산시 공식 상세 HTML: `/tmp/jangnal-source-0.html`.
- 대전 서구청 주차목록 HTML: `/tmp/jangnal-source-2.html`.
- 구포시장 비짓부산 직접 수신 텍스트: `/tmp/jangnal-busan-1.txt`.
