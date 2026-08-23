"use client";

import type { ComponentProps } from "react";
import { trackEvent } from "@/lib/analytics";

type TrackedAnchorProps = ComponentProps<"a"> & {
  event: string;
  eventProps?: Record<string, unknown>;
};

export function TrackedAnchor({
  event,
  eventProps,
  onClick,
  ...props
}: TrackedAnchorProps) {
  return (
    <a
      {...props}
      onClick={(e) => {
        trackEvent(event, eventProps);
        onClick?.(e);
      }}
    />
  );
}
