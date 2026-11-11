"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import { canSendAnalytics } from "@/lib/analytics-policy";
import type { Locale } from "@/lib/translations";

export default function LocaleScript({ locale }: { locale: Locale }) {
  useEffect(() => {
    document.documentElement.lang = locale;
    if (canSendAnalytics()) {
      posthog.register({ locale });
    }
  }, [locale]);

  return null;
}
