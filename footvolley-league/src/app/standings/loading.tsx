import { Bone, SkeletonPage, TableSkeleton, TitleSkeleton } from "@/components/Skeleton";

/** שלד לטבלת הליגה: 12 שורות */
export default function Loading() {
  return (
    <SkeletonPage label="טוען את טבלת הליגה...">
      <TitleSkeleton width="w-56" />
      <TableSkeleton rows={12} />
      <div className="flex flex-wrap gap-3">
        <Bone className="h-3 w-24" />
        <Bone className="h-3 w-32" />
        <Bone className="h-3 w-28" />
      </div>
    </SkeletonPage>
  );
}
