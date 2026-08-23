"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import type { Locale } from "@/lib/translations";

export default function LocaleScript({ locale }: { locale: Locale }) {
  useEffect(() => {
    document.documentElement.lang = locale;
    if (process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN) {
      posthog.register({ locale });
    }
  }, [locale]);

  return null;
}
