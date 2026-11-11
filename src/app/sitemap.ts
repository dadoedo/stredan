import type { MetadataRoute } from "next";
import { PUBLIC_OFFERS } from "@/lib/public-offers";
import { absoluteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "/",
    "/about",
    "/privacy",
    "/books",
    "/essays",
    ...PUBLIC_OFFERS.map((offer) => `/offers/${offer.slug}`),
  ];

  return paths.map((path) => ({
    url: absoluteUrl(path),
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.6,
  }));
}
