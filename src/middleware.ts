import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { LOCALE_COOKIE } from "@/lib/locale";

function isCursorProfileHost(host: string) {
  const hostname = host.split(":")[0];
  return (
    hostname === "cursor-profile.stredan.sk" ||
    hostname.startsWith("cursor-profile.")
  );
}

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  if (isCursorProfileHost(host)) {
    const { pathname } = request.nextUrl;
    if (
      pathname.startsWith("/_next") ||
      pathname.startsWith("/favicon") ||
      pathname.startsWith("/apple") ||
      pathname.startsWith("/site.webmanifest") ||
      pathname.startsWith("/ingest") ||
      pathname.startsWith("/api/cursor-profile")
    ) {
      return NextResponse.next();
    }
    if (pathname.startsWith("/v1/")) {
      const url = request.nextUrl.clone();
      url.pathname = `/api/cursor-profile/${pathname.slice(4)}`;
      return NextResponse.rewrite(url);
    }
    const url = request.nextUrl.clone();
    url.pathname = "/cursor-profile";
    return NextResponse.rewrite(url);
  }

  const locale = request.cookies.get(LOCALE_COOKIE)?.value;
  if (!locale || (locale !== "en" && locale !== "sk")) {
    const acceptLanguage = request.headers.get("accept-language") ?? "";
    const preferred = acceptLanguage.includes("sk") ? "sk" : "en";
    const response = NextResponse.next();
    response.cookies.set(LOCALE_COOKIE, preferred, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
    return response;
  }

  return NextResponse.next();
}
