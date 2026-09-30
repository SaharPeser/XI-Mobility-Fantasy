"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState, useTransition, type PointerEvent, type ReactNode } from "react";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import type { Player, Team } from "@/lib/types";
import { removePlayerPhoto, removeTeamLogo, uploadPlayerPhoto, uploadTeamLogo } from "./actions";

/** גודל אזור החיתוך במסך, וגודל התמונה שנשמרת */
const VIEW = 260;
const OUT = 400;

type Kind = "player" | "team";
type Item = { id: string; name: string; url: string | null | undefined };
type Loaded = { img: HTMLImageElement; url: string };

const KIND = {
  player: {
    upload: uploadPlayerPhoto,
    remove: removePlayerPhoto,
    title: "תמונה של",
    noun: "תמונה",
    hint: "גררו את התמונה כדי למקם את הפנים בתוך העיגול",
    // תמונת שחקן תמיד ממלאת את העיגול
    allowShrink: false,
    background: null as string | null,
  },
  team: {
    upload: uploadTeamLogo,
    remove: removeTeamLogo,
    title: "הסמל של",
    noun: "סמל",
    hint: "גררו והגדילו או הקטינו כך שכל הסמל ייכנס לעיגול",
    // סמל רחב אפשר להקטין עד שייכנס כולו, עם רקע לבן מסביב
    allowShrink: true,
    background: "#ffffff" as string | null,
  },
};

/** עיגול תמונת השחקן בניהול. לחיצה פותחת חלון העלאה וחיתוך */
export function PlayerPhotoEditor({ player }: { player: Pick<Player, "id" | "name" | "photo_url"> }) {
  return (
    <ImageEditor
      kind="player"
      item={{ id: player.id, name: player.name, url: player.photo_url }}
      preview={(size) => <PlayerAvatar player={player} className={size} />}
    />
  );
}

/** עיגול הסמל של הקבוצה בניהול. לחיצה פותחת חלון העלאה וחיתוך */
export function TeamLogoEditor({ team }: { team: Pick<Team, "id" | "name" | "logo_url"> }) {
  return (
    <ImageEditor
      kind="team"
      item={{ id: team.id, name: team.name, url: team.logo_url }}
      preview={(size) =>
        team.logo_url ? (
          <img src={team.logo_url} alt={team.name} className={`shrink-0 rounded-full bg-white object-cover ${size}`} />
        ) : (
          <span className={`grid shrink-0 place-items-center rounded-full bg-accent-soft font-bold text-accent ${size}`}>
            {team.name.slice(0, 1)}
          </span>
        )
      }
    />
  );
}

function ImageEditor({ kind, item, preview }: { kind: Kind; item: Item; preview: (size: string) => ReactNode }) {
  const [open, setOpen] = useState(false);
  const k = KIND[kind];
  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          // הכפתור יושב לפעמים בתוך <summary>: לא לפתוח/לסגור את הקבוצה
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className="relative shrink-0 rounded-full transition active:scale-95"
        title={item.url ? `החלפת ${k.noun}` : `הוספת ${k.noun}`}
        aria-label={`${k.title} ${item.name}`}
      >
        {preview("h-10 w-10 text-sm")}
        <span className="absolute -bottom-1 -left-1 grid h-5 w-5 place-items-center rounded-full bg-accent text-[10px] text-accent-contrast ring-2 ring-card">
          📷
        </span>
      </button>
      {open && <CropDialog kind={kind} item={item} preview={preview} onClose={() => setOpen(false)} />}
    </>
  );
}

