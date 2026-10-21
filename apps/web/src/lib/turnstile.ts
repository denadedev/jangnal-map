/** Cloudflare Turnstile 토큰을 서버에서 확인한다. */
export async function verifyTurnstile(token: string, fetcher: typeof fetch = fetch): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret || !token) return false;
  const response = await fetcher("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: new URLSearchParams({ secret, response: token }),
  });
  const result = await response.json() as { success?: boolean };
  return result.success === true;
}
