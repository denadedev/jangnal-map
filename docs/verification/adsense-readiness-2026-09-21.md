# AdSense 승인 준비 검증

## 배포 식별자

- Production URL: `https://spamfam.kr`
- 검증 대상 commit: Task 11 실행 시 `git rev-parse HEAD` 결과를 기록
- 확인 시각: Task 11 실행 시 Asia/Seoul 현재 시각을 기록

## 자동 검증

다음 명령을 실행하고 실제 exit code와 결과를 기록한다.

```text
pnpm test
pnpm typecheck
pnpm build
pnpm --filter @jangnal-map/web exec playwright test e2e/adsense-readiness.spec.ts
```

## 운영 URL 검증

- `/`, `/onnuri`, `/about`, `/privacy`, `/report?kind=service`, 404: `adsbygoogle.js`, `ins.adsbygoogle`, Google 광고 iframe 없음
- 모든 대표 HTML: `google-adsense-account=ca-pub-3237088758901901`
- 모든 canonical과 JSON-LD: `https://spamfam.kr`
- `/ads.txt`: HTTP 200, publisher line 정확히 일치
- `/robots.txt`: `https://spamfam.kr/sitemap.xml`
- `/sitemap.xml`: 33개 URL, 레거시 subdomain 없음
- 검수 시장 `/markets/용인중앙시장-389b4a24`: HTTP 200, 편집 섹션 표시
- 미검수 시장 `/markets/운천전통시장-45b640cc`: HTTP 404
- 홈 선택 URL `/?when=all&market=market-45b640ccbe294100`: 시장 상세 시트 표시

## 외부 콘솔 확인

다음은 실제 콘솔에서 확인한 항목만 완료로 표시한다.

- [ ] Search Console에 `https://spamfam.kr/sitemap.xml` 제출
- [ ] AdSense 소유권 확인 방식이 메타 태그 또는 `ads.txt`로 유지됨
- [ ] AdSense Auto ads 비활성화
- [ ] AdSense 재검토 요청
