-- 공공데이터 원본의 "전북특별차치도" 오타를 운영 DB 주소에서 "전북특별자치도"로 고친다(전북 시장 57곳의 도로명·지번 주소). data/markets.json도 같은 값으로 고쳤다.
-- 빈 DB(CI·로컬)에서는 고칠 행이 없고, 시드가 고친 JSON 값을 넣는다. 다시 돌려도 바뀌는 행이 없다.
UPDATE "markets"
SET "road_address" = replace("road_address", '전북특별차치도', '전북특별자치도'),
    "lot_address" = replace("lot_address", '전북특별차치도', '전북특별자치도'),
    "updated_at" = now()
WHERE "road_address" LIKE '%전북특별차치도%' OR "lot_address" LIKE '%전북특별차치도%';
