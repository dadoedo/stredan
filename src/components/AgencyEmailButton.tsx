"use client";

import { Mail } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

export function AgencyEmailButton({
  href,
  children,
  className = "agency-btn-primary",
  event = "contact_started",
  eventProps,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  event?: string;
  eventProps?: Record<string, unknown>;
}) {
  return (
    <a
      href={href}
      className={className}
      onClick={() => trackEvent(event, eventProps)}
    >
      <Mail className="agency-btn-icon" aria-hidden />
      {children}
    </a>
  );
}
