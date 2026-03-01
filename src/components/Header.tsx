"use client";

import Link from "next/link";
import { useState } from "react";
import { createPortal } from "react-dom";
import { ui, type Locale } from "@/lib/translations";
import LocaleSwitcher from "./LocaleSwitcher";

const MENU_ANIMATION_DURATION = 200;

export default function Header({ locale }: { locale: Locale }) {
  const t = ui[locale];
  const [menuOpen, setMenuOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const closeMenu = () => {
    if (!menuOpen) return;
    setIsClosing(true);
    setTimeout(() => {
      setMenuOpen(false);
      setIsClosing(false);
    }, MENU_ANIMATION_DURATION);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <Link
          href="/"
          className="font-heading text-2xl font-semibold transition-colors hover:opacity-80"
        >
          <span className="text-zinc-500">David </span>
          <span className="text-foreground">Stredan</span>
          <span className="text-foreground">.sk</span>
          <span className="text-zinc-500">y</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex">
          <a
            href="#work"
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            {t.work}
          </a>
          <a
            href="#experience"
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            {t.experience}
          </a>
          <LocaleSwitcher locale={locale} />
        </nav>

        {/* Mobile menu button - three dots */}
        <button
          type="button"
          onClick={() => (menuOpen ? closeMenu() : setMenuOpen(true))}
          className="flex size-10 items-center justify-center text-muted transition-colors hover:text-foreground md:hidden"
          aria-label={menuOpen ? "Zavrieť menu" : "Otvoriť menu"}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <circle cx="6" cy="12" r="1.5" fill="currentColor" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" />
            <circle cx="18" cy="12" r="1.5" fill="currentColor" />
          </svg>
        </button>
      </div>

      {/* Mobile menu - slides from right, rendered via portal to cover full screen */}
      {(menuOpen || isClosing) &&
        typeof document !== "undefined" &&
        createPortal(
          <>
            <div
              className={`fixed inset-0 z-[100] bg-zinc-400/40 backdrop-blur-sm md:hidden ${isClosing ? "animate-[fade-out_0.2s_ease-out_forwards]" : "animate-[fade-in_0.2s_ease-out]"}`}
              onClick={closeMenu}
              aria-hidden
            />
            <nav
              className={`fixed right-0 top-0 z-[110] flex h-dvh w-80 max-w-[90vw] flex-col border-l border-border/50 bg-background md:hidden ${isClosing ? "animate-[slide-out-to-right_0.2s_ease-in_forwards]" : "animate-[slide-in-from-right_0.2s_ease-out]"}`}
              aria-label="Mobilné menu"
            >
              <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
                <span className="text-sm font-medium text-muted">Menu</span>
                <button
                  type="button"
                  onClick={closeMenu}
                  className="flex size-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-muted/20 hover:text-foreground"
                  aria-label="Zavrieť menu"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-6">
                <div className="space-y-1">
                  <Link
                    href="/#work"
                    onClick={closeMenu}
                    className="block rounded-lg px-4 py-3 text-base text-foreground transition-colors hover:bg-muted/20"
                  >
                    {t.work}
                  </Link>
                  <Link
                    href="/#experience"
                    onClick={closeMenu}
                    className="block rounded-lg px-4 py-3 text-base text-foreground transition-colors hover:bg-muted/20"
                  >
                    {t.experience}
                  </Link>
                </div>
                <div className="my-2 h-px bg-border/50" />
                <div className="space-y-1">
                  <Link
                    href="/books"
                    onClick={closeMenu}
                    className="block rounded-lg px-4 py-3 text-base text-foreground transition-colors hover:bg-muted/20"
                  >
                    {t.heroLinkBooks}
                  </Link>
                  <Link
                    href="/essays"
                    onClick={closeMenu}
                    className="block rounded-lg px-4 py-3 text-base text-foreground transition-colors hover:bg-muted/20"
                  >
                    {t.heroLinkEssays}
                  </Link>
                </div>
                <div className="mt-6 border-t border-border/50 pt-4">
                  <LocaleSwitcher locale={locale} className="text-foreground" />
                </div>
              </div>
            </nav>
          </>,
          document.body
        )}
    </header>
  );
}
