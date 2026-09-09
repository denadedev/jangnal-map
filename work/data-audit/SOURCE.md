# 조사 원본 기록

- 데이터셋: 전국전통시장표준데이터
- 제공기관: 소상공인시장진흥공단
- 원본 페이지: https://www.data.go.kr/data/15012894/standard.do?recommendDataYn=Y
- 다운로드일: 2026-09-02
- 파일명: `data/raw/markets.csv`
- 파일 형식: CSV
- 문자 인코딩: EUC-KR
- SHA-256: `959aabf13005fe6e6d14b4f0a1b44c47bc645694969397a3f67bd5ebec97934f`
- 원본 변경: 없음

원본 파일은 조사 재현용으로 로컬에 보존하며 Git에는 추가하지 않는다. 조사 도구는 원본을 읽기만 하고 정규화 결과와 보고서를 별도 경로에 생성한다.
# 온누리상품권 가맹점 데이터

- 데이터셋: 소상공인시장진흥공단 전국 온누리상품권 가맹점 현황
- URL: https://www.data.go.kr/data/3060079/fileData.do?recommendDataYn=Y
- 기준일: 2025-07-31
- 다운로드 파일 행 수: 150,541 (포털 화면의 전체 행 표시는 125,589)
- 갱신 주기: 연간

최신 CSV를 `/tmp/onnuri-merchants-20250731.csv`에 받은 뒤 다음 명령으로 공개 시장 데이터와 품질 보고서를 갱신한다.

```bash
pnpm enrich:onnuri -- --markets ../../apps/web/public/data/markets.json --onnuri /tmp/onnuri-merchants-20250731.csv --onnuri-encoding utf8 --onnuri-reference-date 2025-07-31 --overrides data/onnuri-market-overrides.json --output ../../apps/web/public/data/markets.json --report ../../outputs/온누리상품권-매칭-결과.md
```
