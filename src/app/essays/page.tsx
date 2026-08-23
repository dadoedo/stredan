import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";
import { getLocale } from "@/lib/locale";

const essaysContent = {
  en: {
    title: "Essays",
    intro: "Essays and longer-form writing. Coming soon.",
    backToHome: "Back to home",
  },
  sk: {
    title: "Eseje",
    intro: "Eseje a dlhšie texty. Už čoskoro.",
    backToHome: "Späť na domov",
  },
} as const;

export async function generateMetadata() {
  const locale = await getLocale();
  const c = essaysContent[locale];
  return {
    title: c.title,
    description: c.intro,
  };
}

export default async function EssaysPage() {
  const locale = await getLocale();
  const c = essaysContent[locale];

  return (
    <SiteShell locale={locale}>
      <div className="agency-shell py-24">
        <Link href="/" className="agency-btn-ghost mb-8 inline-block text-sm">
          ← {c.backToHome}
        </Link>

        <h1 className="agency-h2 max-w-none text-4xl">{c.title}</h1>
        <p className="agency-lede">{c.intro}</p>
      </div>
    </SiteShell>
  );
}
