import { type NextRequest, NextResponse } from "next/server";

const MARKET_PATH_PREFIX = "/markets/";

export function proxy(request: NextRequest): NextResponse {
  const slug = request.nextUrl.pathname.slice(MARKET_PATH_PREFIX.length);

  try {
    if (decodeURIComponent(slug).includes("%")) {
      return new NextResponse(null, { status: 404 });
    }
  } catch {
    // Invalid UTF-8 is rejected by Next.js before the market route can run.
  }

  return NextResponse.next();
}

export const config = { matcher: "/markets/:path*" };
