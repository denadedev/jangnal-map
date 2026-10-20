// UI 아이콘 한 벌: 24px 그리드, 2px 선, 둥근 끝. 선 스타일은 globals.css의 .icon에서 정한다.
const paths = {
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  back: <path d="M19 12H5M11 6l-6 6 6 6" />,
  more: <path d="M9 5l7 7-7 7" />,
  up: <path d="M12 19V5M6 11l6-6 6 6" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.5 15.5L20 20" /></>,
  locate: <><circle cx="12" cy="12" r="3" /><circle cx="12" cy="12" r="7" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2" /></>,
  map: <path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14" />,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
};

export type IconName = keyof typeof paths;

export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg className={className ? `icon ${className}` : "icon"} viewBox="0 0 24 24" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

// 로고 마크: 검은고딕 '장'을 외곽선으로 바꾼 것. 배경색은 감싸는 요소가 정한다.
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true">
      <path
        fill="currentColor"
        transform="translate(15.85 79.87) scale(0.0786 -0.0786)"
        d="M754 630H829V480H754V338H567V760H754ZM279 426Q237 384 183 362Q129 340 70 340L40 480Q88 480 125 509Q163 539 177 602H55V752H501V602H380Q394 539 431 509Q469 480 517 480L487 340Q428 340 374 362Q320 384 279 426ZM598 308Q666 308 710 264Q755 221 755 154Q755 87 710 43Q666 0 598 0H232Q164 0 119 43Q75 87 75 154Q75 221 119 264Q164 308 232 308ZM548 135Q556 135 561 140Q567 146 567 154Q567 162 561 167Q556 173 548 173H282Q274 173 268 167Q263 162 263 154Q263 146 268 140Q274 135 282 135Z"
      />
    </svg>
  );
}
