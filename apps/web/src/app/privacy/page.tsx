import type { Metadata } from "next";

import styles from "../report/page.module.css";

// SMTP/contact settings are injected at container runtime, not image build time.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "개인정보 처리 안내 · 오늘 장날",
};

export default function PrivacyPage() {
  const supportEmail = (process.env.REPORT_TO_EMAIL || process.env.SMTP_USER || "").trim();
  const canRequestDeletion = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail);
  const deletionSubject = encodeURIComponent("[오늘장날] 개인정보 삭제 요청");

  return (
    <main className={styles.page}>
      <a className={styles.back} href="/">← 오늘 장날로 돌아가기</a>
      <article className={styles.card}>
        <h1>제보 개인정보 처리 안내</h1>
        <h2>수집 항목과 목적</h2>
        <p>제보 유형, 내용, 근거 URL과 대상 시장 정보를 제보 확인에 사용합니다. 답변을 원하는 경우에만 전화번호 또는 이메일을 선택적으로 받으며 제보 확인과 답변에만 사용합니다.</p>
        <h2>보유 기간</h2>
        <p>연락처와 제보 이메일은 처리 완료 후 90일 이내 삭제합니다.</p>
        <h2>처리 방법</h2>
        <p>제보는 오늘장날 서버를 거쳐 Nodemailer와 설정된 SMTP 메일 서비스를 통해 운영 이메일로 전송합니다. 오늘장날은 제보 데이터베이스를 운영하지 않습니다.</p>
        <h2>삭제 요청</h2>
        {canRequestDeletion ? (
          <p>제보에 사용한 연락처와 내용을 적어 <a href={`mailto:${supportEmail}?subject=${deletionSubject}`}>{supportEmail}</a>로 보내면 본인 확인 후 처리합니다.</p>
        ) : (
          <p>삭제 요청 이메일이 설정되지 않아 제보 접수가 비활성화되어 있습니다.</p>
        )}
      </article>
    </main>
  );
}
