"use client";

import { useMemo, useState } from "react";
import { CursorCalendar, type CursorCalendarVariant } from "react-cursor-calendar";
import "react-cursor-calendar/tooltips.css";

const VARIANTS: { id: CursorCalendarVariant; label: string }[] = [
  { id: "heatmap", label: "Heatmap" },
  { id: "dashboard", label: "Dashboard" },
  { id: "tokens", label: "Tokens" },
  { id: "agents", label: "Agents" },
  { id: "models", label: "Models" },
];

const THEMES = ["cursor", "github", "heat"] as const;

export function CursorProfilePlayground() {
  const [handle, setHandle] = useState("dadoeodo");
  const [submitted, setSubmitted] = useState("dadoeodo");
  const [variant, setVariant] = useState<CursorCalendarVariant>("dashboard");
  const [theme, setTheme] = useState<(typeof THEMES)[number]>("cursor");

  const apiBase = useMemo(() => "/api/cursor-profile", []);

  return (
    <div>
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(handle.trim().replace(/^@/, "").toLowerCase());
        }}
      >
        <label className="sr-only" htmlFor="cursor-handle">
          Cursor handle
        </label>
        <input
          id="cursor-handle"
          value={handle}
          onChange={(event) => setHandle(event.target.value)}
          placeholder="handle"
          className="min-h-11 min-w-[12rem] flex-1 rounded-lg border border-border bg-surface px-3 text-sm"
        />
        <button type="submit" className="agency-btn-ghost min-h-11">
          Load
        </button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        {VARIANTS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setVariant(item.id)}
            className={`rounded-full border px-3 py-1.5 text-sm ${
              variant === item.id
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {THEMES.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTheme(item)}
            className={`rounded-full border px-3 py-1.5 text-sm ${
              theme === item
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="mt-6">
        <CursorCalendar
          key={`${submitted}-${variant}-${theme}`}
          handle={submitted}
          variant={variant}
          theme={theme}
          apiBase={apiBase}
          framed
        />
      </div>
    </div>
  );
}
