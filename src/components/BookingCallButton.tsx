"use client";

import { Calendar } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { bookingPopupUrl } from "@/lib/booking";
import { trackEvent } from "@/lib/analytics";

const SCRIPT_SRC =
  "https://calendar.google.com/calendar/scheduling-button-script.js";
const STYLE_HREF =
  "https://calendar.google.com/calendar/scheduling-button-script.css";

const MOBILE_BOOKING_QUERY = "(max-width: 768px), (pointer: coarse)";

declare global {
  interface Window {
    calendar?: {
      schedulingButton: {
        load: (config: {
          url: string;
          color?: string;
          label: string;
          target: HTMLElement;
        }) => void;
      };
    };
  }
}

let scriptPromise: Promise<void> | null = null;

function loadSchedulingScript() {
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    if (!document.querySelector(`link[href="${STYLE_HREF}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = STYLE_HREF;
      document.head.appendChild(link);
    }

    const existing = document.querySelector(
      `script[src="${SCRIPT_SRC}"]`,
    ) as HTMLScriptElement | null;

    if (existing?.dataset.loaded === "true") {
      resolve();
      return;
    }

    const script = existing ?? document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error("Failed to load booking script"));
    if (!existing) document.body.appendChild(script);
  });

  return scriptPromise;
}

export function BookingCallButton({
  label,
  className = "agency-btn-secondary",
  campaign,
  eventProps,
}: {
  label: string;
  className?: string;
  campaign?: string;
  eventProps?: Record<string, unknown>;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [useDirectPage, setUseDirectPage] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_BOOKING_QUERY);
    const updateMode = () => setUseDirectPage(mq.matches);
    updateMode();
    mq.addEventListener("change", updateMode);

    if (mq.matches) {
      setReady(true);
      return () => mq.removeEventListener("change", updateMode);
    }

    const host = hostRef.current;
    if (!host) {
      mq.removeEventListener("change", updateMode);
      return;
    }

    let mounted = true;

    loadSchedulingScript()
      .then(() => {
        if (!mounted || !hostRef.current || !window.calendar) return;

        window.calendar.schedulingButton.load({
          url: bookingPopupUrl(campaign),
          color: "#121212",
          label,
          target: hostRef.current,
        });

        const googleBtn = hostRef.current.nextElementSibling as HTMLElement | null;
        if (googleBtn) {
          googleBtn.style.display = "none";
          googleBtn.setAttribute("aria-hidden", "true");
          googleBtn.tabIndex = -1;
        }

        setReady(true);
      })
      .catch(() => {
        if (mounted) setReady(true);
      });

    return () => {
      mounted = false;
      mq.removeEventListener("change", updateMode);
    };
  }, [label, campaign]);

  const openBooking = () => {
    trackEvent("contact_started", {
      method: "booking",
      campaign,
      ...eventProps,
    });

    const url = bookingPopupUrl(campaign);

    if (useDirectPage) {
      window.location.assign(url);
      return;
    }

    const googleBtn = hostRef.current?.nextElementSibling as HTMLElement | null;
    if (googleBtn) {
      googleBtn.click();
      return;
    }

    window.location.assign(url);
  };

  return (
    <>
      {!useDirectPage && <div ref={hostRef} className="sr-only" aria-hidden />}
      <button
        type="button"
        className={className}
        onClick={openBooking}
        disabled={!ready}
        aria-busy={!ready}
      >
        <Calendar className="agency-btn-icon" aria-hidden />
        {label}
      </button>
    </>
  );
}
