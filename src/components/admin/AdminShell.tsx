"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  AtSign,
  FolderKanban,
  Grid3x3,
  LogOut,
  Mail,
  Menu,
  Send,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { logout } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin/matrix", label: "Matrix", icon: Grid3x3 },
  { href: "/admin/templates", label: "Šablóny", icon: Mail },
  { href: "/admin/leads", label: "Leady", icon: Users },
  { href: "/admin/touches", label: "Odoslané", icon: Send },
  { href: "/admin/runs", label: "Behania", icon: Activity },
  { href: "/admin/accounts", label: "Účty 1–5", icon: AtSign },
  { href: "/admin/projects", label: "Projekty", icon: FolderKanban },
] as const;

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-sidebar-active text-zinc-900 shadow-sm"
          : "text-zinc-600 hover:bg-sidebar-hover hover:text-zinc-900",
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon
        className={cn(
          "size-4 shrink-0",
          active ? "text-zinc-900" : "text-zinc-500 group-hover:text-zinc-900",
        )}
        aria-hidden
      />
      {label}
    </Link>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebar = (
    <>
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-sidebar-border px-4">
        <div className="flex size-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
          S
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-none text-zinc-900">
            stredan.sk
          </p>
          <p className="truncate text-xs text-zinc-500">Admin</p>
        </div>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1" aria-label="Admin navigácia">
          {NAV.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <NavLink
                key={item.href}
                {...item}
                active={active}
                onNavigate={() => setMobileOpen(false)}
              />
            );
          })}
        </nav>
      </ScrollArea>

      <div className="shrink-0 border-t border-sidebar-border p-3">
        <form action={logout}>
          <Button
            type="submit"
            variant="ghost"
            className="w-full justify-start gap-3 text-zinc-600 hover:bg-sidebar-hover hover:text-zinc-900"
          >
            <LogOut className="size-4" aria-hidden />
            Odhlásiť
          </Button>
        </form>
      </div>
    </>
  );

  return (
    <div className="admin flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px] md:hidden"
          aria-label="Zavrieť menu"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        id="admin-mobile-nav"
        inert={!mobileOpen ? true : undefined}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-sidebar-border bg-sidebar shadow-xl transition-transform duration-200 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full pointer-events-none",
        )}
        aria-hidden={!mobileOpen}
      >
        {sidebar}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur-md md:hidden">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen((open) => !open)}
            aria-expanded={mobileOpen}
            aria-controls="admin-mobile-nav"
          >
            {mobileOpen ? (
              <X className="size-5" aria-hidden />
            ) : (
              <Menu className="size-5" aria-hidden />
            )}
            <span className="sr-only">Menu</span>
          </Button>
          <Separator orientation="vertical" className="h-5 md:hidden" />
          <p className="text-sm font-medium text-muted md:hidden">Admin</p>
        </header>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
