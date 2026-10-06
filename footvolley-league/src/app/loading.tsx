import { BrandCardSkeleton, Bone, SkeletonPage } from "@/components/Skeleton";

/** שלד ברירת מחדל לכל עמוד שאין לו שלד משלו (ראשי, חוקים, ליגות, ניחוש טבלה, ניהול...) */
export default function Loading() {
  return (
    <SkeletonPage>
      <BrandCardSkeleton className="rounded-3xl p-6">
        <Bone dark className="h-8 w-4/5" />
        <Bone dark className="h-8 w-3/5" />
        <Bone dark className="h-4 w-32" />
      </BrandCardSkeleton>
      {[0, 1, 2].map((i) => (
        <div key={i} className="card space-y-3" aria-hidden>
          <Bone className="h-5 w-1/3" />
          <Bone className="h-4 w-full" />
          <Bone className="h-4 w-2/3" />
        </div>
      ))}
    </SkeletonPage>
  );
}
