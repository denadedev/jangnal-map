import styles from "./site-footer.module.css";
import type { Locale } from "../lib/locale";
import { getUiCopy } from "../lib/ui-copy";

export function SiteFooter({ locale = "ko" }: { locale?: Locale }) {
  const ui = getUiCopy(locale);
  return (
    <footer className={styles.footer} aria-label={locale === "en" ? "Site information" : "사이트 정보"}>
      <nav className={styles.links} aria-label={locale === "en" ? "Site information menu" : "사이트 정보 메뉴"}>
        <a href="/about">{ui.about}</a>
        <a href="https://legal-hub.denadedev.workers.dev/kmarketday/privacy/">{ui.privacy}</a>
        <a href="https://legal-hub.denadedev.workers.dev/kmarketday/terms/">{ui.terms}</a>
        <a href="/about#data-policy">{ui.dataPolicy}</a>
        <a href="/report?kind=service">{ui.reportInfo}</a>
        <a href={locale === "en" ? "/" : "/en"}>{locale === "en" ? "한국어" : "English guide"}</a>
      </nav>
      <p>{locale === "en" ? "K Market Day · Market information from public data and official tourism sources." : "오늘 장날 운영자 · 공공데이터와 공식 관광 자료를 확인해 제공합니다."}</p>
    </footer>
  );
}
