import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { getLocale } from "@/lib/locale";
import LocaleScript from "@/components/LocaleScript";
import { SkipLink } from "@/components/SkipLink";
import { OG_IMAGE, SITE_ORIGIN } from "@/lib/site";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
});


export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const isSk = locale === "sk";
  const title = isSk
    ? "Jeden agent na jeden proces | Stredan"
    : "One agent for one process | Stredan";
  const description = isSk
    ? "Jednorazovo nasadíme jedného AI agenta na jeden konkrétny proces vo firme. Konzultácia patrí k implementácii."
    : "A one-off implementation of one AI agent for one concrete company process, plus consultation.";
  return {
    metadataBase: new URL(SITE_ORIGIN),
    title,
    description,
    icons: {
      icon: [
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      ],
      apple: "/apple-touch-icon.png",
    },
    manifest: "/site.webmanifest",
    openGraph: {
      title,
      description,
      siteName: "Stredan",
      locale: isSk ? "sk_SK" : "en_US",
      type: "website",
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      images: [OG_IMAGE.url],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  return (
    <html lang={locale}>
      <body className={`${dmSans.variable} antialiased`}>
        <LocaleScript locale={locale} />
        <SkipLink locale={locale} />
        {children}
      </body>
    </html>
  );
}
