import type { Metadata } from "next";
import type { Locale } from "@/lib/translations";

export const SITE_ORIGIN = "https://stredan.sk";

export function ogImage(locale: Locale = "sk") {
  return {
    url: "/og.jpg",
    width: 1200,
    height: 630,
    alt:
      locale === "en"
        ? "One AI agent. One process."
        : "Jeden AI agent. Jeden proces.",
  };
}

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
      images: [ogImage(input.locale)],
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [ogImage(input.locale)],
    },
  };
}