function CropDialog({
  kind,
  item,
  preview,
  onClose,
}: {
  kind: Kind;
  item: Item;
  preview: (size: string) => ReactNode;
  onClose: () => void;
}) {
  const k = KIND[kind];
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

  const natW = loaded?.img.naturalWidth ?? 1;
  const natH = loaded?.img.naturalHeight ?? 1;
  // zoom=1: התמונה מכסה בדיוק את העיגול. לסמלים אפשר להקטין עד שהתמונה כולה נכנסת
  const cover = Math.max(VIEW / natW, VIEW / natH);
  // לסמלים: אפשר להקטין עד שאלכסון התמונה כולו נכנס לעיגול (כך גם הפינות של סמל רחב לא נחתכות)
  const minZoom = k.allowShrink ? VIEW / Math.hypot(natW, natH) / cover : 1;
  const scaleFor = (z: number) => cover * z;
  const scale = scaleFor(zoom);
  const w = natW * scale;
  const h = natH * scale;

  // התמונה לא יוצאת מהעיגול (או, כשהיא קטנה ממנו, נשארת בתוכו)
  const clamp = (p: { x: number; y: number }, width = w, height = h) => {
    const lx = Math.abs(width - VIEW) / 2;
    const ly = Math.abs(height - VIEW) / 2;
    return { x: Math.max(-lx, Math.min(lx, p.x)), y: Math.max(-ly, Math.min(ly, p.y)) };
  };

  const pickFile = (file: File | undefined) => {
    setError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("יש לבחור קובץ תמונה");
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setLoaded({ img, url });
      // סמל: מתחילים כשהוא כולו בתוך העיגול. שחקן: ממלא את העיגול
      const c = Math.max(VIEW / img.naturalWidth, VIEW / img.naturalHeight);
      setZoom(k.allowShrink ? Math.min(VIEW / img.naturalWidth, VIEW / img.naturalHeight) / c : 1);
      setPos({ x: 0, y: 0 });
    };
    img.onerror = () => setError("לא הצלחנו לפתוח את התמונה. נסו קובץ JPG או PNG");
    img.src = url;
  };

  const onZoom = (z: number) => {
    setZoom(z);
    setPos((p) => clamp(p, natW * scaleFor(z), natH * scaleFor(z)));
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    drag.current = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
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
    if (k.background) {
      ctx.fillStyle = k.background;
      ctx.fillRect(0, 0, OUT, OUT);
    }
    // ציור התמונה באותו מיקום וקנה מידה שרואים במסך, מוגדל ל-OUT
    const ratio = OUT / VIEW;
    const left = VIEW / 2 - w / 2 + pos.x;
    const top = VIEW / 2 - h / 2 + pos.y;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(loaded.img, left * ratio, top * ratio, w * ratio, h * ratio);
    canvas.toBlob(
      (blob) => {
        if (!blob) return setError("החיתוך נכשל");
        const fd = new FormData();
        fd.set("id", item.id);
        fd.set("image", new File([blob], `image.${blob.type === "image/webp" ? "webp" : "png"}`, { type: blob.type }));
        startTransition(async () => {
          const res = await k.upload(fd);
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
      const res = await k.remove(item.id);
      if (res.error) setError(res.error);
      else onClose();
    });

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${k.title} ${item.name}`}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm space-y-4 rounded-t-2xl bg-card p-5 text-foreground shadow-2xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold">
            {k.title} {item.name}
          </h3>
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
              className="relative mx-auto touch-none overflow-hidden rounded-2xl select-none"
              style={{ width: VIEW, height: VIEW, cursor: "grab", background: k.background ?? "var(--brand-dark)" }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              dir="ltr"
            >
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
                min={minZoom}
                max={4}
                step={0.01}
                value={zoom}
                onChange={(e) => onZoom(Number(e.target.value))}
                className="flex-1 accent-[var(--accent)]"
                dir="ltr"
              />
            </label>
            <p className="text-center text-xs text-muted">{k.hint}</p>
            <div className="flex gap-2">
              <button type="button" className="btn flex-1" onClick={save} disabled={pending}>
                {pending ? "שומר..." : `שמירת ${k.noun}`}
              </button>
              <button type="button" className="btn-secondary" onClick={() => fileRef.current?.click()} disabled={pending}>
                {k.noun} אחר{kind === "player" ? "ת" : ""}
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-4 text-center">
            <div className="flex justify-center">{preview("h-32 w-32 text-4xl")}</div>
            <div className="flex flex-col gap-2">
              <button type="button" className="btn" onClick={() => fileRef.current?.click()} disabled={pending}>
                {item.url ? `העלאת ${k.noun} חדש${kind === "player" ? "ה" : ""}` : `העלאת ${k.noun}`}
              </button>
              {item.url && (
                <button type="button" className="btn-danger" onClick={remove} disabled={pending}>
                  {pending ? "מוחק..." : `הסרת ה${k.noun}`}
                </button>
              )}
            </div>
            <p className="text-xs text-muted">אחרי הבחירה אפשר להזיז, להגדיל ולהקטין בתוך העיגול.</p>
          </div>
        )}

        {error && <p className="text-center text-sm text-rose-600">{error}</p>}
      </div>
    </div>
  );
}
