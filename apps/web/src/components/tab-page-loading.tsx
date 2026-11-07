import { MobileTabBar, type MobileTab } from "./mobile-tab-bar";

/** 하단 탭을 누르면 서버 응답을 기다리지 않고 바로 보여 주는 화면 틀(제목과 탭). */
export function TabPageLoading({ title, active }: { title: string; active: MobileTab }) {
  return (
    <div className="tab-page" data-tab-loading="" aria-busy="true">
      <main className="tab-page-loading">
        <h1 className="tab-page-title">{title}</h1>
        <p className="tab-page-desc">불러오는 중이에요</p>
      </main>
      <MobileTabBar active={active} />
    </div>
  );
}
