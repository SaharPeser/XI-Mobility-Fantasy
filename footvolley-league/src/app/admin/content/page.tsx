import Link from "next/link";
import { ConfirmButton } from "@/components/ConfirmButton";
import { getSiteContent, type ContentKey } from "@/lib/legal";
import { resetSiteContent, saveSiteContent } from "../actions";

const R = <input type="hidden" name="return_to" value="/admin/content" />;
const PLACEHOLDER = /\[[^\]]+\]/;

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Intl.DateTimeFormat("he-IL", {
    timeZone: "Asia/Jerusalem",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export default async function AdminContentPage() {
  const docs = await Promise.all((["terms", "privacy"] as ContentKey[]).map((k) => getSiteContent(k)));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title mb-1">תקנון ומדיניות פרטיות</h1>
        <p className="text-sm text-muted">
          הנוסח מוצג לכולם בעמוד{" "}
          <Link href="/terms" target="_blank" className="text-accent underline">
            תקנון ומדיניות פרטיות
          </Link>
          , ובהרשמה המשתמשים מאשרים אותו.
        </p>
      </div>

      <div className="card space-y-1 border-amber-300 bg-amber-50 text-sm text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
        <p className="font-bold">איך כותבים</p>
        <p>
          שורה שמתחילה ב-<code dir="ltr">## </code> היא כותרת, שורה שמתחילה ב-<code dir="ltr">- </code> היא פריט ברשימה, ושורה
          ריקה מתחילה פסקה חדשה.
        </p>
        <p>הנוסח הראשוני הוא טיוטה. מומלץ שאדם עם ידע משפטי יעבור עליו לפני חלוקת הפרסים.</p>
      </div>

      {docs.map((doc) => (
        <form key={doc.key} action={saveSiteContent} className="card space-y-3">
          {R}
          <input type="hidden" name="key" value={doc.key} />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold">{doc.title}</h2>
            <span className="text-xs text-muted">
              {doc.custom ? `נשמר לאחרונה: ${formatDate(doc.updated_at)}` : "נוסח ראשוני (עוד לא נערך)"}
            </span>
          </div>
          {PLACEHOLDER.test(doc.body) && (
            <p className="rounded-xl bg-amber-100 px-3 py-2 text-sm text-amber-900">
              יש בנוסח מקומות שצריך למלא, למשל <b>[כתובת מייל ליצירת קשר]</b>. החליפו אותם בפרטים האמיתיים ושמרו.
            </p>
          )}
          <label className="block">
            <span className="label">כותרת</span>
            <input className="input" name="title" defaultValue={doc.title} required maxLength={80} />
          </label>
          <label className="block">
            <span className="label">תוכן</span>
            <textarea className="input min-h-80 font-mono text-sm leading-relaxed" name="body" defaultValue={doc.body} required />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <button className="btn">שמירה</button>
            <Link href={`/terms#${doc.key}`} target="_blank" className="btn-secondary">
              תצוגה באתר
            </Link>
            {doc.custom && (
              <ConfirmButton
                formAction={resetSiteContent}
                className="btn-danger mr-auto"
                message="להחזיר את המסמך לנוסח הראשוני? הנוסח הנוכחי יימחק."
              >
                החזרה לנוסח הראשוני
              </ConfirmButton>
            )}
          </div>
        </form>
      ))}
    </div>
  );
}
