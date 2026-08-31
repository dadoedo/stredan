import { Resvg } from "@resvg/resvg-js";
import { renderHeatmapSvg, type CursorProfile } from "react-cursor-calendar/server";
import { r2Get, r2Put } from "@/lib/r2";

function r2Key(handle: string, format: "svg" | "png") {
  return `v1/${handle}.${format}`;
}

export function heatmapSvg(profile: CursorProfile): string {
  return renderHeatmapSvg(profile);
}

export function heatmapPng(svg: string): Buffer {
  const resvg = new Resvg(svg, {
    fitTo: { mode: "zoom", value: 2 },
    background: "#ffffff",
  });
  return Buffer.from(resvg.render().asPng());
}

export async function cachedHeatmap(
  handle: string,
  format: "svg" | "png",
  profile: CursorProfile,
): Promise<{ body: Buffer; contentType: string }> {
  const key = r2Key(handle, format);
  const hit = await r2Get(key);
  if (hit) return hit;

  const svg = heatmapSvg(profile);
  const svgBuf = Buffer.from(svg, "utf8");
  const pngBuf = heatmapPng(svg);
  await Promise.all([
    r2Put(r2Key(handle, "svg"), svgBuf, "image/svg+xml; charset=utf-8"),
    r2Put(r2Key(handle, "png"), pngBuf, "image/png"),
  ]);
  if (format === "svg") {
    return { body: svgBuf, contentType: "image/svg+xml; charset=utf-8" };
  }
  return { body: pngBuf, contentType: "image/png" };
}
