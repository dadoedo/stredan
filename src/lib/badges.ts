export const BADGE_CONFIG: Record<
  string,
  { label: string; icon: string; className: string }
> = {
  "open-source": {
    label: "Open source",
    icon: "☆",
    className: "bg-amber-100 text-amber-900",
  },
  marketplace: {
    label: "Marketplace",
    icon: "◇",
    className: "bg-emerald-100 text-emerald-900",
  },
  ios: {
    label: "iOS",
    icon: "",
    className: "bg-sky-100 text-sky-900",
  },
  android: {
    label: "Android",
    icon: "",
    className: "bg-green-100 text-green-900",
  },
};
