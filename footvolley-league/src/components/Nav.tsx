import Link from "next/link";
import { getSessionUser } from "@/lib/data";
import { MainMenu, type MenuItem } from "./MainMenu";
import { NavLinks } from "./NavLinks";
import { SponsorLogo } from "./Sponsor";

const LINKS: MenuItem[] = [
  { href: "/", label: "ראשי", icon: "🏠" },
  { href: "/rounds", label: "מחזורים", icon: "🏐" },
  { href: "/predict-table", label: "ניחוש טבלה", icon: "🔮" },
  { href: "/standings", label: "טבלת הליגה", icon: "📊" },
  { href: "/leaderboard", label: "דירוג", icon: "🏆" },
  { href: "/players", label: "שחקנים", icon: "⭐" },
  { href: "/leagues", label: "ליגות חברים", icon: "👥" },
  { href: "/rules", label: "חוקי הניקוד", icon: "📖" },
];

export async function Nav() {
  const user = await getSessionUser();
  return (
    <header className="sticky top-0 z-40 bg-brand-dark text-white shadow-md">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="דף הבית">
          <SponsorLogo className="h-5 sm:h-6" />
          <span className="border-r border-white/20 pr-3 text-sm font-bold whitespace-nowrap text-brand">
            ליגת הפוצ&apos;יוולי
          </span>
        </Link>
        <MainMenu items={LINKS} user={user ? { displayName: user.displayName, isAdmin: user.isAdmin } : null} />
      </div>
      {/* שורת הקיצורים הנגללת (בלי "ראשי", שאליו מגיעים מהלוגו) */}
      <NavLinks items={LINKS.filter((l) => l.href !== "/")} className="mx-auto max-w-3xl px-2 pb-2" />
    </header>
  );
}
