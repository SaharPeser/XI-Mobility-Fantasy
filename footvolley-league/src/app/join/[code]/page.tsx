import { LeagueForms } from "@/app/leagues/LeagueForms";
import { requireUser } from "@/lib/data";

export default async function JoinPage({ params }: PageProps<"/join/[code]">) {
  const { code } = await params;
  await requireUser(`/join/${code}`);
  return (
    <div>
      <h1 className="page-title">הוזמנתם לליגת חברים 🎉</h1>
      <p className="mb-4 text-muted">לחצו על &quot;הצטרפות&quot; כדי להיכנס לליגה.</p>
      <LeagueForms initialCode={code.toUpperCase()} />
    </div>
  );
}
