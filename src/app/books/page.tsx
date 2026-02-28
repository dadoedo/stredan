import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
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

          {/* Favourite author */}
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

          {/* Currently reading */}
          <section className="mt-12">
            <h2 className="font-heading text-xl font-semibold tracking-tight">
              {c.currentlyReading}
            </h2>
            <ul className="mt-4 space-y-3">
              {currentlyReading.map(({ title, author }) => (
                <li key={title} className="text-muted">
                  <span className="text-foreground">{title}</span>
                  <span className="text-zinc-600"> — {author}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Recommendations */}
          <section className="mt-12">
            <h2 className="font-heading text-xl font-semibold tracking-tight">
              {c.recommendations}
            </h2>
            <ul className="mt-4 space-y-3">
              {recommendedBooks.map(({ title, author }) => (
                <li key={title} className="text-muted">
                  <span className="text-foreground">{title}</span>
                  <span className="text-zinc-600"> — {author}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>

      <Footer locale={locale} />
    </>
  );
}
