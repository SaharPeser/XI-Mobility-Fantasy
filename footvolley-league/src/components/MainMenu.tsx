"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logout } from "@/app/login/actions";
import { SponsorLogo } from "./Sponsor";

export type MenuItem = { href: string; label: string; icon: string };

type MenuUser = { displayName: string; isAdmin: boolean } | null;

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/** כפתור התפריט בכותרת, והתפריט הגדול שנפתח מעל העמוד בסגנון הבאנר */
export function MainMenu({ items, user }: { items: MenuItem[]; user: MenuUser }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // סגירה אוטומטית כשעוברים לעמוד אחר
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  // Escape סוגר, והעמוד שמאחור לא נגלל כשהתפריט פתוח
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open]);

  const current = items.find((i) => isActive(pathname, i.href));

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="main-menu"
        className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-bold ring-1 ring-white/15 transition hover:bg-white/15 active:scale-95"
      >
        <span className="flex h-3.5 w-4 flex-col justify-between" aria-hidden>
          <span className="h-0.5 rounded bg-brand" />
          <span className="h-0.5 rounded bg-white" />
          <span className="h-0.5 w-2.5 rounded bg-brand" />
        </span>
        <span>{current?.label ?? "תפריט"}</span>
      </button>

      <div
        className={`fixed inset-0 z-50 transition ${open ? "visible" : "invisible"}`}
        aria-hidden={!open}
        onClick={() => setOpen(false)}
      >
        {/* רקע כהה מאחורי התפריט */}
        <div
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
            open ? "opacity-100" : "opacity-0"
          }`}
        />

        <nav
          id="main-menu"
          role="dialog"
          aria-modal="true"
          aria-label="תפריט ראשי"
          onClick={(e) => e.stopPropagation()}
          className={`brand-stripes absolute inset-x-3 top-3 bottom-3 mx-auto flex max-w-md flex-col overflow-hidden rounded-3xl bg-brand-dark text-white shadow-2xl ring-1 ring-white/10 transition duration-300 ${
            open ? "translate-y-0 opacity-100" : "-translate-y-6 opacity-0"
          }`}
        >
          <div className="flex items-center justify-between gap-3 px-6 pt-6">
            <div className="flex items-center gap-2 text-xs font-medium text-white/70">
              <span>בחסות</span>
              <SponsorLogo className="h-4" />
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="סגירת התפריט"
              className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-xl transition hover:bg-white/20 active:scale-95"
            >
              ✕
            </button>
          </div>

          <div className="px-6 pt-4">
            <p className="text-3xl leading-tight font-extrabold">
              משחק הניחושים של <span className="text-brand">ליגת הפוצ&apos;יוולי</span>
            </p>
            {user && <p className="mt-1 text-sm text-white/70">שלום, {user.displayName}</p>}
          </div>

          <ul className="mt-5 flex-1 space-y-1 overflow-y-auto px-3">
            {items.map((item, i) => {
              const active = isActive(pathname, item.href);
              return (
                <li
                  key={item.href}
                  className={`transition duration-300 ${open ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"}`}
                  style={{ transitionDelay: open ? `${60 + i * 35}ms` : "0ms" }}
                >
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    tabIndex={open ? 0 : -1}
                    className={`group relative flex items-center gap-4 rounded-2xl px-3 py-3 text-2xl font-extrabold transition active:scale-[0.98] ${
                      active ? "bg-brand text-brand-dark" : "hover:bg-white/10"
                    }`}
                  >
                    <span
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xl ${
                        active ? "bg-brand-dark/15" : "bg-white/10"
                      }`}
                      aria-hidden
                    >
                      {item.icon}
                    </span>
                    <span className="flex-1">{item.label}</span>
                    <PendingArrow active={active} />
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="space-y-2 border-t border-white/10 px-6 py-5">
            {user ? (
              <div className="flex items-center gap-2">
                {user.isAdmin && (
                  <Link href="/admin" tabIndex={open ? 0 : -1} className="btn-brand flex-1 py-2.5">
                    ⚙️ ניהול
                  </Link>
                )}
                <form action={logout} className={user.isAdmin ? "" : "flex-1"}>
                  <button
                    tabIndex={open ? 0 : -1}
                    className="w-full rounded-xl px-4 py-2.5 font-bold text-white/80 ring-1 ring-white/20 transition hover:bg-white/10 active:scale-[0.97]"
                  >
                    יציאה
                  </button>
                </form>
              </div>
            ) : (
              <Link href="/login" tabIndex={open ? 0 : -1} className="btn-brand w-full py-3 text-lg">
                כניסה / הרשמה
              </Link>
            )}
          </div>
        </nav>
      </div>
    </>
  );
}

/** החץ בסוף השורה: מהבהב בזמן שהעמוד החדש נטען */
function PendingArrow({ active }: { active: boolean }) {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden
      className={`text-xl transition ${pending ? "animate-pulse text-brand" : active ? "" : "text-white/40 group-hover:text-brand"}`}
    >
      ←
    </span>
  );
}
