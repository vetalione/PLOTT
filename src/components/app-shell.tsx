"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { Analytics01Icon, LeftToRightListBulletIcon, UserIcon } from "@hugeicons/core-free-icons";
import { cn } from "cn";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { AuthDialogProvider } from "./auth-dialog";
import { LogoMark } from "./logo";

const NAV: { href: string; label: string; icon: IconSvgElement | null }[] = [
  { href: "/", label: "Кнопка", icon: null }, // the brand mark
  { href: "/wishes", label: "Желания", icon: LeftToRightListBulletIcon },
  { href: "/stats", label: "Статистика", icon: Analytics01Icon },
  { href: "/profile", label: "Профиль", icon: UserIcon },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // A magic link that is expired or already used sends the visitor back with ?error=…
  React.useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("error")) return;
    url.searchParams.delete("error");
    window.history.replaceState(null, "", url);
    const id = window.setTimeout(() => toast.error("Ссылка недействительна или устарела. Запроси новую."), 300);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <AuthDialogProvider>
      {/* Confetti and the button's orbits may fly past the edge of a phone screen; clipping here keeps the page from scrolling sideways. */}
      <div className="overflow-x-clip">
        <div className="plush-font mx-auto flex min-h-dvh w-full max-w-(--app-column) flex-col px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-(--nav-clearance)">
          {children}
        </div>
      </div>

      <nav
        aria-label="Разделы"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        {/* a veil so list content dissolves under the bar instead of colliding with it */}
        <div className="absolute inset-x-0 bottom-0 -z-10 h-28 bg-linear-to-t from-(--plush-bg) from-45% to-transparent" />
        <ul className="pointer-events-auto flex items-center gap-1 rounded-full bg-(--plush-surface)/85 p-1.5 shadow-[0_1px_2px_rgba(20,20,20,.05),0_12px_32px_rgba(20,20,20,.10)] ring-1 ring-black/[0.03] backdrop-blur-xl">
          {NAV.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "plush-focus-ring group flex h-12 items-center gap-2 rounded-full px-4 text-(length:--plush-text-md) font-(--plush-weight-semi) select-none",
                    "[transition:background-color_var(--plush-dur-fast)_var(--plush-ease-fade),color_var(--plush-dur-fast)_var(--plush-ease-fade),scale_var(--plush-dur-spring)_var(--plush-ease-spring)] active:scale-(--plush-press-scale-pill)",
                    active
                      ? "bg-(--plush-accent) text-(--plush-on-accent)"
                      : "text-(--plush-ink-2) hover:bg-(--plush-fill) hover:text-(--plush-ink)",
                  )}
                >
                  {item.icon ? (
                    <HugeiconsIcon icon={item.icon} size={22} strokeWidth={1.9} aria-hidden className="shrink-0" />
                  ) : (
                    <LogoMark className="size-[21px] shrink-0" />
                  )}
                  <span
                    className={cn(
                      "grid overflow-hidden [transition:grid-template-columns_var(--plush-dur-spring)_var(--plush-ease-spring),opacity_var(--plush-dur-fade)_var(--plush-ease-fade)]",
                      active ? "grid-cols-[1fr] opacity-100" : "grid-cols-[0fr] opacity-0 max-sm:sr-only sm:group-hover:grid-cols-[1fr] sm:group-hover:opacity-100",
                    )}
                  >
                    <span className="min-w-0 whitespace-nowrap">{item.label}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <Toaster position="top-center" />
    </AuthDialogProvider>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="rise mb-5 flex items-end justify-between gap-3 pt-2">
      <div className="min-w-0">
        <h1 className="text-[30px] leading-[1.1] font-(--plush-weight-semi) tracking-[-0.01em] text-balance">{title}</h1>
        {subtitle && <p className="mt-1.5 text-(length:--plush-text-lg) text-(--plush-ink-2)">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}
