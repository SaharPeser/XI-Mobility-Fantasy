"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function AdminNotice() {
  const params = useSearchParams();
  const error = params.get("error");
  const ok = params.get("ok");
  const key = params.toString();
  const [dismissed, setDismissed] = useState<string | null>(null);

  useEffect(() => {
    if (!ok) return;
    const t = setTimeout(() => setDismissed(key), 2500);
    return () => clearTimeout(t);
  }, [ok, key]);

  if ((!error && !ok) || dismissed === key) return null;
  return (
    <div
      className={`mb-4 flex items-center justify-between rounded-xl px-4 py-2 text-sm ${
        error
          ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200"
          : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
      }`}
    >
      <span>{error ?? "נשמר ✓"}</span>
      <button onClick={() => setDismissed(key)} aria-label="סגירה">
        ✕
      </button>
    </div>
  );
}
