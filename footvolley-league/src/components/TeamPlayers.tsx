/** שמות השחקנים בקטן מתחת לשם הקבוצה (מיושר לטקסט, אחרי הלוגו) */
export function TeamPlayers({ names }: { names?: string[] }) {
  if (!names?.length) return null;
  return <span className="block ps-8 text-[11px] leading-tight text-white/55">{names.join(" · ")}</span>;
}
