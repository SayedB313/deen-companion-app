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
  type LucideIcon,
} from "lucide-react";

export type NavTab = {
  label: string;
  icon: LucideIcon;
  path: string;
};

/**
 * Primary tabs shown in the mobile bottom navigation bar.
 * Reorder or swap items here to change what appears in the main bar.
 * Maximum recommended: 5 tabs (including the "More" button which is added automatically).
 */
export const primaryTabs: NavTab[] = [
  { label: "Home", icon: LayoutDashboard, path: "/" },
  { label: "Qur'an", icon: BookOpen, path: "/quran" },
  { label: "Dhikr", icon: Hand, path: "/dhikr" },
  { label: "Coach", icon: MessageCircle, path: "/coach" },
];

/**
 * Secondary tabs shown in the "More" sheet.
 * Any page not in primaryTabs should go here.
 */
export const moreTabs: NavTab[] = [
  { label: "Knowledge", icon: GraduationCap, path: "/knowledge" },
  { label: "Fasting", icon: UtensilsCrossed, path: "/fasting" },
  { label: "Time Tracker", icon: Clock, path: "/time" },
  { label: "Character", icon: Heart, path: "/character" },
  { label: "Settings", icon: Settings, path: "/settings" },
];
