interface RegionAliases {
  names: readonly string[];
  prefixes: readonly string[];
}

const regions: readonly RegionAliases[] = [
  { names: ["Seoul"], prefixes: ["서울특별시"] },
  { names: ["Busan"], prefixes: ["부산광역시"] },
  { names: ["Daegu"], prefixes: ["대구광역시"] },
  { names: ["Incheon"], prefixes: ["인천광역시"] },
  { names: ["Gwangju"], prefixes: ["광주광역시"] },
  { names: ["Daejeon"], prefixes: ["대전광역시"] },
  { names: ["Ulsan"], prefixes: ["울산광역시"] },
  { names: ["Sejong"], prefixes: ["세종특별자치시"] },
  { names: ["Gyeonggi", "Gyeonggi-do"], prefixes: ["경기도"] },
  { names: ["Gangwon", "Gangwon-do"], prefixes: ["강원특별자치도"] },
  { names: ["Chungbuk", "North Chungcheong"], prefixes: ["충청북도"] },
  { names: ["Chungnam", "South Chungcheong"], prefixes: ["충청남도"] },
  { names: ["Jeonbuk", "North Jeolla"], prefixes: ["전북특별자치도", "전북특별차치도", "전라북도"] },
  { names: ["Jeonnam", "South Jeolla"], prefixes: ["전라남도"] },
  { names: ["Gyeongbuk", "North Gyeongsang"], prefixes: ["경상북도"] },
  { names: ["Gyeongnam", "South Gyeongsang"], prefixes: ["경상남도"] },
  { names: ["Jeju", "Jeju Island", "Jeju-do"], prefixes: ["제주특별자치도"] },
];

const normalize = (value: string): string => value.trim().toLowerCase().replace(/[\s._-]+/g, "");

export function resolveRegionAlias(query: string): readonly string[] | null {
  const key = normalize(query);
  if (!key) return null;
  return regions.find(({ names }) => names.some((name) => normalize(name) === key))?.prefixes ?? null;
}
