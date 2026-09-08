import type { Metadata } from "next";

import { ReportForm } from "../../components/report-form";
import { publicMarkets } from "../../lib/market-catalog";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "제보하기 · 오늘 장날",
  robots: { index: false, follow: false },
};

interface ReportPageProps {
  searchParams: Promise<{ kind?: string; market?: string }>;
}

export default async function ReportPage({ searchParams }: ReportPageProps) {
  const params = await searchParams;
  const isMarketReport = params.kind === "market";
  const market = isMarketReport
    ? publicMarkets.find((item) => item.id === params.market) ?? null
    : null;

  if (isMarketReport && !market) {
    return (
      <main className={styles.page}>
        <a className={styles.back} href="/">← 오늘 장날로 돌아가기</a>
        <section className={styles.card}>
          <h1>시장을 다시 선택해 주세요</h1>
          <p>시장 정보 제보는 대상 시장을 확인한 뒤 받을 수 있습니다.</p>
          <a className={styles.primary} href="/?when=all">지도에서 시장 선택하기</a>
        </section>
      </main>
    );
  }

  const scope = isMarketReport ? "market" : "service";
  const returnUrl = market ? `/?when=all&market=${encodeURIComponent(market.id)}` : "/";
  const smtpUser = process.env.SMTP_USER?.trim() ?? "";
  const smtpPass = process.env.SMTP_PASS?.trim() ?? "";
  const reportToEmail = process.env.REPORT_TO_EMAIL?.trim() || smtpUser;
  const configured = Boolean(smtpUser && smtpPass && reportToEmail);

  return (
    <main className={styles.page}>
      <a className={styles.back} href={returnUrl}>← 이전 화면</a>
      <section className={styles.card}>
        <p className={styles.eyebrow}>{scope === "market" ? "시장 정보 수정" : "서비스 불편 신고"}</p>
        <h1>{market ? `${market.name} 정보가 다른가요?` : "어떤 점이 불편했나요?"}</h1>
        {market ? <strong className={styles.market}>{market.name}</strong> : null}
        <p>확인 후 반영하며, 제보만으로 정보가 바로 바뀌지는 않습니다.</p>
        <ReportForm
          configured={configured}
          supportEmail={reportToEmail}
          scope={scope}
          market={market ? { id: market.id, name: market.name } : null}
        />
      </section>
    </main>
  );
}
