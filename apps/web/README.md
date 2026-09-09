# Standalone 컨테이너

저장소 루트에서 실행한다. Next.js 서버가 화면과 제보 API를 함께 제공한다.
기존 Vercel 운영 설정을 변경하거나 실제 K3s 배포를 수행하는 명령은 아니다.

```bash
docker build -f apps/web/Dockerfile \
  --build-arg NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID="$NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID" \
  -t jangnal-web:local .
```

지도 Client ID는 공개 빌드 설정이다. SMTP_USER, SMTP_PASS, REPORT_TO_EMAIL은
빌드 인자에 넣지 않고 실행 시 Secret으로 주입한다. `.env*` 파일은 빌드 컨텍스트에서
제외된다. 개인정보 안내는 런타임 연락처를 읽도록 요청마다 렌더링한다.

## 로컬 smoke test

아래 값은 실제 계정이 아닌 테스트용 값이다. 테스트는 잘못된 Origin의 요청만
전송하므로 SMTP 메일을 보내지 않는다. 포트 3100이 비어 있어야 한다.

```bash
docker run --rm -d --name jangnal-web-smoke \
  -p 127.0.0.1:3100:3000 \
  -e REPORT_ALLOWED_ORIGIN=http://127.0.0.1:3100 \
  -e SMTP_USER=runtime-smoke@example.invalid \
  -e SMTP_PASS=not-a-real-password \
  -e REPORT_TO_EMAIL=runtime-smoke@example.invalid \
  jangnal-web:local
node apps/web/scripts/smoke-container.mjs
docker stop jangnal-web-smoke
```

서버 준비 후 실행한다. 테스트가 실패해도 마지막 stop 명령으로 테스트 컨테이너를 정리한다.
홈·시장 상세·제보·개인정보 안내·메타데이터·정적 자산·404·API 출처 거부를 확인한다.
SMTP 자격증명은 없는 상태로 빌드해야 런타임 이메일 테스트가 의미 있다.

## K3s 연결 전

- `REPORT_ALLOWED_ORIGIN=https://jangnal.spamfam.kr`을 런타임 설정으로 주입한다.
  내부 HTTP 주소와 공개 HTTPS 주소가 달라도 제보 출처를 검증할 수 있다.
  클라이언트가 보낸 forwarding 헤더는 허용 출처 결정에 사용하지 않는다.
  설정을 생략한 Vercel/직접 실행에서는 기존 request URL 기준 검사를 유지한다.

- 이미지의 실행 사용자는 UID/GID 1000이며 기본 포트는 3000이다.
- 실제 노드 아키텍처를 확인한 뒤 해당 플랫폼으로 빌드한다. 로컬 ARM64 검증만으로
  Proxmox의 AMD64 노드 호환성이 검증된 것은 아니다.
- 검증한 커밋의 이미지를 Harbor에 게시한 후 GitOps의 `not-built` 태그를 실제 SHA로 교체한다.
- 실제 지도 인증, SMTP 수신, 프록시 Origin/IP 전달, 요청 제한, TLS는 별도로 확인한다.
- 제보 보호와 프록시 검증을 마치기 전 운영 도메인이나 DNS를 전환하지 않는다.

## GitHub Actions

`CI`는 PR에서 전체 테스트·타입 검사와 AMD64 Docker 이미지 빌드·smoke test를 실행한다.
PR에서는 Harbor 로그인이나 GitOps 쓰기를 하지 않는다. main push 또는 main의 수동 실행은
검사를 통과한 바로 그 이미지를 전체 커밋 SHA 태그로 Harbor에 올리고 GitOps의
`apps/jangnal-map/web/manifests/deployment.yaml` 이미지 필드만 갱신한다.
실제 K3s 노드가 AMD64인지 첫 배포 전에 확인한다.

저장소에서 사용할 수 있도록 조직의 허용 저장소 범위를 확인한다:

- Secrets: `HARBOR_USERNAME`, `HARBOR_PASSWORD`, `GITOPS_APP_PRIVATE_KEY`.
- Variables: `GITOPS_APP_CLIENT_ID`, `NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID`.
  지도 Client ID는 동일 이름의 Secret도 지원한다. main에서는 누락 시 게시 전에 실패한다.
- Harbor: `jangnal-map` 프로젝트의 push 권한과 이미지 저장 경로를 준비한다.
- GitHub App: `denadedev/gitops`에 Contents 쓰기 권한이 필요하다.

GitOps 갱신은 직렬화하며 최신 main이 아닌 작업은 건너뛴다. 다른 앱의 GitOps push와
충돌하면 최신 main을 받아 오늘장날 이미지 필드만 다시 적용해 최대 3회 재시도한다.
강제 push는 하지 않는다. 게시나 GitOps 갱신 실패 시 Actions는 실패로 종료한다.
검사가 초록색이어도 이전 커밋이어서 게시를 건너뛰었는지 각 단계 로그를 확인한다.

Actions 성공은 **이미지 게시·GitOps 갱신 성공**이지 Pod 배포 성공이 아니다.
최초 Argo CD Application 등록·수동 Sync와 rollout/응답 검증은 별도로 수행한다.
자동 Sync는 첫 배포 검증 후 켠다. 롤백할 때는 진행 중인 배포 실행을 먼저 멈추고
GitOps의 이미지 SHA를 검증된 이전 값으로 변경한다.

기존 Vercel 운영을 유지하는 동안 `Release Vercel Deployment (legacy)`는 Vercel
성공만 기록한다. 이를 K3s 운영 성공으로 간주하지 않으며, DNS 전환 후 제거 여부를 결정한다.

참고: [Next.js standalone 출력](https://nextjs.org/docs/app/api-reference/config/next-config-js/output).
