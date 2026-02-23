import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useStreaks } from "@/hooks/useStreaks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Share2, Download, Flame, BookOpen, Star, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

interface ShareStats {
  salahStreak: number;
  memorisedAyahs: number;
  booksRead: number;
  daysFasted: number;
  longestStreak: number;
  displayName: string;
}

const CARD_TEMPLATES = [
  {
    id: "streak",
    label: "Streak",
    icon: Flame,
    bgClass: "bg-gradient-to-br from-warning/20 to-warning/5",
    borderClass: "border-warning/30",
    render: (s: ShareStats) => ({
      title: `${s.salahStreak}-Day Streak 🔥`,
      subtitle: `Longest: ${s.longestStreak} days`,
      stat: String(s.salahStreak),
    }),
  },
  {
    id: "quran",
    label: "Qur'an",
    icon: BookOpen,
    bgClass: "bg-gradient-to-br from-primary/20 to-primary/5",
    borderClass: "border-primary/30",
    render: (s: ShareStats) => ({
      title: `${s.memorisedAyahs} Ayahs Memorised`,
      subtitle: `${((s.memorisedAyahs / 6236) * 100).toFixed(1)}% of the Qur'an`,
      stat: String(s.memorisedAyahs),
    }),
  },
  {
    id: "books",
    label: "Books",
    icon: Trophy,
    bgClass: "bg-gradient-to-br from-info/20 to-info/5",
    borderClass: "border-info/30",
    render: (s: ShareStats) => ({
      title: `${s.booksRead} Books Completed 📚`,
      subtitle: "Knowledge is light",
      stat: String(s.booksRead),
    }),
  },
  {
    id: "fasting",
    label: "Fasting",
    icon: Star,
    bgClass: "bg-gradient-to-br from-success/20 to-success/5",
    borderClass: "border-success/30",
    render: (s: ShareStats) => ({
      title: `${s.daysFasted} Days Fasted`,
      subtitle: "Voluntary & obligatory",
      stat: String(s.daysFasted),
    }),
  },
];

const ShareCards = () => {
  const { user } = useAuth();
  const streakData = useStreaks();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stats, setStats] = useState<ShareStats>({
    salahStreak: 0,
    memorisedAyahs: 0,
    booksRead: 0,
    daysFasted: 0,
    longestStreak: 0,
    displayName: "",
  });
  const [selected, setSelected] = useState("streak");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      const [quranRes, booksRes, fastingRes, profileRes] = await Promise.all([
        supabase.from("quran_progress").select("status").eq("user_id", user.id),
        supabase.from("books").select("status").eq("user_id", user.id),
        supabase.from("fasting_log").select("id").eq("user_id", user.id),
        supabase.from("profiles").select("display_name").eq("id", user.id).single(),
      ]);
      setStats({
        salahStreak: streakData.currentStreak,
        memorisedAyahs: quranRes.data?.filter((a) => a.status === "memorised").length ?? 0,
        booksRead: booksRes.data?.filter((b) => b.status === "completed").length ?? 0,
        daysFasted: fastingRes.data?.length ?? 0,
        longestStreak: streakData.longestStreak,
        displayName: profileRes.data?.display_name || "",
      });
    };
    fetchStats();
  }, [user, streakData]);

  const generateCard = async (action: "download" | "share") => {
    setGenerating(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const W = 1080;
    const H = 1080;
    canvas.width = W;
    canvas.height = H;

    const template = CARD_TEMPLATES.find((t) => t.id === selected)!;
    const data = template.render(stats);

    // Background
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, "#0a1a0f");
    grad.addColorStop(1, "#0f2818");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Decorative border
    ctx.strokeStyle = "rgba(74, 180, 120, 0.3)";
    ctx.lineWidth = 4;
    ctx.strokeRect(40, 40, W - 80, H - 80);

    // Inner pattern
    ctx.strokeStyle = "rgba(74, 180, 120, 0.08)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 20; i++) {
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, 100 + i * 30, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Big stat
    ctx.fillStyle = "#4ab878";
    ctx.font = "bold 180px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(data.stat, W / 2, H / 2 - 20);

    // Title
    ctx.fillStyle = "#e8f5ee";
    ctx.font = "bold 42px system-ui, sans-serif";
    ctx.fillText(data.title, W / 2, H / 2 + 60);

    // Subtitle
    ctx.fillStyle = "rgba(232, 245, 238, 0.6)";
    ctx.font = "28px system-ui, sans-serif";
    ctx.fillText(data.subtitle, W / 2, H / 2 + 110);

    // Name
    if (stats.displayName) {
      ctx.fillStyle = "rgba(232, 245, 238, 0.4)";
      ctx.font = "24px system-ui, sans-serif";
      ctx.fillText(stats.displayName, W / 2, H - 120);
    }

    // Branding
    ctx.fillStyle = "rgba(74, 180, 120, 0.5)";
    ctx.font = "20px system-ui, sans-serif";
    ctx.fillText("Deen Tracker", W / 2, H - 70);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      if (action === "download") {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `deen-tracker-${selected}.png`;
        a.click();
        URL.revokeObjectURL(url);
        toast({ title: "Downloaded!", description: "Share it on your stories 💚" });
      } else if (navigator.share) {
        const file = new File([blob], `deen-tracker-${selected}.png`, { type: "image/png" });
        try {
          await navigator.share({ files: [file], title: data.title });
        } catch {
          // User cancelled
        }
      } else {
        toast({ title: "Sharing not supported", description: "Download and share manually.", variant: "destructive" });
      }
      setGenerating(false);
    }, "image/png");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Share Your Progress</h1>
        <p className="text-muted-foreground">Generate beautiful cards to share your achievements</p>
      </div>

      {/* Template picker */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {CARD_TEMPLATES.map((t) => {
          const data = t.render(stats);
          const isSelected = selected === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setSelected(t.id)}
              className={`rounded-xl p-4 text-center transition-all border-2 ${t.bgClass} ${
                isSelected ? t.borderClass + " ring-2 ring-primary/20" : "border-transparent"
              }`}
            >
              <t.icon className={`h-6 w-6 mx-auto mb-2 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
              <p className="text-2xl font-bold">{data.stat}</p>
              <p className="text-xs text-muted-foreground mt-1">{t.label}</p>
            </button>
          );
        })}
      </div>

      {/* Preview + Actions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mini preview */}
          {(() => {
            const t = CARD_TEMPLATES.find((t) => t.id === selected)!;
            const data = t.render(stats);
            return (
              <div className={`rounded-xl p-8 text-center ${t.bgClass} border ${t.borderClass}`}>
                <p className="text-5xl font-bold mb-2">{data.stat}</p>
                <p className="font-semibold">{data.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{data.subtitle}</p>
                {stats.displayName && (
                  <p className="text-xs text-muted-foreground mt-4">— {stats.displayName}</p>
                )}
                <p className="text-xs text-muted-foreground/50 mt-2">Deen Tracker</p>
              </div>
            );
          })()}

          <div className="flex gap-3">
            <Button onClick={() => generateCard("download")} disabled={generating} className="flex-1">
              <Download className="h-4 w-4 mr-1.5" />
              {generating ? "Generating..." : "Download"}
            </Button>
            {navigator.share && (
              <Button onClick={() => generateCard("share")} disabled={generating} variant="outline" className="flex-1">
                <Share2 className="h-4 w-4 mr-1.5" /> Share
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Hidden canvas */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default ShareCards;
