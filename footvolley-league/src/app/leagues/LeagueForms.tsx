"use client";

import { useActionState } from "react";
import { createLeague, joinLeague, type LeagueState } from "./actions";

export function LeagueForms({ initialCode = "" }: { initialCode?: string }) {
  const [createState, createAction, creating] = useActionState<LeagueState, FormData>(createLeague, {});
  const [joinState, joinAction, joining] = useActionState<LeagueState, FormData>(joinLeague, {});

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <form action={joinAction} className="card space-y-2">
        <h2 className="font-bold">הצטרפות עם קוד</h2>
        <input
          className="input text-center font-mono uppercase tracking-widest"
          name="code"
          placeholder="ABC123"
          defaultValue={initialCode}
          dir="ltr"
          maxLength={6}
        />
        {joinState.error && <p className="text-sm text-rose-600">{joinState.error}</p>}
        <button className="btn w-full" disabled={joining}>
          הצטרפות
        </button>
      </form>
      <form action={createAction} className="card space-y-2">
        <h2 className="font-bold">יצירת ליגה חדשה</h2>
        <input className="input" name="name" placeholder="שם הליגה" maxLength={40} />
        {createState.error && <p className="text-sm text-rose-600">{createState.error}</p>}
        <button className="btn-secondary w-full" disabled={creating}>
          יצירה
        </button>
      </form>
    </div>
  );
}
