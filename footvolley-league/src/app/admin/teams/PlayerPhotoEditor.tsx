"use client";

import { useEffect, useRef, useState, useTransition, type PointerEvent } from "react";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import type { Player } from "@/lib/types";
import { removePlayerPhoto, uploadPlayerPhoto } from "../actions";

/** גודל אזור החיתוך במסך, וגודל התמונה שנשמרת */
const VIEW = 260;
const OUT = 400;

type Loaded = { img: HTMLImageElement; url: string };

/** עיגול התמונה של השחקן בניהול. לחיצה פותחת חלון העלאה וחיתוך לעיגול */
export function PlayerPhotoEditor({ player }: { player: Pick<Player, "id" | "name" | "photo_url"> }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative shrink-0 rounded-full transition active:scale-95"
        title={player.photo_url ? "החלפת תמונה" : "הוספת תמונה"}
        aria-label={`תמונה של ${player.name}`}
      >
        <PlayerAvatar player={player} className="h-10 w-10 text-sm" />
        <span className="absolute -bottom-1 -left-1 grid h-5 w-5 place-items-center rounded-full bg-accent text-[10px] text-accent-contrast ring-2 ring-card">
          📷
        </span>
      </button>
      {open && <CropDialog player={player} onClose={() => setOpen(false)} />}
    </>
  );
}

function CropDialog({ player, onClose }: { player: Pick<Player, "id" | "name" | "photo_url">; onClose: () => void }) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // שחרור הזיכרון של התמונה המקומית
  useEffect(
    () => () => {
      if (loaded) URL.revokeObjectURL(loaded.url);
    },
    [loaded],
  );

  // קנה המידה שבו התמונה מכסה בדיוק את העיגול, כפול הזום
  const scale = loaded ? Math.max(VIEW / loaded.img.naturalWidth, VIEW / loaded.img.naturalHeight) * zoom : 1;
  const w = loaded ? loaded.img.naturalWidth * scale : 0;
  const h = loaded ? loaded.img.naturalHeight * scale : 0;

  const clamp = (p: { x: number; y: number }, width = w, height = h) => ({
    x: Math.max(-(width - VIEW) / 2, Math.min((width - VIEW) / 2, p.x)),
    y: Math.max(-(height - VIEW) / 2, Math.min((height - VIEW) / 2, p.y)),
  });

  const pickFile = (file: File | undefined) => {
    setError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("יש לבחור קובץ תמונה");
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setLoaded({ img, url });
      setZoom(1);
      setPos({ x: 0, y: 0 });
    };
    img.onerror = () => setError("לא הצלחנו לפתוח את התמונה. נסו קובץ JPG או PNG");
    img.src = url;
  };

  const onZoom = (z: number) => {
    if (!loaded) return;
    const s = Math.max(VIEW / loaded.img.naturalWidth, VIEW / loaded.img.naturalHeight) * z;
    setZoom(z);
    setPos((p) => clamp(p, loaded.img.naturalWidth * s, loaded.img.naturalHeight * s));
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    drag.current = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    // בגרירה התמונה זזה עם האצבע (גם בעמוד מימין לשמאל)
    setPos(clamp({ x: d.px + (e.clientX - d.x), y: d.py + (e.clientY - d.y) }));
  };
  const onPointerUp = () => {
    drag.current = null;
  };

  const save = () => {
    if (!loaded) return;
    const canvas = document.createElement("canvas");
    canvas.width = OUT;
    canvas.height = OUT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return setError("הדפדפן לא תומך בחיתוך תמונות");
    // האזור הנראה בעיגול, בקואורדינטות של התמונה המקורית
    const left = VIEW / 2 - w / 2 + pos.x;
    const top = VIEW / 2 - h / 2 + pos.y;
    const size = VIEW / scale;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(loaded.img, -left / scale, -top / scale, size, size, 0, 0, OUT, OUT);
    canvas.toBlob(
      (blob) => {
        if (!blob) return setError("החיתוך נכשל");
        const fd = new FormData();
        fd.set("player_id", player.id);
        fd.set("photo", new File([blob], `photo.${blob.type === "image/webp" ? "webp" : "jpg"}`, { type: blob.type }));
        startTransition(async () => {
          const res = await uploadPlayerPhoto(fd);
          if (res.error) setError(res.error);
          else onClose();
        });
      },
      "image/webp",
      0.85,
    );
  };

  const remove = () =>
    startTransition(async () => {
      const res = await removePlayerPhoto(player.id);
      if (res.error) setError(res.error);
      else onClose();
    });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose} role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`תמונה של ${player.name}`}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm space-y-4 rounded-t-2xl bg-card p-5 text-foreground shadow-2xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold">תמונה של {player.name}</h3>
          <button type="button" onClick={onClose} aria-label="סגירה" className="text-xl text-muted hover:text-foreground">
            ✕
          </button>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            pickFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />

        {loaded ? (
          <>
            <div
              className="relative mx-auto touch-none overflow-hidden rounded-2xl bg-brand-dark select-none"
              style={{ width: VIEW, height: VIEW, cursor: "grab" }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              dir="ltr"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={loaded.url}
                alt=""
                draggable={false}
                className="pointer-events-none absolute max-w-none"
                style={{ width: w, height: h, left: VIEW / 2 - w / 2 + pos.x, top: VIEW / 2 - h / 2 + pos.y }}
              />
              {/* מסכה עגולה: מה שבתוך העיגול הוא מה שיישמר */}
              <div
                className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-white"
                style={{ boxShadow: "0 0 0 999px rgb(0 0 0 / 0.55)" }}
              />
            </div>
            <label className="flex items-center gap-3 text-sm">
              <span className="text-muted">זום</span>
              <input
                type="range"
                min={1}
                max={4}
                step={0.01}
                value={zoom}
                onChange={(e) => onZoom(Number(e.target.value))}
                className="flex-1 accent-[var(--accent)]"
                dir="ltr"
              />
            </label>
            <p className="text-center text-xs text-muted">גררו את התמונה כדי למקם את הפנים בתוך העיגול</p>
            <div className="flex gap-2">
              <button type="button" className="btn flex-1" onClick={save} disabled={pending}>
                {pending ? "שומר..." : "שמירת תמונה"}
              </button>
              <button type="button" className="btn-secondary" onClick={() => fileRef.current?.click()} disabled={pending}>
                תמונה אחרת
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-4 text-center">
            <PlayerAvatar player={player} className="mx-auto h-32 w-32 text-4xl" />
            <div className="flex flex-col gap-2">
              <button type="button" className="btn" onClick={() => fileRef.current?.click()} disabled={pending}>
                {player.photo_url ? "העלאת תמונה חדשה" : "העלאת תמונה"}
              </button>
              {player.photo_url && (
                <button type="button" className="btn-danger" onClick={remove} disabled={pending}>
                  {pending ? "מוחק..." : "הסרת התמונה"}
                </button>
              )}
            </div>
            <p className="text-xs text-muted">אחרי הבחירה אפשר להזיז ולהגדיל את התמונה בתוך העיגול.</p>
          </div>
        )}

        {error && <p className="text-center text-sm text-rose-600">{error}</p>}
      </div>
    </div>
  );
}
