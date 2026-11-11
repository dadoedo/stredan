"use client";

import { useState, useSyncExternalStore } from "react";
import { ANALYTICS_OPT_OUT_KEY } from "@/lib/analytics-policy";
import type { Locale } from "@/lib/translations";

type OptStatus = "unknown" | "off-host" | "on" | "out";

let storedStatus: OptStatus = "unknown";

function readStatus(): OptStatus {
  const host = window.location.hostname;
  const productionHost = host === "stredan.sk" || host === "www.stredan.sk";
  if (!productionHost || process.env.NODE_ENV !== "production") return "off-host";
  try {
    return window.localStorage.getItem(ANALYTICS_OPT_OUT_KEY) === "1" ? "out" : "on";
  } catch {
    return "on";
  }
}

function subscribe(onChange: () => void) {
  const update = () => {
    storedStatus = readStatus();
    onChange();
  };
  window.addEventListener("storage", update);
  const timer = window.setTimeout(update, 0);
  return () => {
    window.clearTimeout(timer);
    window.removeEventListener("storage", update);
  };
}

function getSnapshot() {
  return storedStatus;
}

export function AnalyticsOptOut({ locale }: { locale: Locale }) {
  const stored = useSyncExternalStore(subscribe, getSnapshot, () => "unknown");
  const [chosen, setChosen] = useState<OptStatus | null>(null);
  const status = chosen ?? stored;

  const optOut = () => {
    try {
      window.localStorage.setItem(ANALYTICS_OPT_OUT_KEY, "1");
    } catch {
      // Storage can be blocked. The button still tells the truth about this browser.
    }
    void import("posthog-js").then(({ default: posthog }) => {
      if (posthog.__loaded) posthog.opt_out_capturing();
    });
    setChosen("out");
  };

  const sk = locale === "sk";

  if (status === "off-host") {
    return (
      <p className="agency-body">
        {sk
          ? "Toto prostredie meranie do produkčného PostHogu neposiela."
          : "This environment does not send measurement to the production PostHog project."}
      </p>
    );
  }

  if (status === "out") {
    return (
      <p className="agency-body">
        {sk
          ? "V tomto prehliadači je meranie vypnuté. Už odoslané údaje tým nemažeme."
          : "Measurement is off in this browser. That does not delete data already sent."}
      </p>
    );
  }

  return (
    <div>
      <p className="agency-body">
        {sk
          ? "Na stredan.sk sa meranie dá v tomto prehliadači vypnúť. Nevráti to údaje, ktoré už odišli."
          : "On stredan.sk you can turn measurement off in this browser. It does not undo data already sent."}
      </p>
      <button
        type="button"
        className="agency-btn-secondary"
        onClick={optOut}
        disabled={status !== "on"}
      >
        {sk ? "Nemerať v tomto prehliadači" : "Don’t measure in this browser"}
      </button>
    </div>
  );
}
