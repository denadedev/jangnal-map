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
  share: <path d="M12 15V3M8 7l4-4 4 4M8 10H7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-1" />,
  addSquare: <><rect x="4" y="4" width="16" height="16" rx="3.5" /><path d="M12 8.5v7M8.5 12h7" /></>,
  dots: <path d="M5 12h.01M12 12h.01M19 12h.01" />,
  compass: <><circle cx="12" cy="12" r="9" /><path d="M15.5 8.5l-2 5-5 2 2-5z" /></>,
  copy: <><rect x="9" y="9" width="11" height="11" rx="2.5" /><path d="M5 15V6.5A2.5 2.5 0 0 1 7.5 4H15" /></>,
  sprout: <path d="M12 20v-8M12 12c0-4 3-6.5 7.5-6.5 0 4-3 6.5-7.5 6.5zM12 14.5c0-3-2.5-5.5-6.5-5.5 0 3 2.5 5.5 6.5 5.5z" />,
  bowl: <path d="M3.5 11.5h17a8.5 8.5 0 0 1-17 0zM9 20h6M9 8.5c0-1 1-1.2 1-2.2S9 5 9 4M14 8.5c0-1 1-1.2 1-2.2S14 5 14 4" />,
  bulb: <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.4 1 1.1 1 1.8V16h5v-.3c0-.7.4-1.4 1-1.8A6 6 0 0 0 12 3z" />,
  star: <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />,
  person: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20c1-3.5 3.8-5.5 7-5.5s6 2 7 5.5" /></>,
  pen: <path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  alert: <><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5.5M12 16.5v.01" /></>,
  shield: <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6zM9 12l2 2 4-4" />,
  pin: <><path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.3" /></>,
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
