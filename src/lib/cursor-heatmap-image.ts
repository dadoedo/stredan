import { existsSync } from "node:fs";
import { join } from "node:path";
import { Resvg } from "@resvg/resvg-js";
import { renderHeatmapSvg, type CursorProfile } from "react-cursor-calendar/server";
import { r2Get, r2Put } from "@/lib/r2";

const FONT_DIR = join(process.cwd(), "public/fonts");
const FONT_FILES = [
  join(FONT_DIR, "LiberationSans-Regular.ttf"),
  join(FONT_DIR, "LiberationSans-Bold.ttf"),
].filter((file) => existsSync(file));

function r2Key(handle: string, format: "svg" | "png") {
  return `v2/${handle}.${format}`;
}

export function heatmapSvg(profile: CursorProfile): string {
  return renderHeatmapSvg(profile, { variant: "compact" });
}

export function heatmapCardSvg(profile: CursorProfile): string {
  return renderHeatmapSvg(profile, { variant: "card" });
}

export function heatmapPng(svg: string): Buffer {
  const resvg = new Resvg(svg, {
    fitTo: { mode: "zoom", value: 2 },
    background: "#ffffff",
    font: {
      fontFiles: FONT_FILES,
      loadSystemFonts: FONT_FILES.length === 0,
      defaultFontFamily: "Liberation Sans",
    },
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

  const svgBuf = Buffer.from(heatmapSvg(profile), "utf8");
  const pngBuf = heatmapPng(heatmapCardSvg(profile));
  await Promise.all([
    r2Put(r2Key(handle, "svg"), svgBuf, "image/svg+xml; charset=utf-8"),
    r2Put(r2Key(handle, "png"), pngBuf, "image/png"),
  ]);
  if (format === "svg") {
    return { body: svgBuf, contentType: "image/svg+xml; charset=utf-8" };
  }
  return { body: pngBuf, contentType: "image/png" };
}
