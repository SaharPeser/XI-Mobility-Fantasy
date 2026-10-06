import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  experimental: {
    // עמוד שביקרו בו ב-30 השניות האחרונות נפתח מיד מהזיכרון של הדפדפן.
    // פעולות שמירה (revalidatePath) מנקות את הזיכרון, כך שנתונים חדשים לא נשארים מאחור.
    staleTimes: {
      dynamic: 30,
    },
  },
};

export default nextConfig;
