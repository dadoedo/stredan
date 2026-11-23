"use client";

import { Mail } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

export function AgencyEmailButton({
  href,
  children,
  className = "agency-btn-primary",
  location,
  offer,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  location: string;
  offer?: string;
}) {
  return (
    <a
      href={href}
      className={className}
      onClick={() =>
        trackEvent("contact_email_clicked", {
          location,
          offer,
          intent: "open_mailto",
        })
      }
    >
      <Mail className="agency-btn-icon" aria-hidden />
      {children}
    </a>
  );
}
