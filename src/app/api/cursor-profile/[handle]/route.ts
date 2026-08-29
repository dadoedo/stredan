import { NextResponse } from "next/server";
import {
  CursorProfileError,
  normalizeHandle,
} from "react-cursor-calendar/server";
import { getCursorProfile } from "@/lib/cursor-profile";

export const revalidate = 3600;

function corsHeaders(extra?: HeadersInit) {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
    ...extra,
  };
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ handle: string }> },
) {
  const { handle: raw } = await context.params;
  try {
    const handle = normalizeHandle(raw);
    const profile = await getCursorProfile(handle);
    return NextResponse.json(profile, {
      headers: corsHeaders({
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      }),
    });
  } catch (error) {
    const status = error instanceof CursorProfileError ? error.status : 502;
    const message =
      error instanceof Error ? error.message : "Failed to load Cursor profile";
    return NextResponse.json(
      { error: message },
      { status, headers: corsHeaders({ "Cache-Control": "no-store" }) },
    );
  }
}
