FROM node:22-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/package.json
RUN pnpm install --frozen-lockfile --filter @jangnal-map/web
COPY apps/web ./apps/web
ARG NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID
ENV NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID=$NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID
RUN pnpm build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000
COPY --from=build --chown=node:node /app/apps/web/.next/standalone ./
COPY --from=build --chown=node:node /app/apps/web/public ./apps/web/public
COPY --from=build --chown=node:node /app/apps/web/.next/static ./apps/web/.next/static
USER 1000:1000
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
