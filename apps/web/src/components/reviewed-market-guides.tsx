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
        <h2 id="reviewed-market-guides-heading">시장별 방문 정보</h2>
        <span>시장 {guides.length}곳</span>
      </div>
      <p>주소·주차·교통·방문 팁을 정리했어요.</p>
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
