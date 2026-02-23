import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Headphones, BookOpen } from "lucide-react";
import RevisionScheduler from "@/components/RevisionScheduler";
import QuranListeningMode from "@/components/QuranListeningMode";
import QuranMemorizationMode from "@/components/QuranMemorizationMode";
import { useAyahRevision } from "@/hooks/useAyahRevision";

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


const Quran = () => {
  const { user } = useAuth();
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [progress, setProgress] = useState<AyahProgress[]>([]);
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [surahAyahs, setSurahAyahs] = useState<Record<number, string>>({});
  const { getAyahStatus } = useAyahRevision(selectedSurah?.id ?? null);

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

  const surahsWithProgress = surahs.map((surah) => {
    const surahProgress = progress.filter((p) => p.surah_id === surah.id);
    return {
      id: surah.id,
      name_arabic: surah.name_arabic,
      name_transliteration: surah.name_transliteration,
      ayah_count: surah.ayah_count,
      memorised_count: surahProgress.filter((p) => p.status === "memorised").length,
      needs_review_count: surahProgress.filter((p) => p.status === "needs_review").length,
      in_progress_count: surahProgress.filter((p) => p.status === "in_progress").length,
    };
  });

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

    setProgress((prev) => {
      const filtered = prev.filter((p) => !(p.surah_id === selectedSurah.id && p.ayah_number === ayahNum));
      return [...filtered, { surah_id: selectedSurah.id, ayah_number: ayahNum, status: next }];
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Qur'an Memorisation</h1>
        <p className="text-muted-foreground">{totalMemorised} / 6,236 ayahs memorised</p>
        <Progress value={(totalMemorised / 6236) * 100} className="mt-2 h-3 max-w-md" />
      </div>

      <RevisionScheduler surahsWithProgress={surahsWithProgress} />

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
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-auto">
          {selectedSurah && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>{selectedSurah.name_transliteration}</span>
                  <span className="font-arabic text-xl">{selectedSurah.name_arabic}</span>
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {selectedSurah.ayah_count} ayahs
                </p>
              </DialogHeader>

              <Tabs defaultValue="listening" className="mt-2">
                <TabsList className="w-full">
                  <TabsTrigger value="listening" className="flex-1 gap-1.5">
                    <Headphones className="h-3.5 w-3.5" /> Listening
                  </TabsTrigger>
                  <TabsTrigger value="memorization" className="flex-1 gap-1.5">
                    <BookOpen className="h-3.5 w-3.5" /> Memorization
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="listening">
                  <QuranListeningMode
                    surahId={selectedSurah.id}
                    ayahCount={selectedSurah.ayah_count}
                    surahs={surahs}
                    surahAyahs={surahAyahs}
                    onCycleStatus={cycleAyahStatus}
                    revisionStatus={getAyahStatus}
                  />
                </TabsContent>

                <TabsContent value="memorization">
                  <QuranMemorizationMode
                    surahId={selectedSurah.id}
                    ayahCount={selectedSurah.ayah_count}
                    surahs={surahs}
                    surahAyahs={surahAyahs}
                    onCycleStatus={cycleAyahStatus}
                  />
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Quran;
