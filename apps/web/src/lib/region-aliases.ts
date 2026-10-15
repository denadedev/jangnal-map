import { findRegionBySlug, type RegionSlug } from "./region";

const regions: readonly { names: readonly string[]; slug: RegionSlug }[] = [
  { names: ["Seoul"], slug: "seoul" },
  { names: ["Busan"], slug: "busan" },
  { names: ["Daegu"], slug: "daegu" },
  { names: ["Incheon"], slug: "incheon" },
  { names: ["Gwangju"], slug: "gwangju" },
  { names: ["Daejeon"], slug: "daejeon" },
  { names: ["Ulsan"], slug: "ulsan" },
  { names: ["Sejong"], slug: "sejong" },
  { names: ["Gyeonggi", "Gyeonggi-do"], slug: "gyeonggi" },
  { names: ["Gangwon", "Gangwon-do"], slug: "gangwon" },
  { names: ["Chungbuk", "North Chungcheong"], slug: "chungbuk" },
  { names: ["Chungnam", "South Chungcheong"], slug: "chungnam" },
  { names: ["Jeonbuk", "North Jeolla"], slug: "jeonbuk" },
  { names: ["Jeonnam", "South Jeolla"], slug: "jeonnam" },
  { names: ["Gyeongbuk", "North Gyeongsang"], slug: "gyeongbuk" },
  { names: ["Gyeongnam", "South Gyeongsang"], slug: "gyeongnam" },
  { names: ["Jeju", "Jeju Island", "Jeju-do"], slug: "jeju" },
];

const normalize = (value: string): string => value.trim().toLowerCase().replace(/[\s._-]+/g, "");

export function resolveRegionAlias(query: string): readonly string[] | null {
  const key = normalize(query);
  if (!key) return null;
  const slug = regions.find(({ names }) => names.some((name) => normalize(name) === key))?.slug;
  return slug ? findRegionBySlug(slug)!.prefixes : null;
}
