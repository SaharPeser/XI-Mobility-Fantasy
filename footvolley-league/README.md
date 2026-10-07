# 🏐 ליגת הפוצ'יוולי XIMOBILITY – משחק הניחושים

משחק ניחושים לליגת הפוצ'יוולי (בסגנון "5 חברה" / ליגת החלומות), בחסות **XIMOBILITY**.
Next.js 16 + Supabase, פריסה ב-Vercel.

- **האתר החי:** https://ximobilityfantasy.vercel.app
- **הקוד:** https://github.com/SaharPeser/XI-Mobility-Fantasy (התיקייה `footvolley-league`)
- **היסטוריית שינויים:** [docs/CHANGELOG.md](docs/CHANGELOG.md)

## מה יש במשחק

| חלק | איך זה עובד |
|---|---|
| **ניחוש תוצאות** | בכל מחזור מנחשים תוצאה מדויקת (מערכה אחת עד 21, הפרש 2, מקסימום 25). מנצחת = 2 נק', מדויקת = 5 נק'. |
| **ניחוש טבלה** | לפני תחילת העונה מסדרים את 12 הקבוצות. בסוף העונה הסדירה: 3 נק' לכל קבוצה במיקום הנכון. |
| **שישיית המחזור** | על מגרש חול אינטראקטיבי בוחרים 6 שחקנים (עד 3 ברזילאים) וקפטן. כל שחקן מקבל את הניקוד האישי שלו ×2, והקפטן ×4. |
| **ניקוד אישי לשחקנים** | המנהל מזין אחרי כל משחק: חסימות, הגנות, 8+/14+ נקודות, מצטיין, כרטיסים, טעויות. ניצחון, ניצחון מוחץ והארכה מחושבים לבד. |
| **ליגות חברים** | כל משתמש יכול ליצור ליגה פרטית ולשתף קוד/קישור הזמנה. |
| **דירוג כללי** | כל המשתתפים. פרסים מבית XIMOBILITY לשלושת הראשונים. |
| **עמוד ניהול** (`/admin`) | עונה והגדרות ניקוד, קבוצות ושחקנים (כולל לאום, תמונה וסמל), מחזורים ומשחקים, תוצאות, נתוני שחקנים, מצטיין מחזור, דירוג סופי. |

עמודים נוספים: מחזורים כחבילת קלפים עם החלקה, טבלת הליגה, דירוג, שחקנים, חוקי הניקוד, תקנון ומדיניות פרטיות (ניתנים לעריכה בניהול).

**האתר פתוח רק למשתמשים רשומים ומחוברים.** בהרשמה מאשרים את התקנון ומדיניות הפרטיות.
המודל המלא של הניקוד, לשיתוף עם המשתתפים: [docs/SCORING-MODEL.md](docs/SCORING-MODEL.md).

כל ערכי הניקוד ניתנים לשינוי בעמוד הניהול, והדירוג מחושב מחדש אוטומטית.
הניחושים ננעלים במועד שהמנהל קובע לכל מחזור. אחרי הנעילה אפשר לראות גם את הניחושים של אחרים.

אזורי הטבלה: 1–2 פיינל פור · 3–6 פלייאוף (3 מול 6, 4 מול 5) · 9–10 הצלבות מול ליגה שנייה · 11–12 ירידה.

---

## הקמה – צעד אחר צעד (לפרויקט חדש)
> הפרויקט הנוכחי כבר מוקם. הפרטים שלו (כתובות, משתני סביבה, תקלות שכבר נפתרו) ב-[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

### 1. Supabase
1. פותחים פרויקט חדש ב-[supabase.com](https://supabase.com).
2. **SQL Editor** → מריצים **לפי הסדר** את כל הקבצים ב-`supabase/migrations/` (לפי שם הקובץ).
3. **Authentication → URL Configuration**: Site URL = כתובת האתר, ו-Redirect URLs = `<כתובת האתר>/**` וגם `http://localhost:3000/**`.
4. (לא חובה) **Authentication → Providers → Email**: מכבים את "Confirm email" אם רוצים הרשמה בלי אימות מייל.

### 2. הרצה מקומית
```bash
cp .env.example .env.local   # וממלאים את הערכים מ-Supabase → Project Settings → API
npm install
npm run dev
```

### 3. הגדרת המנהל
נרשמים באתר, ואז ב-SQL Editor:
```sql
update public.profiles set is_admin = true
where id = (select id from auth.users where email = 'YOUR@EMAIL.com');
```
מתנתקים ומתחברים מחדש. בתפריט (כפתור התפריט למעלה) יופיע **⚙️ ניהול**.

### 4. פריסה ב-Vercel
1. מעלים את הפרויקט ל-GitHub.
2. ב-Vercel: **Add New → Project** → בוחרים את ה-repo, ו-**Root Directory** = `footvolley-league`.
3. **Environment Variables** (מסוג **Config**, לא Secret): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL`.
4. Deploy.

---

## מסמכים
| מסמך | תוכן |
|---|---|
| [docs/ADMIN-GUIDE.md](docs/ADMIN-GUIDE.md) | מדריך למנהל הליגה (עברית) |
| [docs/SCORING-MODEL.md](docs/SCORING-MODEL.md) | מודל הניקוד המלא למשתתפים (עברית) |
| [docs/CHANGELOG.md](docs/CHANGELOG.md) | מה נבנה ומתי |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | מבנה הקוד וזרימת הנתונים |
| [docs/DATABASE.md](docs/DATABASE.md) | טבלאות, הרשאות, פונקציות ואחסון |
| [docs/SCORING.md](docs/SCORING.md) | חוקי הניקוד והמקומות בקוד שמחשבים אותם |
| [docs/DESIGN.md](docs/DESIGN.md) | עיצוב ומיתוג XIMOBILITY ורכיבי ממשק |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Supabase, Vercel, משתני סביבה ותקלות |
| [docs/ROADMAP.md](docs/ROADMAP.md) | תוספות מתוכננות |

ל-Claude יש skills לפרויקט בתיקייה `.claude/skills/` בשורש ה-repo, וקובץ `CLAUDE.md` בשורש עם כללי העבודה.

## מבנה הקוד (בקצרה)
```
supabase/migrations/   סכמת המסד, הרשאות (RLS), חישוב הדירוג, אחסון תמונות
supabase/tests/        בדיקות למסד (npm run test:db)
src/lib/scoring.ts     חוקי תוצאה, חוקי ניקוד אישי, חישוב טבלה
src/app/rounds/        חבילת הקלפים, ניחושי מחזור ושישייה על מגרש חול
src/app/admin/         עמוד הניהול (כולל העלאת תמונות וחיתוך)
src/components/        תפריט, חסות, תמונות שחקנים, דגלים
docs/                  כל המסמכים
```
הפירוט המלא ב-[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

**אבטחה:** כל ההרשאות נאכפות במסד הנתונים (Row Level Security): משתמש לא יכול לשנות ניחוש אחרי הנעילה, לראות ניחושים של אחרים לפני הנעילה, או לשנות נתונים של הליגה אם הוא לא מנהל. רק מנהל יכול להעלות תמונות.
