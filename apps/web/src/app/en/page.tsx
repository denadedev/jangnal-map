import type { Metadata } from "next";

import styles from "./page.module.css";

const title = "Find Korean Traditional Market Days by Date";
const description = "Choose a travel date and region to find traditional market days across Korea.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/en" },
  openGraph: {
    title,
    description,
    url: "/en",
    type: "website",
    siteName: "K Market Day",
    locale: "en_US",
  },
};

export default function EnglishGuidePage() {
  return (
    <div className={styles.page} lang="en">
      <header className={styles.header}>
        <a className={styles.brand} href="/en">K Market Day</a>
        <nav aria-label="Site navigation">
          <a href="/en/map">Market map</a>
          <a href="/">한국어</a>
        </nav>
      </header>
      <main className={styles.main}>
        <p className={styles.eyebrow}>Plan a market visit in Korea</p>
        <h1>{title}</h1>
        <p className={styles.lead}>{description}</p>
        <a className={styles.primary} href="/en/map">Explore the market map</a>
        <p className={styles.note}>The map uses Korean market names and addresses. Its menus and schedule information are available in English.</p>

        <section className={styles.section} aria-labelledby="market-day-heading">
          <h2 id="market-day-heading">Why visit on market day?</h2>
          <p>Market days are often the liveliest time to visit: many more vendors may gather, bringing a wider range of goods and much more to see than on an ordinary day.</p>
        </section>

        <section className={styles.section} aria-labelledby="market-types-heading">
          <h2 id="market-types-heading">Permanent markets and market days</h2>
          <p>A permanent market has shops you can visit on regular days. A market day is a scheduled day when a periodic market takes place. Some markets have both permanent shops and scheduled market days.</p>
          <p>The number of stalls varies by market, and individual shops may have different hours or days off. A listed market day does not guarantee that every stall will be open.</p>
        </section>

        <section className={styles.section} aria-labelledby="five-day-heading">
          <h2 id="five-day-heading">What is a five-day market?</h2>
          <p>A five-day market, or <span lang="ko">오일장</span>, follows a recurring date pattern. For example, a market with a 2-and-7 schedule usually has market days on the 2nd, 7th, 12th, 17th, 22nd, and 27th of each month. Check the dates for the specific market you want to visit.</p>
        </section>

        <section className={styles.section} aria-labelledby="how-to-heading">
          <h2 id="how-to-heading">How to find a market</h2>
          <ol>
            <li>Search for a region such as Seoul, Busan, or Jeju, or enter a Korean market name.</li>
            <li>Choose a date. The market-day filters focus on scheduled market days; choose All markets to include permanent markets.</li>
            <li>Select a market to check its recorded schedule, Korean address, and available visitor information.</li>
            <li>Open the map menu to choose NAVER Maps directions or view the location in Google Maps.</li>
          </ol>
          <p>Dates shown as “today” use Korea time (KST). Schedules can change, so check the linked source or contact the market before a special trip.</p>
          <a className={styles.primary} href="/en/map">Explore the market map</a>
        </section>

        <section className={styles.section} aria-labelledby="source-heading">
          <h2 id="source-heading">About the information</h2>
          <p>K Market Day uses public market data. Reviewed market guides also use official tourism and local sources. Source details and reference dates appear on the Korean site where available.</p>
          <a href="/about#data-policy">About and data sources (Korean)</a>
        </section>
      </main>
      <footer className={styles.footer}>
        <a href="/en/map">Market map</a>
        <a href="/">Korean site</a>
      </footer>
    </div>
  );
}
