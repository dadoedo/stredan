import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";
import { getLocale } from "@/lib/locale";

const booksContent = {
  en: {
    title: "Books",
    intro:
      "Here I add books I've read, plan to read, or that interest me. A living list.",
    favouriteAuthor: "Favourite author",
    talebBooks: [
      "Fooled by Randomness",
      "The Black Swan",
      "Antifragile",
      "Skin in the Game",
    ],
    currentlyReading: "Currently reading",
    recommendations: "Selected books I liked and recommend",
    backToHome: "Back to home",
  },
  sk: {
    title: "Knihy",
    intro:
      "Tu budem pridávať knihy, ktoré som čítal, budem čítať alebo ma zaujímajú.",
    favouriteAuthor: "Obľúbený autor",
    talebBooks: [
      "Fooled by Randomness",
      "The Black Swan",
      "Antifragile",
      "Skin in the Game",
    ],
    currentlyReading: "Knihy, ktoré čítam aktuálne",
    recommendations: "Ďalšie vybrané knihy, ktoré sa mi páčili a odporúčam",
    backToHome: "Späť na domov",
  },
} as const;

const currentlyReading = [
  { title: "Creativity, Inc.", author: "Ed Catmull" },
  { title: "Bowling Alone", author: "Robert Putnam" },
  { title: "Influence", author: "Robert Cialdini" },
  { title: "On Writing Well", author: "William Zinsser" },
];

const recommendedBooks = [
  { title: "The Swerve", author: "Stephen Greenblatt" },
  { title: "On the Shortness of Life", author: "Seneca" },
  { title: "Eat & Run", author: "Scott Jurek" },
  { title: "Becoming Steve Jobs", author: "Brent Schlender & Rick Tetzeli" },
  { title: "The Inner Game of Tennis", author: "W. Timothy Gallwey" },
  { title: "Digital Minimalism", author: "Cal Newport" },
  { title: "The War of Art", author: "Steven Pressfield" },
];

export async function generateMetadata() {
  const locale = await getLocale();
  const c = booksContent[locale];
  return {
    title: c.title,
    description: c.intro,
  };
}

export default async function BooksPage() {
  const locale = await getLocale();
  const c = booksContent[locale];

  return (
    <SiteShell locale={locale}>
      <div className="agency-shell py-24">
        <Link href="/" className="agency-btn-ghost mb-8 inline-block text-sm">
          ← {c.backToHome}
        </Link>

        <h1 className="agency-h2 max-w-none text-4xl">{c.title}</h1>
        <p className="agency-lede">{c.intro}</p>

        <section className="mt-12">
          <h2 className="font-heading text-xl font-semibold tracking-tight">
            {c.favouriteAuthor} — Nassim N. Taleb
          </h2>
          <ul className="mt-4 list-inside list-disc space-y-1 text-muted">
            {c.talebBooks.map((book) => (
              <li key={book}>{book}</li>
            ))}
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="font-heading text-xl font-semibold tracking-tight">
            {c.currentlyReading}
          </h2>
          <ul className="mt-4 space-y-3">
            {currentlyReading.map(({ title, author }) => (
              <li key={title} className="text-muted">
                <span className="text-foreground">{title}</span>
                <span> — {author}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="font-heading text-xl font-semibold tracking-tight">
            {c.recommendations}
          </h2>
          <ul className="mt-4 space-y-3">
            {recommendedBooks.map(({ title, author }) => (
              <li key={title} className="text-muted">
                <span className="text-foreground">{title}</span>
                <span> — {author}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </SiteShell>
  );
}
