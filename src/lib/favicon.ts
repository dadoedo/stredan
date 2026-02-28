import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

/**
 * Stiahne favicon pre danú URL a uloží ho do public/logos/{slug}.png
 * Skúša: Google Favicon API, potom /favicon.ico, /apple-touch-icon.png
 */
export async function downloadFavicon(
  url: string,
  slug: string,
): Promise<string | null> {
  let domain: string;
  let origin: string;
  try {
    const parsed = new URL(url);
    domain = parsed.hostname;
    origin = parsed.origin;
  } catch {
    return null;
  }

  const logosDir = join(process.cwd(), "public", "logos");
  await mkdir(logosDir, { recursive: true });

  const base = origin.replace(/\/$/, "");
  const sources: { url: string; ext: string }[] = [
    { url: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`, ext: "png" },
    { url: `${base}/apple-touch-icon.png`, ext: "png" },
    { url: `${base}/favicon-32x32.png`, ext: "png" },
    { url: `${base}/favicon.png`, ext: "png" },
    { url: `${base}/favicon.ico`, ext: "ico" },
  ];

  for (const { url: source, ext } of sources) {
    try {
      const res = await fetch(source, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; FaviconFetcher/1.0)" },
      });
      if (!res.ok) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 100) continue; // príliš malý = pravdepodobne placeholder
      const filename = `${slug}.${ext}`;
      const filepath = join(logosDir, filename);
      await writeFile(filepath, buf);
      return `/logos/${filename}`;
    } catch {
      continue;
    }
  }

  return null;
}
