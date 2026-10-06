import { Bone, SkeletonPage, TableSkeleton, TitleSkeleton } from "@/components/Skeleton";

/** שלד לעמוד השחקנים: כפתורי מחזורים ושורות עם תמונה */
export default function Loading() {
  return (
    <SkeletonPage label="טוען את השחקנים...">
      <TitleSkeleton width="w-52" />
      <Bone className="h-4 w-3/4" />
      <div className="flex gap-2">
        <Bone className="h-7 w-20 rounded-full" />
        <Bone className="h-7 w-20 rounded-full" />
        <Bone className="h-7 w-20 rounded-full" />
      </div>
      <TableSkeleton rows={10} avatar />
    </SkeletonPage>
  );
}
