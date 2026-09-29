"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

type NavItem = { href: string; label: string };

const STYLES = {
  // תפריט ראשי על רקע כהה
  dark: {
    base: "text-white/80 hover:bg-white/10 hover:text-white active:bg-white/20",
    active: "bg-brand font-bold text-brand-dark shadow-sm",
    pending: "bg-white/20 text-white",
  },
  // תפריט הניהול על רקע בהיר
  light: {
    base: "hover:bg-accent-soft active:bg-accent-soft",
    active: "bg-accent font-bold text-accent-contrast shadow-sm",
    pending: "bg-accent-soft text-accent",
  },
};

/** האם הקישור מתאים לעמוד הנוכחי. exact = רק כתובת זהה (למשל /admin שהוא אב לעמודים אחרים) */
function isActive(pathname: string, href: string, exact: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

/** קישורי תפריט שמסמנים את העמוד הנוכחי ומגיבים מיד ללחיצה */
export function NavLinks({
  items,
  variant = "dark",
  exact = [],
  className = "",
}: {
  items: NavItem[];
  variant?: keyof typeof STYLES;
  exact?: string[];
  className?: string;
}) {
  const pathname = usePathname();
  const activeRef = useRef<HTMLAnchorElement>(null);

  // בטלפון התפריט נגלל הצידה: מוודאים שהקישור הפעיל נראה
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [pathname]);

  return (
    <nav className={`flex gap-1 overflow-x-auto text-sm ${className}`}>
      {items.map((item) => {
        const active = isActive(pathname, item.href, exact.includes(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            ref={active ? activeRef : undefined}
            aria-current={active ? "page" : undefined}
            className={`relative whitespace-nowrap rounded-lg px-3 py-1.5 transition active:scale-95 ${
              active ? STYLES[variant].active : STYLES[variant].base
            }`}
          >
            <PendingLabel label={item.label} pendingClass={STYLES[variant].pending} />
          </Link>
        );
      })}
    </nav>
  );
}

/** בזמן המעבר לעמוד החדש הקישור שנלחץ נצבע ומהבהב עד שהעמוד נטען */
function PendingLabel({ label, pendingClass }: { label: string; pendingClass: string }) {
  const { pending } = useLinkStatus();
  return (
    <>
      <span
        aria-hidden
        className={`absolute inset-0 rounded-lg transition-opacity ${pendingClass} ${
          pending ? "animate-pulse opacity-100" : "opacity-0"
        }`}
      />
      <span className="relative">{label}</span>
    </>
  );
}
