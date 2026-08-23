"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

export function OfferViewTracker({
  slug,
  code,
  name,
}: {
  slug: string;
  code: string;
  name: string;
}) {
  useEffect(() => {
    trackEvent("offer_viewed", { slug, code, name });
  }, [slug, code, name]);

  return null;
}
