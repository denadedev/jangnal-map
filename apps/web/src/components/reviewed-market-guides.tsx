"use client";

import { useState } from "react";

export interface ReviewedMarketGuide {
  id: string;
  name: string;
  schedule: string;
  href: string;
}

interface ReviewedMarketGuidesProps {
  guides: ReviewedMarketGuide[];
}

export function ReviewedMarketGuides({ guides }: ReviewedMarketGuidesProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="reviewed-market-guides" aria-labelledby="reviewed-market-guides-heading" data-expanded={expanded}>
      <div className="reviewed-market-guides-heading">
        <h2 id="reviewed-market-guides-heading">시장별 방문 정보</h2>
        <div className="reviewed-market-guides-actions">
          <span>시장 {guides.length}곳</span>
          <button
            type="button"
            className="reviewed-market-guides-toggle"
            aria-label={`시장별 방문 정보 ${expanded ? "접기" : "펼치기"}`}
            aria-expanded={expanded}
            aria-controls="reviewed-market-guides-content"
            onClick={() => setExpanded((current) => !current)}
          >
            {expanded ? "접기" : "펼치기"}
          </button>
        </div>
      </div>
      <div id="reviewed-market-guides-content" className="reviewed-market-guides-content">
        <p>주소·주차·교통·방문 팁을 정리했어요.</p>
        <div className="reviewed-market-guides-list">
          {guides.map((guide) => (
            <a key={guide.id} href={guide.href} className="reviewed-market-guide-link">
              <strong>{guide.name}</strong>
              <span>{guide.schedule}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
