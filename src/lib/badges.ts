export const BADGE_CONFIG: Record<
  string,
  { label: string; icon: string; className: string }
> = {
  "open-source": {
    label: "Open source",
    icon: "☆",
    className:
      "bg-amber-500/15 text-amber-600 dark:bg-amber-400/20 dark:text-amber-400",
  },
  marketplace: {
    label: "Marketplace",
    icon: "◇",
    className:
      "bg-emerald-500/15 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-400",
  },
};
