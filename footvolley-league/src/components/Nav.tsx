import Link from "next/link";
import { getSessionUser } from "@/lib/data";
import { logout } from "@/app/login/actions";

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
    <header className="sticky top-0 z-10 border-b border-border bg-card/90 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 whitespace-nowrap text-lg font-bold">
          <span aria-hidden>🏐</span>
          <span>
            פוצ&apos;יוולי<span className="hidden sm:inline"> ניחושים</span>
          </span>
        </Link>
        <div className="flex items-center gap-2 text-sm">
          {user ? (
            <>
              {user.isAdmin && (
                <Link href="/admin" className="rounded-lg bg-sand px-2 py-1 font-medium text-stone-900">
                  ניהול
                </Link>
              )}
              <span className="hidden text-muted sm:inline">{user.displayName}</span>
              <form action={logout}>
                <button className="text-muted hover:text-foreground">יציאה</button>
              </form>
            </>
          ) : (
            <Link href="/login" className="btn py-1.5">
              כניסה
            </Link>
          )}
        </div>
      </div>
      <nav className="mx-auto flex max-w-3xl gap-1 overflow-x-auto px-2 pb-2 text-sm">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="whitespace-nowrap rounded-lg px-3 py-1.5 hover:bg-accent-soft">
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
