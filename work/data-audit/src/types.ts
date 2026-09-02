export type CsvEncoding = "utf8" | "euc-kr";

export interface RawMarket {
  시장명: string;
  시장유형: string;
  소재지도로명주소: string;
  소재지지번주소: string;
  시장개설주기: string;
  위도: string;
  경도: string;
  점포수: string;
  취급품목: string;
  사용가능상품권: string;
  홈페이지주소: string;
  공중화장실보유여부: string;
  주차장보유여부: string;
  개설연도: string;
  전화번호: string;
  데이터기준일자: string;
}

export interface NormalizedMarket {
  name: string;
  marketType: string;
  roadAddress: string | null;
  lotAddress: string | null;
  scheduleRaw: string | null;
  latitude: number | null;
  longitude: number | null;
  storeCount: number | null;
  products: string[];
  hasParking: boolean | null;
  phone: string | null;
  homepageUrl: string | null;
  referenceDate: string | null;
  status: "운영" | "폐장";
  statusVerified: boolean;
}
