import { BrandCardSkeleton, Bone, SkeletonPage, TableSkeleton, TitleSkeleton } from "@/components/Skeleton";

/** שלד לדירוג: כרטיס הפרסים וטבלת המשתתפים */
export default function Loading() {
  return (
    <SkeletonPage label="טוען את הדירוג...">
      <TitleSkeleton width="w-56" />
      <BrandCardSkeleton className="p-5">
        <Bone dark className="h-7 w-40" />
        <div className="grid gap-2 sm:grid-cols-3">
          <Bone dark className="h-16 rounded-xl" />
          <Bone dark className="h-16 rounded-xl" />
          <Bone dark className="h-16 rounded-xl" />
        </div>
      </BrandCardSkeleton>
      <TableSkeleton rows={8} />
    </SkeletonPage>
  );
}
