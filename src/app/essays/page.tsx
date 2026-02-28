import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
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
    <>
      <Header locale={locale} />

      <main className="min-h-screen px-6 pt-24 pb-24">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/"
            className="mb-8 inline-block text-sm text-muted transition-colors hover:text-foreground"
          >
            ← {c.backToHome}
          </Link>

          <h1 className="font-heading text-4xl font-bold tracking-tight">
            {c.title}
          </h1>
          <p className="mt-4 text-lg text-muted">{c.intro}</p>
        </div>
      </main>

      <Footer locale={locale} />
    </>
  );
}
