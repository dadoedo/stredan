import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { LOCALE_COOKIE } from "@/lib/locale";

export function middleware(request: NextRequest) {
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
