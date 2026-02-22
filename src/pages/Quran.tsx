import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Play, Pause, Volume2 } from "lucide-react";

interface Surah {
  id: number;
  name_arabic: string;
  name_english: string;
  name_transliteration: string;
  ayah_count: number;
  juz_start: number;
}

interface AyahProgress {
  surah_id: number;
  ayah_number: number;
  status: string;
}

const statusColors: Record<string, string> = {
  not_started: "bg-muted",
  in_progress: "bg-warning",
  memorised: "bg-primary",
  needs_review: "bg-info",
};

const Quran = () => {
  const { user } = useAuth();
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [progress, setProgress] = useState<AyahProgress[]>([]);
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [surahAyahs, setSurahAyahs] = useState<Record<number, string>>({});

  useEffect(() => {
    const load = async () => {
      const { data: surahData } = await supabase.from("surahs").select("*").order("id");
      if (surahData) setSurahs(surahData);
      if (user) {
        const { data: progData } = await supabase.from("quran_progress").select("surah_id, ayah_number, status").eq("user_id", user.id);
        if (progData) setProgress(progData);
      }
    };
    load();
  }, [user]);

  const getSurahStatus = (surah: Surah) => {
    const ayahs = progress.filter((p) => p.surah_id === surah.id);
    const memorised = ayahs.filter((a) => a.status === "memorised").length;
    if (memorised === surah.ayah_count) return "memorised";
    if (ayahs.length > 0) return "in_progress";
    return "not_started";
  };

  const getSurahPercent = (surah: Surah) => {
    const memorised = progress.filter((p) => p.surah_id === surah.id && p.status === "memorised").length;
    return Math.round((memorised / surah.ayah_count) * 100);
  };

  const totalMemorised = progress.filter((p) => p.status === "memorised").length;

  const openSurah = (surah: Surah) => {
    setSelectedSurah(surah);
    const ayahMap: Record<number, string> = {};
    for (let i = 1; i <= surah.ayah_count; i++) {
      const found = progress.find((p) => p.surah_id === surah.id && p.ayah_number === i);
      ayahMap[i] = found?.status ?? "not_started";
    }
    setSurahAyahs(ayahMap);
  };

  const cycleAyahStatus = async (ayahNum: number) => {
    if (!user || !selectedSurah) return;
    const order = ["not_started", "in_progress", "memorised", "needs_review"];
    const current = surahAyahs[ayahNum] ?? "not_started";
    const next = order[(order.indexOf(current) + 1) % order.length];
    setSurahAyahs((prev) => ({ ...prev, [ayahNum]: next }));

    await supabase.from("quran_progress").upsert(
      { user_id: user.id, surah_id: selectedSurah.id, ayah_number: ayahNum, status: next, updated_at: new Date().toISOString() },
      { onConflict: "user_id,surah_id,ayah_number" }
    );

    // Update local progress
    setProgress((prev) => {
      const filtered = prev.filter((p) => !(p.surah_id === selectedSurah.id && p.ayah_number === ayahNum));
      return [...filtered, { surah_id: selectedSurah.id, ayah_number: ayahNum, status: next }];
    });
  };

  // Audio player state
  const [playingSurah, setPlayingSurah] = useState<number | null>(null);
  const [playingAyah, setPlayingAyah] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playAyah = (surahId: number, ayahNum: number) => {
    const surahStr = String(surahId).padStart(3, "0");
    const ayahStr = String(ayahNum).padStart(3, "0");
    const url = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${surahId > 1 ? 
      // Calculate absolute ayah number
      Array.from({ length: surahId - 1 }, (_, i) => surahs[i]?.ayah_count ?? 0).reduce((a, b) => a + b, 0) + ayahNum 
      : ayahNum}.mp3`;
    
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(url);
    audioRef.current = audio;
    setPlayingSurah(surahId);
    setPlayingAyah(ayahNum);
    audio.play();
    audio.onended = () => {
      setPlayingSurah(null);
      setPlayingAyah(null);
    };
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayingSurah(null);
    setPlayingAyah(null);
  };
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Qur'an Memorisation</h1>
        <p className="text-muted-foreground">{totalMemorised} / 6,236 ayahs memorised</p>
        <Progress value={(totalMemorised / 6236) * 100} className="mt-2 h-3 max-w-md" />
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        {[
          { label: "Not Started", color: "bg-muted" },
          { label: "In Progress", color: "bg-warning" },
          { label: "Memorised", color: "bg-primary" },
          { label: "Needs Review", color: "bg-info" },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-1.5">
            <div className={`h-3 w-3 rounded-sm ${s.color}`} />
            <span>{s.label}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {surahs.map((surah) => {
          const status = getSurahStatus(surah);
          const pct = getSurahPercent(surah);
          return (
            <button
              key={surah.id}
              onClick={() => openSurah(surah)}
              className={`rounded-lg border p-3 text-left transition-colors hover:border-primary/50 ${
                status === "memorised" ? "border-primary bg-primary/5" : status === "in_progress" ? "border-warning/50 bg-warning/5" : ""
              }`}
            >
              <div className="text-xs text-muted-foreground">{surah.id}</div>
              <div className="font-arabic text-lg leading-tight text-right">{surah.name_arabic}</div>
              <div className="text-xs font-medium truncate">{surah.name_transliteration}</div>
              <div className="text-xs text-muted-foreground">{surah.ayah_count} ayahs</div>
              {status !== "not_started" && <Progress value={pct} className="mt-1 h-1" />}
            </button>
          );
        })}
      </div>

      <Dialog open={!!selectedSurah} onOpenChange={() => setSelectedSurah(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-auto">
          {selectedSurah && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>{selectedSurah.name_transliteration}</span>
                  <span className="font-arabic text-xl">{selectedSurah.name_arabic}</span>
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {selectedSurah.ayah_count} ayahs — Click to cycle status
                </p>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="outline" onClick={() => playAyah(selectedSurah.id, 1)}>
                    <Play className="h-3 w-3 mr-1" /> Play Surah
                  </Button>
                  {playingSurah === selectedSurah.id && (
                    <Button size="sm" variant="outline" onClick={stopAudio}>
                      <Pause className="h-3 w-3 mr-1" /> Stop
                    </Button>
                  )}
                </div>
              </DialogHeader>
              <div className="flex flex-wrap gap-1.5 mt-4">
                {Array.from({ length: selectedSurah.ayah_count }, (_, i) => i + 1).map((num) => (
                  <div key={num} className="relative group">
                    <button
                      onClick={() => cycleAyahStatus(num)}
                      className={`h-8 w-8 rounded text-xs font-medium transition-colors ${statusColors[surahAyahs[num] ?? "not_started"]} ${
                        surahAyahs[num] === "memorised" ? "text-primary-foreground" : surahAyahs[num] === "in_progress" ? "text-warning-foreground" : surahAyahs[num] === "needs_review" ? "text-info-foreground" : "text-foreground"
                      }`}
                    >
                      {num}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); playAyah(selectedSurah.id, num); }}
                      className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      {playingSurah === selectedSurah.id && playingAyah === num ? (
                        <Volume2 className="h-2.5 w-2.5" />
                      ) : (
                        <Play className="h-2.5 w-2.5" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Quran;
