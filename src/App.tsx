import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import Auth from "./pages/Auth";
import Landing from "./pages/Landing";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Index";
import Quran from "./pages/Quran";
import Knowledge from "./pages/Knowledge";
import Fasting from "./pages/Fasting";
import TimeTracker from "./pages/TimeTracker";
import Character from "./pages/Character";
import Coach from "./pages/Coach";
import Dhikr from "./pages/Dhikr";
import Settings from "./pages/Settings";
import Reports from "./pages/Reports";
import Duas from "./pages/Duas";
import Qibla from "./pages/Qibla";
import ShareCards from "./pages/ShareCards";
import Ramadan from "./pages/Ramadan";
import Community from "./pages/Community";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,   // 5 min — data stays fresh
      gcTime: 30 * 60 * 1000,     // 30 min — cached in memory
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("onboarding_complete")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        setOnboarded(data?.onboarding_complete ?? false);
      });
  }, [user]);

  if (loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading...</div>;
  if (!user) return <Navigate to="/welcome" replace />;
  if (onboarded === null) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading...</div>;
  if (!onboarded) return <Navigate to="/onboarding" replace />;
  return <AppLayout>{children}</AppLayout>;
}

function AuthRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <Auth />;
}

function LandingRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <Landing />;
}

function OnboardingRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  return <Onboarding />;
}

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/welcome" element={<LandingRoute />} />
              <Route path="/auth" element={<AuthRoute />} />
              <Route path="/onboarding" element={<OnboardingRoute />} />
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/quran" element={<ProtectedRoute><Quran /></ProtectedRoute>} />
              <Route path="/knowledge" element={<ProtectedRoute><Knowledge /></ProtectedRoute>} />
              <Route path="/fasting" element={<ProtectedRoute><Fasting /></ProtectedRoute>} />
              <Route path="/time" element={<ProtectedRoute><TimeTracker /></ProtectedRoute>} />
              <Route path="/character" element={<ProtectedRoute><Character /></ProtectedRoute>} />
              <Route path="/coach" element={<ProtectedRoute><Coach /></ProtectedRoute>} />
              <Route path="/dhikr" element={<ProtectedRoute><Dhikr /></ProtectedRoute>} />
              <Route path="/duas" element={<ProtectedRoute><Duas /></ProtectedRoute>} />
              <Route path="/qibla" element={<ProtectedRoute><Qibla /></ProtectedRoute>} />
              <Route path="/share" element={<ProtectedRoute><ShareCards /></ProtectedRoute>} />
              <Route path="/ramadan" element={<ProtectedRoute><Ramadan /></ProtectedRoute>} />
              <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
