import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { getLocale } from "@/lib/locale";
import LocaleScript from "@/components/LocaleScript";
import { SkipLink } from "@/components/SkipLink";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
});


export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const isSk = locale === "sk";
  return {
    title: isSk
      ? "Stredan: AI, ktoré znižuje prácu"
      : "Stredan: AI that cuts work",
    description: isSk
      ? "AI agenti a workflow pre slovenské SME. Od auditu po produkciu, s merateľným výsledkom."
      : "AI agents and workflows for Slovak SMEs. From audit to production, with measurable results.",
    icons: {
      icon: [
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      ],
      apple: "/apple-touch-icon.png",
    },
    manifest: "/site.webmanifest",
    openGraph: {
      title: isSk
        ? "Stredan: AI, ktoré znižuje prácu"
        : "Stredan: AI that cuts work",
      description: isSk
        ? "AI agenti a workflow pre slovenské SME. Od auditu po produkciu."
        : "AI agents and workflows for Slovak SMEs. From audit to production.",
      url: "https://stredan.sk",
      siteName: "Stredan",
      locale: isSk ? "sk_SK" : "en_US",
      type: "website",
      images: [{ url: "/team/david.webp" }],
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
