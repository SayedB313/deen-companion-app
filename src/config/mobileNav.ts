import {
  LayoutDashboard,
  BookOpen,
  Fingerprint,
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
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavTab = {
  label: string;
  i18nKey: string;
  icon: LucideIcon;
  path: string;
};

/**
 * Primary tabs shown in the mobile bottom navigation bar.
 */
export const primaryTabs: NavTab[] = [
  { label: "Home", i18nKey: "nav.home", icon: LayoutDashboard, path: "/" },
  { label: "Qur'an", i18nKey: "nav.quran", icon: BookOpen, path: "/quran" },
  { label: "Dhikr", i18nKey: "nav.dhikr", icon: Fingerprint, path: "/dhikr" },
  { label: "Coach", i18nKey: "nav.coach", icon: MessageCircle, path: "/coach" },
];

/**
 * Secondary tabs shown in the "More" sheet.
 */
export const moreTabs: NavTab[] = [
  { label: "Duas & Adhkar", i18nKey: "nav.duas", icon: BookHeart, path: "/duas" },
  { label: "Knowledge", i18nKey: "nav.knowledge", icon: GraduationCap, path: "/knowledge" },
  { label: "Fasting & Ramadan", i18nKey: "nav.fasting", icon: UtensilsCrossed, path: "/fasting" },
  { label: "Time Tracker", i18nKey: "nav.time", icon: Clock, path: "/time" },
  { label: "My Growth", i18nKey: "nav.character", icon: Heart, path: "/character" },
  { label: "Qibla Compass", i18nKey: "nav.qibla", icon: Compass, path: "/qibla" },
  { label: "Share Progress", i18nKey: "nav.share", icon: Share2, path: "/share" },
  { label: "Community", i18nKey: "nav.community", icon: Users, path: "/community" },
  { label: "Reports", i18nKey: "nav.reports", icon: BarChart3, path: "/reports" },
  { label: "Settings", i18nKey: "nav.settings", icon: Settings, path: "/settings" },
];
