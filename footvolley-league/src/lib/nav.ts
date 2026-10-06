import {
  BookOpen,
  ChartNoAxesColumn,
  House,
  ListOrdered,
  Trophy,
  UserRound,
  Users,
  Volleyball,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

/** כל עמודי האתר, במקום אחד: התפריט הגדול ושורת הקיצורים נבנים מהרשימה הזו */
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "ראשי", icon: House },
  { href: "/rounds", label: "מחזורים", icon: Volleyball },
  { href: "/predict-table", label: "ניחוש טבלה", icon: ListOrdered },
  { href: "/standings", label: "טבלת הליגה", icon: ChartNoAxesColumn },
  { href: "/leaderboard", label: "דירוג", icon: Trophy },
  { href: "/players", label: "שחקנים", icon: UserRound },
  { href: "/leagues", label: "ליגות חברים", icon: Users },
  { href: "/rules", label: "חוקי הניקוד", icon: BookOpen },
];
