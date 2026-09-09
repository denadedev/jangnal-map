"use client";

import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import type { PublicMarket } from "../lib/market";
import { getMarketPagePath } from "../lib/market-seo";
import styles from "./onnuri-market-search.module.css";

const normalizeSearchText = (value: string): string => value
  .toLocaleLowerCase("ko-KR")
  .replace(/\s+/g, "");

async function fetchMarkets(): Promise<PublicMarket[]> {
  const response = await fetch("/data/markets.json");
  if (!response.ok) throw new Error("시장 데이터를 불러오지 못했습니다.");
  const data: unknown = await response.json();
  if (!Array.isArray(data)) throw new Error("시장 데이터 형식이 올바르지 않습니다.");
  return data as PublicMarket[];
}

function OnnuriMarketSearchContent() {
  const [query, setQuery] = useState("");
  const { data: markets = [], isPending, isError, refetch } = useQuery({
    queryKey: ["public-markets"],
    queryFn: fetchMarkets,
    staleTime: Number.POSITIVE_INFINITY,
    retry: false,
  });
  const results = useMemo(() => {
    const needle = normalizeSearchText(query);
    return markets
      .filter((market) => market.onnuri !== null)
      .filter((market) => normalizeSearchText([
        market.name,
        market.roadAddress ?? "",
        market.lotAddress ?? "",
      ].join(" ")).includes(needle))
      .sort((a, b) => b.onnuri!.totalCount - a.onnuri!.totalCount || a.name.localeCompare(b.name, "ko-KR"))
      .slice(0, 30);
  }, [markets, query]);

  return (
    <section className={styles.search} aria-labelledby="onnuri-market-search">
      <div className={styles.heading}>
        <h2 id="onnuri-market-search">시장별 가맹점 찾기</h2>
        <p>시장명이나 지역을 입력해 보세요.</p>
      </div>
      <label className={styles.field}>
        <span className="sr-only">시장명 또는 지역 검색</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="예: 남대문시장, 부산, 전주"
        />
      </label>
      {isPending ? <p role="status" className={styles.state}>시장 정보를 불러오는 중입니다.</p> : null}
      {isError ? (
        <div className={styles.state}>
          <p>시장 정보를 불러오지 못했어요.</p>
          <button type="button" onClick={() => void refetch()}>다시 시도</button>
        </div>
      ) : null}
      {!isPending && !isError && results.length === 0 ? (
        <p className={styles.state}>조건에 맞는 온누리상품권 가맹 시장이 없어요</p>
      ) : null}
      {!isPending && !isError && results.length > 0 ? (
        <ul className={styles.results} aria-label="온누리상품권 가맹 시장 검색 결과">
          {results.map((market) => (
            <li key={market.id}>
              <a href={getMarketPagePath(market)}>
                <div>
                  <strong>{market.name}</strong>
                  <span>{market.roadAddress ?? market.lotAddress ?? "주소 정보 없음"}</span>
                </div>
                <div className={styles.counts}>
                  <span>전체 {market.onnuri!.totalCount.toLocaleString("ko-KR")}곳</span>
                  <span>디지털 {market.onnuri!.digitalCount.toLocaleString("ko-KR")}곳</span>
                  <span>지류 {market.onnuri!.paperCount.toLocaleString("ko-KR")}곳</span>
                </div>
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

export function OnnuriMarketSearch() {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { refetchOnWindowFocus: false } },
  }));
  return <QueryClientProvider client={queryClient}><OnnuriMarketSearchContent /></QueryClientProvider>;
}
