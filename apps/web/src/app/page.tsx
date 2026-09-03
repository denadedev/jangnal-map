import markets from "../../public/data/markets.json";

import type { PublicMarket } from "../lib/market";

const publicMarkets = markets as PublicMarket[];

export default function HomePage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <p className="text-sm font-medium text-slate-500">정적 MVP</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">오늘 장날</h1>
      <p className="mt-4 text-slate-600">검증된 전국 전통시장 {publicMarkets.length}곳의 장날 데이터를 준비했습니다.</p>
      <ul className="mt-8 grid gap-3 sm:grid-cols-3">
        {publicMarkets.slice(0, 3).map((market) => (
          <li key={market.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="font-semibold">{market.name}</h2>
            <p className="mt-1 text-sm text-slate-600">{market.scheduleRaw}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
