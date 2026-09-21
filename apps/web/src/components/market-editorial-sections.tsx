import type { MarketEditorialContent } from "../lib/market-editorial";

interface MarketEditorialSectionsProps {
  editorial: MarketEditorialContent;
}

export function MarketEditorialSections({ editorial }: MarketEditorialSectionsProps) {
  return (
    <div className="editorial-sections">
      <section className="editorial-section" aria-labelledby="editorial-summary-heading">
        <h2 id="editorial-summary-heading">한눈에 보는 시장 특징</h2>
        <p>{editorial.summary}</p>
      </section>
      <section className="editorial-section" aria-labelledby="editorial-tips-heading">
        <h2 id="editorial-tips-heading">방문 전에 알아둘 점</h2>
        <ul>
          {editorial.visitTips.map((tip) => <li key={tip}>{tip}</li>)}
        </ul>
      </section>
      <section className="editorial-section" aria-labelledby="editorial-access-heading">
        <h2 id="editorial-access-heading">교통과 주차</h2>
        <p>{editorial.transportation}</p>
        <p>{editorial.parking}</p>
      </section>
      <section className="editorial-section" aria-labelledby="editorial-specialties-heading">
        <h2 id="editorial-specialties-heading">대표 품목과 시장 특성</h2>
        <ul>
          {editorial.specialties.map((specialty) => <li key={specialty}>{specialty}</li>)}
        </ul>
      </section>
      <section className="editorial-section" aria-labelledby="editorial-sources-heading">
        <h2 id="editorial-sources-heading">편집 출처</h2>
        <ul>
          {editorial.sources.map((source) => (
            <li key={source.url}>
              <a href={source.url} target="_blank" rel="noreferrer">{source.name}</a>
              <span> · {source.checkedAt} 확인</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
