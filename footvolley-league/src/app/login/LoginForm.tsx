"use client";

import { useActionState, useState } from "react";
import { login, signup, type AuthState } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loginState, loginAction, loginPending] = useActionState<AuthState, FormData>(login, {});
  const [signupState, signupAction, signupPending] = useActionState<AuthState, FormData>(signup, {});
  const state = mode === "login" ? loginState : signupState;
  const pending = mode === "login" ? loginPending : signupPending;

  return (
    <div className="card mx-auto max-w-sm">
      <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-accent-soft p-1 text-sm font-medium">
        {(["login", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded-lg py-2 ${mode === m ? "bg-card shadow-sm" : "text-muted"}`}
          >
            {m === "login" ? "כניסה" : "הרשמה"}
          </button>
        ))}
      </div>
      <form action={mode === "login" ? loginAction : signupAction} className="space-y-3">
        <input type="hidden" name="next" value={next} />
        {mode === "signup" && (
          <div>
            <label className="label" htmlFor="display_name">שם תצוגה (יופיע בטבלאות)</label>
            <input className="input" id="display_name" name="display_name" required minLength={2} maxLength={30} />
          </div>
        )}
        <div>
          <label className="label" htmlFor="email">מייל</label>
          <input className="input" id="email" name="email" type="email" dir="ltr" required autoComplete="email" />
        </div>
        <div>
          <label className="label" htmlFor="password">סיסמה</label>
          <input
            className="input"
            id="password"
            name="password"
            type="password"
            dir="ltr"
            required
            minLength={6}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
        </div>
        {state.error && <p className="text-sm text-rose-600">{state.error}</p>}
        {state.message && <p className="text-sm text-emerald-600">{state.message}</p>}
        <button className="btn w-full" disabled={pending}>
          {pending ? "רגע..." : mode === "login" ? "כניסה" : "הרשמה"}
        </button>
      </form>
    </div>
  );
}
