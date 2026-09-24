import type { Metadata, Viewport } from "next";
import { Heebo } from "next/font/google";
import { Nav } from "@/components/Nav";
import { SPONSOR_URL, SponsorLogo } from "@/components/Sponsor";
import "./globals.css";

const heebo = Heebo({ variable: "--font-heebo", subsets: ["hebrew", "latin"] });

export const metadata: Metadata = {
  title: "ליגת הפוצ'יוולי XIMOBILITY – משחק הניחושים",
  description: "נחשו תוצאות, סדרו את הטבלה, בחרו רביעייה ותזכו בפרסים מבית XIMOBILITY",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1c1a1b",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="he" dir="rtl" className={`${heebo.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <Nav />
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">{children}</main>
        <footer className="bg-brand-dark py-6 text-center text-xs text-white/60">
          <a href={SPONSOR_URL} target="_blank" rel="noopener" className="inline-flex flex-col items-center gap-2">
            <span>משחק הניחושים של ליגת הפוצ&apos;יוולי · בחסות</span>
            <SponsorLogo className="h-5" />
          </a>
        </footer>
      </body>
    </html>
  );
}
