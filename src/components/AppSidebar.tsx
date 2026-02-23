import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  UtensilsCrossed,
  Clock,
  Target,
  MessageCircle,
  LogOut,
  Fingerprint,
  Settings,
  BarChart3,
  BookHeart,
  Compass,
  Share2,
  Users,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const mainNav = [
  { titleKey: "nav.home", url: "/", icon: LayoutDashboard },
  { titleKey: "nav.quran", url: "/quran", icon: BookOpen },
  { titleKey: "nav.dhikr", url: "/dhikr", icon: Fingerprint },
  { titleKey: "nav.duas", url: "/duas", icon: BookHeart },
  { titleKey: "nav.knowledge", url: "/knowledge", icon: GraduationCap },
  { titleKey: "nav.fasting", url: "/fasting", icon: UtensilsCrossed },
  { titleKey: "nav.time", url: "/time", icon: Clock },
  { titleKey: "nav.character", url: "/character", icon: Target },
];

const toolsNav = [
  { titleKey: "nav.community", url: "/community", icon: Users },
  { titleKey: "nav.qibla", url: "/qibla", icon: Compass },
  { titleKey: "nav.share", url: "/share", icon: Share2 },
  { titleKey: "nav.reports", url: "/reports", icon: BarChart3 },
  { titleKey: "nav.coach", url: "/coach", icon: MessageCircle },
  { titleKey: "nav.settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { signOut, user } = useAuth();
  const { t } = useTranslation();

  const renderItems = (items: typeof mainNav) =>
    items.map((item) => (
      <SidebarMenuItem key={item.titleKey}>
        <SidebarMenuButton asChild>
          <NavLink
            to={item.url}
            end={item.url === "/"}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
            activeClassName="bg-sidebar-accent text-primary font-medium"
          >
            <item.icon className="h-4 w-4" />
            <span>{t(item.titleKey)}</span>
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ));

  return (
    <Sidebar className="border-r border-sidebar-border">
      <div className="flex items-center gap-2 px-4 py-5 border-b border-sidebar-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <BookOpen className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-lg font-semibold text-sidebar-foreground">{t('app.name')}</span>
      </div>

      <SidebarContent className="px-2 py-3">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground px-3 mb-1">
            {t('nav.track')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(mainNav)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground px-3 mb-1 mt-2">
            {t('nav.tools')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(toolsNav)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <p className="text-xs text-muted-foreground truncate mb-2">{user?.email}</p>
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={signOut}>
          <LogOut className="h-4 w-4" />
          {t('nav.signOut')}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
