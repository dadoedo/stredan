import type { Metadata } from "next";
import type { Locale } from "@/lib/translations";

export const SITE_ORIGIN = "https://stredan.sk";

export const OG_IMAGE = {
  url: "/og.jpg",
  width: 1200,
  height: 630,
  alt: "Dávid Stredánsky, Stredan",
} as const;

/**
 * Language is a cookie on one URL, not a separate path.
 * hreflang alternates would point sk and en at the same address, so they are omitted.
 */
export function absoluteUrl(path: string): string {
  if (path === "/" || path === "") return `${SITE_ORIGIN}/`;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_ORIGIN}${normalized}`;
}

export function routeMetadata(input: {
  path: string;
  title: string;
  description: string;
  locale?: Locale;
}): Metadata {
  const url = absoluteUrl(input.path);
  return {
    title: input.title,
    description: input.description,
    alternates: { canonical: url },
    openGraph: {
      title: input.title,
      description: input.description,
      url,
      siteName: "Stredan",
      locale: input.locale === "en" ? "en_US" : "sk_SK",
      type: "website",
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [OG_IMAGE.url],
    },
  };
}
