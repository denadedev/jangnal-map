export interface ReviewedMarketGuide {
  id: string;
  name: string;
  schedule: string;
  href: string;
  summary?: string;
}

interface ReviewedMarketGuidesProps {
  guides: ReviewedMarketGuide[];
}

export function ReviewedMarketGuides({ guides }: ReviewedMarketGuidesProps) {
  return (
    <section className="reviewed-market-guides" aria-labelledby="reviewed-market-guides-heading">
      <div className="reviewed-market-guides-heading">
        <h2 id="reviewed-market-guides-heading" tabIndex={-1}>시장별 방문 정보</h2>
        <span>시장 {guides.length}곳</span>
      </div>
      <p>주소·주차·교통·방문 팁을 정리했어요.</p>
      <div className="reviewed-market-guides-list reviewed-market-previews">
        {guides.filter((guide) => guide.summary).map((guide) => (
          <a key={guide.id} href={guide.href} className="reviewed-market-guide-link">
            <strong>{guide.name}</strong>
            <span>{guide.schedule}</span>
            <p>{guide.summary}</p>
          </a>
        ))}
      </div>
      <details className="reviewed-market-guides-content">
        <summary className="reviewed-market-guides-toggle">시장 {guides.length}곳 전체 안내</summary>
        <div className="reviewed-market-guides-list">
          {guides.filter((guide) => !guide.summary).map((guide) => (
            <a key={guide.id} href={guide.href} className="reviewed-market-guide-link">
              <strong>{guide.name}</strong>
              <span>{guide.schedule}</span>
            </a>
          ))}
        </div>
      </details>
    </section>
  );
}
