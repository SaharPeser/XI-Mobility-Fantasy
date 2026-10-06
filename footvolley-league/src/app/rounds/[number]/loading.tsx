import { BrandCardSkeleton, Bone, MatchCardSkeleton, SkeletonPage, TitleSkeleton } from "@/components/Skeleton";

/** שלד לעמוד מחזור: כרטיסי משחקים ופאנל השישייה עם המגרש */
export default function Loading() {
  return (
    <SkeletonPage label="טוען את המחזור...">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <TitleSkeleton width="w-28" />
          <Bone className="h-3 w-44" />
        </div>
        <Bone className="h-9 w-10 rounded-xl" />
      </div>
      <Bone className="h-5 w-32" />
      <div className="space-y-3">
        <MatchCardSkeleton />
        <MatchCardSkeleton />
        <MatchCardSkeleton />
      </div>
      <Bone className="h-5 w-32" />
      <BrandCardSkeleton>
        <Bone dark className="h-6 w-2/3" />
        <div className="flex gap-2">
          <Bone dark className="h-7 w-24 rounded-full" />
          <Bone dark className="h-7 w-28 rounded-full" />
          <Bone dark className="h-7 w-20 rounded-full" />
        </div>
        {/* מגרש החול */}
        <div className="sand relative mx-auto aspect-[3/4] w-full max-w-md overflow-hidden rounded-2xl opacity-80" aria-hidden>
          <div className="absolute inset-[6%] rounded-sm border-[3px] border-white/70" />
          <div className="absolute top-1/2 right-[2%] left-[2%] h-1 -translate-y-1/2 rounded bg-white/80" />
        </div>
      </BrandCardSkeleton>
    </SkeletonPage>
  );
}
