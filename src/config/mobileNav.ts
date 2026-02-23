import {
  LayoutDashboard,
  BookOpen,
  Hand,
  MessageCircle,
  GraduationCap,
  UtensilsCrossed,
  Clock,
  Heart,
  Settings,
  BarChart3,
  BookHeart,
  Compass,
  Share2,
  Moon,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavTab = {
  label: string;
  icon: LucideIcon;
  path: string;
};

/**
 * Primary tabs shown in the mobile bottom navigation bar.
 */
export const primaryTabs: NavTab[] = [
  { label: "Home", icon: LayoutDashboard, path: "/" },
  { label: "Qur'an", icon: BookOpen, path: "/quran" },
  { label: "Dhikr", icon: Hand, path: "/dhikr" },
  { label: "Coach", icon: MessageCircle, path: "/coach" },
];

/**
 * Secondary tabs shown in the "More" sheet.
 */
export const moreTabs: NavTab[] = [
  { label: "Ramadan", icon: Moon, path: "/ramadan" },
  { label: "Duas & Adhkar", icon: BookHeart, path: "/duas" },
  { label: "Knowledge", icon: GraduationCap, path: "/knowledge" },
  { label: "Fasting", icon: UtensilsCrossed, path: "/fasting" },
  { label: "Time Tracker", icon: Clock, path: "/time" },
  { label: "My Growth", icon: Heart, path: "/character" },
  { label: "Qibla Compass", icon: Compass, path: "/qibla" },
  { label: "Share Progress", icon: Share2, path: "/share" },
  { label: "Community", icon: Users, path: "/community" },
  { label: "Reports", icon: BarChart3, path: "/reports" },
  { label: "Settings", icon: Settings, path: "/settings" },
];
