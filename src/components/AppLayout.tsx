import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { useIsMobile } from "@/hooks/use-mobile";

export function AppLayout({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {!isMobile && <AppSidebar />}
        <div className="flex-1 flex flex-col">
          <header className="h-12 md:h-14 flex items-center justify-between border-b px-3 md:px-4 bg-background">
            {!isMobile && <SidebarTrigger />}
            {isMobile && <span className="text-sm font-semibold text-foreground">Deen Tracker</span>}
            <ThemeToggle />
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-x-hidden overflow-y-auto pb-20 md:pb-6">{children}</main>
        </div>
        {isMobile && <MobileBottomNav />}
      </div>
    </SidebarProvider>
  );
}
