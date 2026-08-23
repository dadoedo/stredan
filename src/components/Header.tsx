"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ui, type Locale } from "@/lib/translations";
import LocaleSwitcher from "./LocaleSwitcher";

const MENU_ANIMATION_DURATION = 200;

export default function Header({ locale }: { locale: Locale }) {
  const t = ui[locale];
  const [menuOpen, setMenuOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const menuRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const closeMenu = () => {
    if (!menuOpen) return;
    setIsClosing(true);
    setTimeout(() => {
      setMenuOpen(false);
      setIsClosing(false);
      menuButtonRef.current?.focus();
    }, MENU_ANIMATION_DURATION);
  };

  const openMenu = () => {
    setMenuOpen(true);
  };

  useEffect(() => {
    if (!menuOpen) return;

    document.body.style.overflow = "hidden";

    const menu = menuRef.current;
    const focusable = menu?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    focusable?.[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
        return;
      }

      if (event.key !== "Tab" || !focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  const navLinkClass =
    "text-sm text-muted underline-offset-4 transition-colors hover:text-foreground hover:underline";

  return (
    <header className="header-agency w-full">
      <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between px-6">
        <Link
          href="/"
          className="text-[15px] font-semibold tracking-tight text-foreground"
        >
          STREDAN
        </Link>

        <nav
          className="hidden items-center gap-8 md:flex"
          aria-label={t.primaryNav}
        >
          <Link href="/#offers" className={navLinkClass}>
            {t.navOffers}
          </Link>
          <Link href="/about" className={navLinkClass}>
            {t.navAbout}
          </Link>
          <Link href="/#work" className={navLinkClass}>
            {t.work}
          </Link>
          <LocaleSwitcher locale={locale} />
        </nav>

        <button
          ref={menuButtonRef}
          type="button"
          onClick={() => (menuOpen ? closeMenu() : openMenu())}
          className="flex min-h-11 min-w-11 items-center justify-center text-foreground md:hidden"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? t.closeMenu : t.openMenu}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden
          >
            <circle cx="6" cy="12" r="1.5" fill="currentColor" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" />
            <circle cx="18" cy="12" r="1.5" fill="currentColor" />
          </svg>
        </button>
      </div>

      {(menuOpen || isClosing) &&
        typeof document !== "undefined" &&
        createPortal(
          <>
            <div
              className={`fixed inset-0 z-[100] bg-black/30 backdrop-blur-sm md:hidden ${isClosing ? "animate-[fade-out_0.2s_ease-out_forwards]" : "animate-[fade-in_0.2s_ease-out]"}`}
              onClick={closeMenu}
              aria-hidden
            />
            <nav
              ref={menuRef}
              id="mobile-menu"
              className={`fixed right-0 top-0 z-[110] flex h-dvh w-80 max-w-[90vw] flex-col border-l border-border bg-background text-foreground md:hidden ${isClosing ? "animate-[slide-out-to-right_0.2s_ease-in_forwards]" : "animate-[slide-in-from-right_0.2s_ease-out]"}`}
              aria-label={t.mobileMenu}
            >
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <span className="text-sm font-medium text-muted">Menu</span>
                <button
                  type="button"
                  onClick={closeMenu}
                  className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
                  aria-label={t.closeMenu}
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
                    aria-hidden
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-6">
                <div className="space-y-1">
                  <Link
                    href="/#offers"
                    onClick={closeMenu}
                    className="block min-h-11 rounded-lg px-4 py-3 text-base text-foreground transition-colors hover:bg-surface-2"
                  >
                    {t.navOffers}
                  </Link>
                  <Link
                    href="/about"
                    onClick={closeMenu}
                    className="block min-h-11 rounded-lg px-4 py-3 text-base text-foreground transition-colors hover:bg-surface-2"
                  >
                    {t.navAbout}
                  </Link>
                  <Link
                    href="/#work"
                    onClick={closeMenu}
                    className="block min-h-11 rounded-lg px-4 py-3 text-base text-foreground transition-colors hover:bg-surface-2"
                  >
                    {t.work}
                  </Link>
                </div>
                <div className="my-2 h-px bg-border" />
                <div className="space-y-1">
                  <Link
                    href="/books"
                    onClick={closeMenu}
                    className="block min-h-11 rounded-lg px-4 py-3 text-base text-foreground transition-colors hover:bg-surface-2"
                  >
                    {t.heroLinkBooks}
                  </Link>
                  <Link
                    href="/essays"
                    onClick={closeMenu}
                    className="block min-h-11 rounded-lg px-4 py-3 text-base text-foreground transition-colors hover:bg-surface-2"
                  >
                    {t.heroLinkEssays}
                  </Link>
                </div>
                <div className="mt-6 border-t border-border pt-4">
                  <LocaleSwitcher locale={locale} className="text-foreground" />
                </div>
              </div>
            </nav>
          </>,
          document.body,
        )}
    </header>
  );
}
