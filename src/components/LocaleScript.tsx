"use client";

import { useEffect } from "react";
import type { Locale } from "@/lib/translations";

export default function LocaleScript({ locale }: { locale: Locale }) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}
