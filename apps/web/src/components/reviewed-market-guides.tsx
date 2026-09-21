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
  return (
    <section className="reviewed-market-guides" aria-labelledby="reviewed-market-guides-heading">
      <div className="reviewed-market-guides-heading">
        <h2 id="reviewed-market-guides-heading">검수된 장날 방문 가이드</h2>
        <span>출처를 확인한 시장 {guides.length}곳</span>
      </div>
      <div className="reviewed-market-guides-list">
        {guides.map((guide) => (
          <a key={guide.id} href={guide.href} className="reviewed-market-guide-link">
            <strong>{guide.name}</strong>
            <span>{guide.schedule}</span>
          </a>
        ))}
      </div>
    </section>
  );
}
