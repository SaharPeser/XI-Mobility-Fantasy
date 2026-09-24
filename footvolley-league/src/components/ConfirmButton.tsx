"use client";

import type { ComponentProps } from "react";

/** כפתור שליחה שמבקש אישור לפני פעולה בלתי הפיכה */
export function ConfirmButton({ message, ...props }: ComponentProps<"button"> & { message: string }) {
  return (
    <button
      {...props}
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    />
  );
}
