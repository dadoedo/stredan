import { engagementModels } from "@/lib/engagement-models";
import type { Locale } from "@/lib/translations";

export function EngagementModels({
  locale,
  variant = "section",
}: {
  locale: Locale;
  variant?: "section" | "offer";
}) {
  const copy = engagementModels[locale];

  if (variant === "offer") {
    return (
      <p className="agency-engagement-note">{copy.offerNote}</p>
    );
  }

  return (
    <div className="agency-engagement">
      <p className="agency-body">{copy.offersLead}</p>
      <ul className="agency-engagement-grid">
        {copy.models.map((model) => (
          <li key={model.title} className="agency-engagement-item">
            <strong>{model.title}</strong>
            <span>{model.body}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
