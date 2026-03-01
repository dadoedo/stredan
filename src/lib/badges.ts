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
  ios: {
    label: "iOS",
    icon: "",
    className:
      "bg-sky-500/15 text-sky-600 dark:bg-sky-400/20 dark:text-sky-400",
  },
  android: {
    label: "Android",
    icon: "",
    className:
      "bg-green-500/15 text-green-600 dark:bg-green-400/20 dark:text-green-400",
  },
};
