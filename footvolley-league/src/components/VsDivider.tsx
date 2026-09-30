/** קו מפריד עם VS בין שתי הקבוצות */
export function VsDivider() {
  return (
    <div
      className="my-1.5 flex items-center gap-2 text-[10px] font-black tracking-widest text-brand"
      aria-hidden
    >
      <span className="h-px flex-1 bg-white/15" />
      VS
      <span className="h-px flex-1 bg-white/15" />
    </div>
  );
}
