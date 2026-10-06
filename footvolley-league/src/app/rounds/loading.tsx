import { BrandCardSkeleton, Bone, SkeletonPage, TitleSkeleton } from "@/components/Skeleton";

/** שלד לחבילת הקלפים של המחזורים */
export default function Loading() {
  return (
    <SkeletonPage label="טוען את המחזורים...">
      <TitleSkeleton width="w-32" />
      <BrandCardSkeleton className="py-3">
        <Bone dark className="h-4 w-3/4" />
      </BrandCardSkeleton>
      <div className="flex justify-between">
        <Bone className="h-4 w-24" />
        <Bone className="h-4 w-28" />
      </div>
      <div className="relative mx-auto mb-20 h-[23rem] w-full max-w-md">
        {/* קלפים מאחור */}
        <div className="absolute inset-0 translate-y-12 scale-90 rounded-3xl bg-brand-dark/40" aria-hidden />
        <div className="absolute inset-0 translate-y-6 scale-95 rounded-3xl bg-brand-dark/70" aria-hidden />
        <BrandCardSkeleton className="absolute inset-0 flex flex-col rounded-3xl p-6">
          <Bone dark className="mt-2 h-10 w-1/2" />
          <Bone dark className="h-4 w-1/3" />
          <Bone dark className="h-4 w-2/3" />
          <div className="mt-auto space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Bone dark className="h-14 rounded-xl" />
              <Bone dark className="h-14 rounded-xl" />
            </div>
            <Bone dark className="h-11 rounded-xl" />
          </div>
        </BrandCardSkeleton>
      </div>
    </SkeletonPage>
  );
}
