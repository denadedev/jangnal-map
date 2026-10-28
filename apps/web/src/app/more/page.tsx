import type { Metadata } from "next";

import { Icon } from "../../components/icon";
import { ServiceMenuContent } from "../../components/mobile-menu";
import { MobileTabBar } from "../../components/mobile-tab-bar";
import { StoryPickerButton } from "../../components/story-picker-button";
import { koreaToday } from "../../lib/flyers";
import { highlightSubmissionsEnabled } from "../../lib/highlight-submission-handler";

// 오늘 장날 끝자리를 요청 때 정한다.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "더보기 | 오늘 장날",
  robots: { index: false, follow: true },
};

/** 하단 탭의 더보기. ☰ 드로어와 같은 내용을 화면 전체로 보여 준다. */
export default function MorePage() {
  return (
    <div className="tab-page">
      <main className="more-page">
        <h1 className="tab-page-title">더보기</h1>
        <ServiceMenuContent
          todayIso={koreaToday(new Date())}
          participate={highlightSubmissionsEnabled() ? (
            <StoryPickerButton className="mobile-menu-link" source="menu">
              <Icon name="chat" /><span>다녀온 장 이야기 들려주기</span><Icon name="more" className="mobile-menu-chevron" />
            </StoryPickerButton>
          ) : null}
        />
      </main>
      <MobileTabBar active="more" />
    </div>
  );
}
