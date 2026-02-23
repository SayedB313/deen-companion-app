import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bookmark, BookmarkCheck, Search, Globe, ChevronUp } from "lucide-react";

interface Surah {
  id: number;
  name_arabic: string;
  name_english: string;
  name_transliteration: string;
  ayah_count: number;
  juz_start: number;
}

interface AyahData {
  numberInSurah: number;
  arabic: string;
  translation: string;
}

const translationCache = new Map<number, AyahData[]>();

interface Props {
  surahId: number;
  surahName: string;
  ayahCount: number;
  surahs: Surah[];
  onChangeSurah: (surah: Surah) => void;
}

export default function QuranReadingMode({ surahId, surahName, ayahCount, surahs, onChangeSurah }: Props) {
  const [ayahs, setAyahs] = useState<AyahData[]>([]);
  const [loading, setLoading] = useState(false);
  const [showTranslation, setShowTranslation] = useState(true);
  const [search, setSearch] = useState("");
  const [bookmarkedAyah, setBookmarkedAyah] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const ayahRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Load bookmark from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`quran-bookmark-${surahId}`);
    if (saved) setBookmarkedAyah(parseInt(saved));
    else setBookmarkedAyah(null);
  }, [surahId]);

  // Fetch ayahs with Arabic + English translation
  useEffect(() => {
    if (translationCache.has(surahId)) {
      setAyahs(translationCache.get(surahId)!);
      return;
    }

    setLoading(true);
    Promise.all([
      fetch(`https://api.alquran.cloud/v1/surah/${surahId}/quran-uthmani`).then(r => r.json()),
      fetch(`https://api.alquran.cloud/v1/surah/${surahId}/en.asad`).then(r => r.json()),
    ])
      .then(([arabicRes, translationRes]) => {
        const arabicAyahs: any[] = arabicRes?.data?.ayahs ?? [];
        const transAyahs: any[] = translationRes?.data?.ayahs ?? [];
        const merged: AyahData[] = arabicAyahs.map((a: any, i: number) => ({
          numberInSurah: a.numberInSurah,
          arabic: a.text,
          translation: transAyahs[i]?.text ?? "",
        }));
        translationCache.set(surahId, merged);
        setAyahs(merged);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [surahId]);

  // Scroll to bookmark on load
  useEffect(() => {
    if (bookmarkedAyah && ayahs.length > 0 && ayahRefs.current[bookmarkedAyah]) {
      setTimeout(() => {
        ayahRefs.current[bookmarkedAyah]?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
    }
  }, [bookmarkedAyah, ayahs]);

  const toggleBookmark = (ayahNum: number) => {
    if (bookmarkedAyah === ayahNum) {
      localStorage.removeItem(`quran-bookmark-${surahId}`);
      setBookmarkedAyah(null);
    } else {
      localStorage.setItem(`quran-bookmark-${surahId}`, String(ayahNum));
      setBookmarkedAyah(ayahNum);
    }
  };

  const filteredAyahs = search
    ? ayahs.filter(a => a.translation.toLowerCase().includes(search.toLowerCase()) || a.arabic.includes(search))
    : ayahs;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[150px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search ayahs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <Button
          variant={showTranslation ? "default" : "outline"}
          size="sm"
          onClick={() => setShowTranslation(!showTranslation)}
        >
          <Globe className="h-3.5 w-3.5 mr-1" /> Translation
        </Button>
        {bookmarkedAyah && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => ayahRefs.current[bookmarkedAyah]?.scrollIntoView({ behavior: "smooth", block: "center" })}
          >
            <BookmarkCheck className="h-3.5 w-3.5 mr-1" /> Go to Ayah {bookmarkedAyah}
          </Button>
        )}
      </div>

      {/* Bismillah */}
      {surahId !== 1 && surahId !== 9 && (
        <div className="text-center font-arabic text-2xl text-primary py-4 border-b border-border/50">
          بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
        </div>
      )}

      {/* Ayahs */}
      <ScrollArea className="max-h-[55vh]" ref={scrollRef}>
        <div className="space-y-1">
          {filteredAyahs.map((ayah) => (
            <div
              key={ayah.numberInSurah}
              ref={(el) => { ayahRefs.current[ayah.numberInSurah] = el; }}
              className={`group relative p-4 rounded-lg transition-colors hover:bg-accent/50 ${
                bookmarkedAyah === ayah.numberInSurah ? "bg-primary/5 ring-1 ring-primary/20" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <Badge variant="outline" className="shrink-0 mt-2 text-xs tabular-nums">
                  {ayah.numberInSurah}
                </Badge>
                <div className="flex-1 space-y-2">
                  <p className="font-arabic text-xl sm:text-2xl leading-loose text-right" dir="rtl">
                    {ayah.arabic}
                  </p>
                  {showTranslation && (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {ayah.translation}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => toggleBookmark(ayah.numberInSurah)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-2"
                >
                  {bookmarkedAyah === ayah.numberInSurah ? (
                    <BookmarkCheck className="h-4 w-4 text-primary" />
                  ) : (
                    <Bookmark className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Surah navigation */}
      <div className="flex justify-between pt-2 border-t border-border/50">
        {surahId > 1 ? (
          <Button variant="ghost" size="sm" onClick={() => { const s = surahs.find(s => s.id === surahId - 1); if (s) onChangeSurah(s); }}>
            ← {surahs.find(s => s.id === surahId - 1)?.name_transliteration}
          </Button>
        ) : <div />}
        {surahId < 114 ? (
          <Button variant="ghost" size="sm" onClick={() => { const s = surahs.find(s => s.id === surahId + 1); if (s) onChangeSurah(s); }}>
            {surahs.find(s => s.id === surahId + 1)?.name_transliteration} →
          </Button>
        ) : <div />}
      </div>
    </div>
  );
}
