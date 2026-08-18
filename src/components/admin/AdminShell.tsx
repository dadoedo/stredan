"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/actions/admin";

const NAV = [
  { href: "/admin/matrix", label: "Matrix" },
  { href: "/admin/templates", label: "Šablóny" },
  { href: "/admin/leads", label: "Leady" },
  { href: "/admin/touches", label: "Odoslané" },
  { href: "/admin/runs", label: "Behania" },
  { href: "/admin/accounts", label: "Účty 1–5" },
  { href: "/admin/projects", label: "Projekty" },
] as const;

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-muted">
              stredan.sk
            </p>
            <h1 className="font-heading text-2xl font-semibold">Admin</h1>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="rounded border border-border px-4 py-2 text-sm text-muted transition-colors hover:text-foreground"
            >
              Odhlásiť
            </button>
          </form>
        </header>

        <nav className="mb-8 flex flex-wrap gap-2 border-b border-border pb-4">
          {NAV.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? "bg-foreground text-background"
                    : "border border-border text-muted hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {children}
      </div>
    </div>
  );
}
