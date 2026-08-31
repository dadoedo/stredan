import { NextResponse } from "next/server";
import {
  CursorProfileError,
  normalizeHandle,
} from "react-cursor-calendar/server";
import { cachedHeatmap } from "@/lib/cursor-heatmap-image";
import {
  getCursorProfile,
  logCursorProfileRequest,
} from "@/lib/cursor-profile";

export const revalidate = 3600;

function corsHeaders(extra?: HeadersInit) {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
    ...extra,
  };
}

function parseHandleParam(raw: string): {
  handle: string;
  format: "json" | "svg" | "png";
} {
  const decoded = decodeURIComponent(raw);
  if (decoded.endsWith(".svg")) {
    return { handle: decoded.slice(0, -4), format: "svg" };
  }
  if (decoded.endsWith(".png")) {
    return { handle: decoded.slice(0, -4), format: "png" };
  }
  return { handle: decoded, format: "json" };
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ handle: string }> },
) {
  const { handle: raw } = await context.params;
  const parsed = parseHandleParam(raw);
  let handle = "";
  try {
    handle = normalizeHandle(parsed.handle);
    const profile = await getCursorProfile(handle);
    await logCursorProfileRequest(handle);
    if (parsed.format === "json") {
      return NextResponse.json(profile, {
        headers: corsHeaders({
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        }),
      });
    }
    const image = await cachedHeatmap(handle, parsed.format, profile);
    return new NextResponse(new Uint8Array(image.body), {
      headers: corsHeaders({
        "Content-Type": image.contentType,
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      }),
    });
  } catch (error) {
    const status = error instanceof CursorProfileError ? error.status : 502;
    const message =
      error instanceof Error ? error.message : "Failed to load Cursor profile";
    if (handle) await logCursorProfileRequest(handle, message);
    return NextResponse.json(
      { error: message },
      { status, headers: corsHeaders({ "Cache-Control": "no-store" }) },
    );
  }
}
