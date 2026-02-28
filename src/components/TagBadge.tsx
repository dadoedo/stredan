interface TagBadgeProps {
  name: string;
  icon?: string | null;
  variant?: "default" | "muted";
  size?: "sm" | "md" | "lg";
}

export function TagBadge({ name, icon, variant = "default", size = "md" }: TagBadgeProps) {
  const iconSize =
    size === "sm" ? "w-3.5 h-3.5" : size === "md" ? "w-4 h-4" : "w-5 h-5";
  const textSize =
    size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-sm";
  const padding =
    size === "sm" ? "px-2 py-0.5" : size === "md" ? "px-2.5 py-1" : "px-3 py-1.5";
  const textColor =
    variant === "muted"
      ? "text-zinc-600 dark:text-zinc-400"
      : "text-zinc-800 dark:text-zinc-200";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md ${padding} ${textSize} ${textColor} bg-zinc-200/90 dark:bg-zinc-700/90`}
      title={name}
    >
      {icon ? (
        <img
          src={icon}
          alt=""
          className={`${iconSize} shrink-0 object-contain`}
          width={size === "sm" ? 14 : size === "md" ? 16 : 20}
          height={size === "sm" ? 14 : size === "md" ? 16 : 20}
        />
      ) : null}
      <span className="truncate">{name}</span>
    </span>
  );
}
