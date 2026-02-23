import { useState, useEffect, useRef } from "react";

interface AyahText {
  numberInSurah: number;
  arabic: string;
  transliteration: string;
}

const cache = new Map<number, AyahText[]>();

export function useQuranText(surahId: number | null) {
  const [ayahs, setAyahs] = useState<AyahText[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!surahId) { setAyahs([]); return; }

    if (cache.has(surahId)) {
      setAyahs(cache.get(surahId)!);
      return;
    }

    setLoading(true);
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    Promise.all([
      fetch(`https://api.alquran.cloud/v1/surah/${surahId}/quran-uthmani`, { signal: ctrl.signal }).then(r => r.json()),
      fetch(`https://api.alquran.cloud/v1/surah/${surahId}/en.transliteration`, { signal: ctrl.signal }).then(r => r.json()),
    ])
      .then(([arabicRes, translitRes]) => {
        const arabicAyahs: any[] = arabicRes?.data?.ayahs ?? [];
        const translitAyahs: any[] = translitRes?.data?.ayahs ?? [];

        const merged: AyahText[] = arabicAyahs.map((a: any, i: number) => ({
          numberInSurah: a.numberInSurah,
          arabic: a.text,
          transliteration: translitAyahs[i]?.text ?? "",
        }));

        cache.set(surahId, merged);
        setAyahs(merged);
      })
      .catch((e) => {
        if (e.name !== "AbortError") console.error("Failed to fetch Quran text", e);
      })
      .finally(() => setLoading(false));

    return () => ctrl.abort();
  }, [surahId]);

  return { ayahs, loading };
}
