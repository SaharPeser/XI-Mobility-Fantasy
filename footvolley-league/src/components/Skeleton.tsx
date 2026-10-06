/** אבני בניין לשלדי טעינה (loading.tsx). כל השלדים בנויים בצורה של העמוד האמיתי */

/** בלוק אפור עם הבהוב. dark = על כרטיס כהה */
export function Bone({ className = "", dark = false }: { className?: string; dark?: boolean }) {
  return <div className={`${dark ? "skeleton-dark" : "skeleton"} ${className}`} aria-hidden />;
}

/** עטיפה לכל שלד: מסמנת לקוראי מסך שהעמוד נטען */
export function SkeletonPage({ children, label = "טוען..." }: { children: React.ReactNode; label?: string }) {
  return (
    <div className="space-y-5" role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

/** כרטיס כהה בסגנון הבאנר, עם שורת "בחסות" */
export function BrandCardSkeleton({ className = "", children }: { className?: string; children?: React.ReactNode }) {
  return (
    <div className={`brand-card brand-stripes space-y-3 ${className}`} aria-hidden>
      <div className="flex items-center justify-between">
        <Bone dark className="h-3 w-24" />
        <Bone dark className="h-3 w-16" />
      </div>
      {children}
    </div>
  );
}

/** כותרת עמוד */
export function TitleSkeleton({ width = "w-40" }: { width?: string }) {
  return <Bone className={`h-8 ${width}`} />;
}

/** שורות של טבלה בתוך כרטיס לבן */
export function TableSkeleton({ rows = 8, avatar = false }: { rows?: number; avatar?: boolean }) {
  return (
    <div className="card space-y-3 p-0 py-3" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4">
          <Bone className="h-4 w-5" />
          {avatar && <Bone className="h-9 w-9 rounded-full" />}
          <Bone className={`h-4 flex-1 ${i % 3 === 0 ? "max-w-40" : i % 3 === 1 ? "max-w-52" : "max-w-32"}`} />
          <Bone className="h-5 w-10" />
        </div>
      ))}
    </div>
  );
}

/** כרטיס משחק כהה: שתי שורות קבוצה + VS */
export function MatchCardSkeleton() {
  return (
    <BrandCardSkeleton>
      {[0, 1].map((i) => (
        <div key={i}>
          {i === 1 && <Bone dark className="mx-auto my-2 h-2 w-8" />}
          <div className="flex items-center gap-3">
            <Bone dark className="h-6 w-6 rounded-full" />
            <Bone dark className="h-5 flex-1 max-w-36" />
            <Bone dark className="h-11 w-14 rounded-lg" />
          </div>
        </div>
      ))}
    </BrandCardSkeleton>
  );
}
