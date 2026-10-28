import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FlyerPages } from "../../../../components/flyer-pages";
import { Icon } from "../../../../components/icon";
import { StoryPickerButton } from "../../../../components/story-picker-button";
import { MART_BRAND_LABELS } from "../../../../db/codes";
import { formatFlyerPeriod, isMartBrand } from "../../../../lib/flyers";
import { highlightSubmissionsEnabled } from "../../../../lib/highlight-submission-handler";
import { loadBrandFlyers } from "../../../../lib/this-week";
import styles from "../../this-week.module.css";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ brand: string }> };

// 전단 이미지는 마트의 것이라 검색에 내보내지 않는다. sitemap에도 넣지 않는다.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { brand } = await params;
  const name = isMartBrand(brand) ? MART_BRAND_LABELS[brand] : "마트";
  return { title: `${name} 이번 주 전단 | 오늘 장날`, robots: { index: false, follow: true } };
}

export default async function FlyerViewerPage({ params }: Props) {
  const { brand: code } = await params;
  if (!isMartBrand(code)) notFound();
  const brand = (await loadBrandFlyers(new Date())).find((item) => item.code === code);
  const name = brand?.name ?? MART_BRAND_LABELS[code];
  const flyer = brand?.flyer;

  return (
    <div className={styles.viewer}>
      <header className={styles.source}>
        <h1>
          <a className={styles.back} href="/this-week" aria-label="이번 주 장보기로"><Icon name="back" /></a>
          {name}{flyer ? <> · <span className="jn">{formatFlyerPeriod(flyer.startsOn, flyer.endsOn)}</span></> : null}
        </h1>
        {flyer ? <p className={styles.sub}>{flyer.baseStoreName ? `기준 매장 ${flyer.baseStoreName}` : "전국 공통 전단"} · 점포마다 상품과 가격이 다를 수 있어요</p> : null}
        {brand ? <a className={styles.textLink} href={brand.officialFlyerUrl} target="_blank" rel="noopener">출처: {name} 공식 전단 보기 ↗</a> : null}
      </header>

      {flyer ? <FlyerPages brandName={name} pages={flyer.pages} /> : (
        <p className={styles.empty}>이번 주 {name} 전단은 아직 준비 중이에요. 공식 전단에서 먼저 확인해 주세요.</p>
      )}

      <footer className={styles.footer}>
        <a className={styles.secondary} href="/this-week#days">이번 주 장날 보기</a>
        {highlightSubmissionsEnabled() ? <StoryPickerButton className={styles.primary} source="this_week">다녀온 장 이야기</StoryPickerButton> : null}
      </footer>
    </div>
  );
}
