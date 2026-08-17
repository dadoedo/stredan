export const BADGE_CONFIG: Record<
  string,
  { label: string; icon: string; className: string }
> = {
  "open-source": {
    label: "Open source",
    icon: "☆",
    className: "bg-amber-950 text-amber-200",
  },
  marketplace: {
    label: "Marketplace",
    icon: "◇",
    className: "bg-emerald-950 text-emerald-200",
  },
  ios: {
    label: "iOS",
    icon: "",
    className: "bg-sky-950 text-sky-200",
  },
  android: {
    label: "Android",
    icon: "",
    className: "bg-green-950 text-green-200",
  },
};
