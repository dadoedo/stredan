import type { Metadata } from "next";
import { Inter, Noto_Serif_HK } from "next/font/google";
import "./globals.css";
import { getLocale } from "@/lib/locale";
import LocaleScript from "@/components/LocaleScript";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
});

const notoSerifHK = Noto_Serif_HK({
  variable: "--font-noto-serif-hk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const isSk = locale === "sk";
  return {
    title: "Dávid Stredánsky",
    description: isSk
      ? "Full-stack vývojár — Portfolio & CV"
      : "Full-stack developer — Portfolio & CV",
    icons: {
      icon: [
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      ],
      apple: "/apple-touch-icon.png",
    },
    manifest: "/site.webmanifest",
    openGraph: {
      title: "Dávid Stredánsky",
      description: isSk
        ? "Full-stack vývojár — Portfolio & CV"
        : "Full-stack developer — Portfolio & CV",
      url: "https://stredan.sk",
      siteName: "Dávid Stredánsky",
      locale: isSk ? "sk_SK" : "en_US",
      type: "website",
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
      <body
        className={`${inter.variable} ${notoSerifHK.variable} antialiased`}
      >
        <LocaleScript locale={locale} />
        {children}
      </body>
    </html>
  );
}
