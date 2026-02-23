import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { primaryTabs, moreTabs } from "@/config/mobileNav";

export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const isMoreActive = moreTabs.some((t) => isActive(t.path));

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
        <div className="flex items-center justify-around h-16 px-1 safe-area-pb">
          {primaryTabs.map((tab) => {
            const active = isActive(tab.path);
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 flex-1 h-full min-w-[44px] transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <tab.icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{t(tab.i18nKey)}</span>
              </button>
            );
          })}
          <button
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 flex-1 h-full min-w-[44px] transition-colors",
              isMoreActive ? "text-primary" : "text-muted-foreground"
            )}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="text-[10px] font-medium">{t('common.more')}</span>
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-8">
          <SheetHeader>
            <SheetTitle>{t('common.more')}</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-3 gap-4 pt-4">
            {moreTabs.map((tab) => {
              const active = isActive(tab.path);
              return (
                <button
                  key={tab.path}
                  onClick={() => {
                    navigate(tab.path);
                    setMoreOpen(false);
                  }}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl p-4 transition-colors min-h-[80px]",
                    active
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground hover:bg-accent"
                  )}
                >
                  <tab.icon className="h-6 w-6" />
                  <span className="text-xs font-medium">{t(tab.i18nKey)}</span>
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
