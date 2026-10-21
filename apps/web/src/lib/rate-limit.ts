// 레플리카가 1개라 프로세스 메모리로 센다. 키(IP)는 메모리에만 잠깐 두고 저장하지 않는다.
export function createRateLimiter(limit: number, windowMs: number) {
  const hits = new Map<string, number[]>();
  return function allow(key: string, now = Date.now()): boolean {
    const recent = (hits.get(key) ?? []).filter((at) => now - at < windowMs);
    if (recent.length >= limit) {
      hits.set(key, recent);
      return false;
    }
    recent.push(now);
    hits.set(key, recent);
    if (hits.size > 10_000) for (const [entry, times] of hits) if (times.every((at) => now - at >= windowMs)) hits.delete(entry);
    return true;
  };
}

/**
 * 요청한 사람의 IP. 인그레스(Traefik)가 X-Real-Ip를 덮어쓰고 X-Forwarded-For 끝에 붙이므로 그 값을 쓴다.
 * 둘 다 없으면 모든 요청을 한 키로 센다.
 */
export function clientIp(request: Request): string {
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const forwarded = request.headers.get("x-forwarded-for")?.split(",").map((entry) => entry.trim()).filter(Boolean);
  return forwarded?.at(-1) ?? "unknown";
}
