import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  UtensilsCrossed,
  Clock,
  Heart,
  MessageCircle,
  LogOut,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Qur'an", url: "/quran", icon: BookOpen },
  { title: "Knowledge", url: "/knowledge", icon: GraduationCap },
  { title: "Fasting", url: "/fasting", icon: UtensilsCrossed },
  { title: "Time Tracker", url: "/time", icon: Clock },
  { title: "Self-Accountability", url: "/character", icon: Heart },
  { title: "AI Coach", url: "/coach", icon: MessageCircle },
];

export function AppSidebar() {
  const { signOut, user } = useAuth();

  return (
    <Sidebar className="border-r border-sidebar-border">
      <div className="flex items-center gap-2 px-4 py-5 border-b border-sidebar-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <BookOpen className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-lg font-semibold text-sidebar-foreground">Deen Tracker</span>
      </div>

      <SidebarContent className="px-2 py-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <p className="text-xs text-muted-foreground truncate mb-2">{user?.email}</p>
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={signOut}>
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
