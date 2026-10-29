"use client";

import type { ButtonHTMLAttributes } from "react";

interface MapLinkButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "onClick"> {
  href: string;
}

// 지도 쿼리 주소(/?when=…&market=…)는 홈으로 canonical되는 중복 URL이라 크롤러에 링크로 보이지 않게 버튼으로 이동한다.
export function MapLinkButton({ href, className, ...props }: MapLinkButtonProps) {
  return (
    <button
      {...props}
      type="button"
      className={`link-button${className ? ` ${className}` : ""}`}
      onClick={() => window.location.assign(href)}
    />
  );
}
