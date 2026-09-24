"use client";

import { useState } from "react";

export function CopyInvite({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = `${window.location.origin}/join/${code}`;
    const text = `הצטרפו לליגת הניחושים שלי בפוצ'יוולי! קוד: ${code}\n${url}`;
    try {
      if (navigator.share) {
        await navigator.share({ text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // המשתמש ביטל את השיתוף
    }
  };

  return (
    <div className="card flex items-center justify-between gap-3">
      <div>
        <div className="text-sm text-muted">קוד הזמנה</div>
        <div className="font-mono text-2xl font-bold tracking-widest" dir="ltr">
          {code}
        </div>
      </div>
      <button className="btn" onClick={share}>
        {copied ? "הועתק ✓" : "שיתוף הזמנה"}
      </button>
    </div>
  );
}
