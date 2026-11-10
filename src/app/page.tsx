import type { Metadata } from "next";
import { AgencyHome } from "@/components/AgencyHome";
import { SiteShell } from "@/components/SiteShell";
import { getLocale } from "@/lib/locale";
import { routeMetadata } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  if (locale === "en") {
    return routeMetadata({
      path: "/",
      locale,
      title: "One agent for one process | Stredan",
      description:
        "A one-off implementation of one AI agent for one concrete company process, plus consultation. Model subscriptions, API use, hosting, and support are separate.",
    });
  }
  return routeMetadata({
    path: "/",
    locale,
    title: "Jeden agent na jeden proces | Stredan",
    description:
      "Jednorazovo nasadíme jedného AI agenta na jeden konkrétny proces vo firme. Konzultácia patrí k implementácii. Predplatné modelu, API, hosting a podpora sú osobitne.",
  });
}

export default async function AgencyHomePage() {
  const locale = await getLocale();
  return (
    <SiteShell locale={locale}>
      <AgencyHome locale={locale} />
    </SiteShell>
  );
}
