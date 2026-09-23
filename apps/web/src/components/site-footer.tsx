import styles from "./site-footer.module.css";

export function SiteFooter() {
  return (
    <footer className={styles.footer} aria-label="사이트 정보">
      <nav className={styles.links} aria-label="사이트 정보 메뉴">
        <a href="/about">서비스 소개</a>
        <a href="https://legal-hub.denadedev.workers.dev/kmarketday/privacy/">개인정보 처리방침</a>
        <a href="https://legal-hub.denadedev.workers.dev/kmarketday/terms/">이용약관</a>
        <a href="/about#data-policy">데이터 출처와 편집 기준</a>
        <a href="/report?kind=service">정보 수정 제보</a>
      </nav>
      <p>오늘 장날 운영자 · 공공데이터와 공식 관광 자료를 확인해 제공합니다.</p>
    </footer>
  );
}
