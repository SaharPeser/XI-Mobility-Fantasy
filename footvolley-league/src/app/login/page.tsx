import { SponsorLogo } from "@/components/Sponsor";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, error } = await searchParams;
  return (
    <div className="py-6">
      <div className="brand-stripes mx-auto mb-5 max-w-sm rounded-2xl bg-brand-dark p-5 text-center text-white shadow">
        <SponsorLogo className="mx-auto h-7" />
        <h1 className="mt-3 text-xl font-extrabold">
          ברוכים הבאים ל<span className="text-brand">משחק הניחושים</span> של ליגת הפוצ&apos;יוולי
        </h1>
        <p className="mt-1 text-sm text-white/70">פרסים לשלושת המקומות הראשונים בחסות XIMOBILITY</p>
      </div>
      {error && <p className="mb-4 text-center text-sm text-rose-600">הקישור לא תקין או שפג תוקפו</p>}
      <LoginForm next={typeof next === "string" ? next : "/"} />
    </div>
  );
}
