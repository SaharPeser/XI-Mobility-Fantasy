import { RichText } from "@/components/RichText";
import { SponsorLogo } from "@/components/Sponsor";
import { getSiteContent } from "@/lib/legal";

export const metadata = { title: "תקנון ומדיניות פרטיות – ליגת הפוצ'יוולי XIMOBILITY" };

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Intl.DateTimeFormat("he-IL", { timeZone: "Asia/Jerusalem", dateStyle: "long" }).format(new Date(iso));
}

/** עמוד ציבורי (פתוח גם בלי התחברות), כדי שאפשר יהיה לקרוא אותו לפני ההרשמה */
export default async function TermsPage() {
  const [terms, privacy] = await Promise.all([getSiteContent("terms"), getSiteContent("privacy")]);

  return (
    <div className="space-y-5">
      <section className="brand-card brand-stripes space-y-2 p-5">
        <div className="flex items-center gap-2 text-xs font-medium text-white/70">
          <span>בחסות</span>
          <SponsorLogo className="h-4" />
        </div>
        <h1 className="text-2xl font-extrabold">
          תקנון <span className="text-brand">ומדיניות פרטיות</span>
        </h1>
        <nav className="flex gap-2 pt-1 text-sm">
          <a href="#terms" className="rounded-full bg-white/10 px-3 py-1 hover:bg-white/20">
            {terms.title}
          </a>
          <a href="#privacy" className="rounded-full bg-white/10 px-3 py-1 hover:bg-white/20">
            {privacy.title}
          </a>
        </nav>
      </section>

      {[terms, privacy].map((doc) => (
        <article key={doc.key} id={doc.key} className="card scroll-mt-28 space-y-3">
          <div>
            <h2 className="text-xl font-extrabold">{doc.title}</h2>
            {doc.updated_at && <p className="text-xs text-muted">עודכן לאחרונה: {formatDate(doc.updated_at)}</p>}
          </div>
          <RichText text={doc.body} />
        </article>
      ))}
    </div>
  );
}
