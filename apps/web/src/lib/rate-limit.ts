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
 * 요청한 사람의 IP. 앞단 프록시(NPM Plus → Traefik)를 지나며 X-Forwarded-For 맨 앞에 남은 값을 쓰고, 없으면 X-Real-Ip를 쓴다.
 * 맨 앞 값은 클라이언트가 꾸밀 수 있지만, 꾸며서 얻는 것은 자기 제한을 피하는 것뿐이다(중복 검사와 운영자 승인은 그대로).
 * 둘 다 없으면 모든 요청을 한 키로 센다.
 */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",").map((entry) => entry.trim()).filter(Boolean);
  return forwarded?.[0] ?? request.headers.get("x-real-ip")?.trim() ?? "unknown";
}
