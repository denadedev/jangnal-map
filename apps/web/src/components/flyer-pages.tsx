"use client";

import { useEffect, useRef, useState } from "react";

import { flyerPagePath } from "../lib/flyers";
import styles from "../app/this-week/this-week.module.css";

/** 전단 페이지를 세로로 늘어놓는다. 지금 보고 있는 쪽수는 위에 고정해서 보여 준다. 누르면 원본 크기로 연다. */
export function FlyerPages({ brandName, pages }: { brandName: string; pages: { id: string; width: number; height: number }[] }) {
  const [current, setCurrent] = useState(1);
  const refs = useRef<(HTMLAnchorElement | null)[]>([]);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) setCurrent(Number((entry.target as HTMLElement).dataset.page));
      }
    }, { rootMargin: "-45% 0px -45% 0px" });
    refs.current.forEach((element) => element && observer.observe(element));
    return () => observer.disconnect();
  }, [pages]);

  return (
    <div className={styles.flyerList}>
      <p className={`${styles.pageCount} jn`} aria-live="polite"><span className="sr-only">지금 보는 쪽 </span>{current}/{pages.length}</p>
      {pages.map((page, index) => (
        <a
          key={page.id}
          ref={(element) => { refs.current[index] = element; }}
          data-page={index + 1}
          className={styles.flyerPage}
          href={flyerPagePath(page.id)}
          target="_blank"
          rel="noopener"
        >
          <img src={flyerPagePath(page.id)} width={page.width} height={page.height} alt={`${brandName} 전단 ${index + 1}쪽`} loading={index === 0 ? "eager" : "lazy"} />
        </a>
      ))}
      <p className={styles.zoomHint}>이미지를 누르면 원본 크기로 볼 수 있어요</p>
    </div>
  );
}
