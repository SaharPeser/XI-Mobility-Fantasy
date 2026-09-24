import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/data";
import { AdminNotice } from "./AdminNotice";

const LINKS = [
  { href: "/admin", label: "עונה וניקוד" },
  { href: "/admin/teams", label: "קבוצות ושחקנים" },
  { href: "/admin/rounds", label: "מחזורים ומשחקים" },
  { href: "/admin/standings", label: "דירוג סופי" },
];

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();
  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <span className="rounded-lg bg-brand px-2 py-1 text-sm font-bold text-brand-dark">ניהול</span>
        <nav className="flex gap-1 overflow-x-auto text-sm">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="whitespace-nowrap rounded-lg px-3 py-1.5 hover:bg-accent-soft">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
      <Suspense>
        <AdminNotice />
      </Suspense>
      {children}
    </div>
  );
}
