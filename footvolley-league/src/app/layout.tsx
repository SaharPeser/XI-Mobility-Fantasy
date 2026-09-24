import type { Metadata, Viewport } from "next";
import { Rubik } from "next/font/google";
import { Nav } from "@/components/Nav";
import "./globals.css";

const rubik = Rubik({ variable: "--font-rubik", subsets: ["hebrew", "latin"] });

export const metadata: Metadata = {
  title: "ליגת הפוצ'יוולי – משחק הניחושים",
  description: "נחשו תוצאות, סדרו את הטבלה, בחרו רביעייה ותתחרו עם החברים",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="he" dir="rtl" className={`${rubik.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <Nav />
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">{children}</main>
        <footer className="py-6 text-center text-xs text-muted">ליגת הפוצ&apos;יוולי · משחק הניחושים</footer>
      </body>
    </html>
  );
}
