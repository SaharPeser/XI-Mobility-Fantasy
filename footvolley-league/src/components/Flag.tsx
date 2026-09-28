import type { Nationality } from "@/lib/types";

export const NATIONALITY_LABEL: Record<Nationality, string> = { IL: "ישראלי", BR: "ברזילאי" };

/** דגל קטן כ-SVG (אימוג'י דגלים לא מוצגים ב-Windows) */
export function Flag({ code, className = "h-3.5 w-5" }: { code?: Nationality | null; className?: string }) {
  const label = NATIONALITY_LABEL[code ?? "IL"];
  if (code === "BR") {
    return (
      <svg viewBox="0 0 20 14" className={`shrink-0 rounded-[2px] ${className}`} role="img" aria-label={label}>
        <rect width="20" height="14" fill="#009c3b" />
        <path d="M10 1.6 18.2 7 10 12.4 1.8 7z" fill="#ffdf00" />
        <circle cx="10" cy="7" r="3.1" fill="#002776" />
        <path d="M7 6.3c2-.6 4.2-.4 6 .6" stroke="#fff" strokeWidth=".6" fill="none" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 20 14" className={`shrink-0 rounded-[2px] ${className}`} role="img" aria-label={label}>
      <rect width="20" height="14" fill="#fff" />
      <rect y="1.4" width="20" height="1.8" fill="#0038b8" />
      <rect y="10.8" width="20" height="1.8" fill="#0038b8" />
      <path d="M10 4.3 12.3 8.3H7.7zM10 9.7 7.7 5.7h4.6z" stroke="#0038b8" strokeWidth=".7" fill="none" />
    </svg>
  );
}
