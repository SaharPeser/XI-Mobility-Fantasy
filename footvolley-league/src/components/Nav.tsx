import Link from "next/link";
import { getSessionUser } from "@/lib/data";
import { logout } from "@/app/login/actions";
import { SponsorLogo } from "./Sponsor";

const LINKS = [
  { href: "/rounds", label: "מחזורים" },
  { href: "/predict-table", label: "ניחוש טבלה" },
  { href: "/standings", label: "טבלת הליגה" },
  { href: "/leaderboard", label: "דירוג" },
  { href: "/leagues", label: "ליגות חברים" },
];

export async function Nav() {
  const user = await getSessionUser();
  return (
    <header className="sticky top-0 z-10 bg-brand-dark text-white shadow-md">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="דף הבית">
          <SponsorLogo className="h-5 sm:h-6" />
          <span className="border-r border-white/20 pr-3 text-sm font-bold whitespace-nowrap text-brand">
            ליגת הפוצ&apos;יוולי
          </span>
        </Link>
        <div className="flex items-center gap-2 text-sm">
          {user ? (
            <>
              {user.isAdmin && (
                <Link href="/admin" className="rounded-lg bg-brand px-2 py-1 font-bold text-brand-dark">
                  ניהול
                </Link>
              )}
              <span className="hidden text-white/70 sm:inline">{user.displayName}</span>
              <form action={logout}>
                <button className="text-white/70 hover:text-white">יציאה</button>
              </form>
            </>
          ) : (
            <Link href="/login" className="btn-brand py-1.5">
              כניסה
            </Link>
          )}
        </div>
      </div>
      <nav className="mx-auto flex max-w-3xl gap-1 overflow-x-auto px-2 pb-2 text-sm">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="whitespace-nowrap rounded-lg px-3 py-1.5 text-white/80 hover:bg-white/10 hover:text-white"
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
