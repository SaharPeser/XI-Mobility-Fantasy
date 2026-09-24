import { LoginForm } from "./LoginForm";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, error } = await searchParams;
  return (
    <div className="py-6">
      <h1 className="page-title text-center">ברוכים הבאים לליגת הניחושים 🏐</h1>
      {error && <p className="mb-4 text-center text-sm text-rose-600">הקישור לא תקין או שפג תוקפו</p>}
      <LoginForm next={typeof next === "string" ? next : "/"} />
    </div>
  );
}
