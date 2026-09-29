import { Suspense } from "react";
import { NavLinks } from "@/components/NavLinks";
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
        <NavLinks items={LINKS} variant="light" exact={["/admin"]} />
      </div>
      <Suspense>
        <AdminNotice />
      </Suspense>
      {children}
    </div>
  );
}
