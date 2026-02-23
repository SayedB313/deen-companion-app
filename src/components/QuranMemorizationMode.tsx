import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Play, Pause, Volume2, VolumeX, SkipForward, CheckCircle2, RotateCcw, Zap, Loader2, Sparkles } from "lucide-react";
import { useQuranText } from "@/hooks/useQuranText";
import { useAyahRevision } from "@/hooks/useAyahRevision";
import { useAyahExplainer } from "@/hooks/useAyahExplainer";
import ReactMarkdown from "react-markdown";
const RECITERS = [
  { id: "ar.alafasy", name: "Mishary Alafasy", bitrate: 128 },
  { id: "ar.abdurrahmaansudais", name: "Abdurrahman As-Sudais", bitrate: 192 },
  { id: "ar.husary", name: "Mahmoud Khalil Al-Husary", bitrate: 128 },
  { id: "ar.minshawi", name: "Mohamed Siddiq El-Minshawi", bitrate: 128 },
  { id: "ar.abdulbasitmurattal", name: "Abdul Basit (Murattal)", bitrate: 192 },
];

const SPEEDS = [0.5, 0.75, 1, 1.25];
const REPEAT_OPTIONS = [2, 3, 5, 7, 10, 20];

interface Props {
  surahId: number;
  surahName: string;
  ayahCount: number;
  surahs: { id: number; ayah_count: number }[];
  surahAyahs: Record<number, string>;
  onCycleStatus: (ayah: number) => void;
}

export default function QuranMemorizationMode({ surahId, surahName, ayahCount, surahs, surahAyahs, onCycleStatus }: Props) {
  const { ayahs, loading: textLoading } = useQuranText(surahId);
  const { reviewAyah, getAyahStatus, getNextDue } = useAyahRevision(surahId);
  const { explain, getExplanation, isLoading: isExplaining } = useAyahExplainer();

  const [reciter, setReciter] = useState(RECITERS[0].id);
  const [speed, setSpeed] = useState(1);
  const [repeatCount, setRepeatCount] = useState(3);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [volume, setVolume] = useState(80);
  const [muted, setMuted] = useState(false);
  const [playingAyah, setPlayingAyah] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [currentRepeat, setCurrentRepeat] = useState(0);
  const [showReview, setShowReview] = useState<number | null>(null);
  const [activeAyah, setActiveAyah] = useState(1);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const repeatIdxRef = useRef(0);
  const repeatCountRef = useRef(repeatCount);
  const autoAdvanceRef = useRef(autoAdvance);
  const activeAyahRef = useRef(activeAyah);
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  useEffect(() => { repeatCountRef.current = repeatCount; }, [repeatCount]);
  useEffect(() => { autoAdvanceRef.current = autoAdvance; }, [autoAdvance]);
  useEffect(() => { activeAyahRef.current = activeAyah; }, [activeAyah]);

  const getAbsoluteAyah = (sId: number, aNum: number) => {
    let total = 0;
    for (const s of surahs) { if (s.id >= sId) break; total += s.ayah_count; }
    return total + aNum;
  };

  useEffect(() => {
    return () => { audioRef.current?.pause(); audioRef.current = null; };
  }, []);

  const playAyah = useCallback((ayahNumber: number) => {
    audioRef.current?.pause();
    audioRef.current = null;

    const r = RECITERS.find(x => x.id === reciter) || RECITERS[0];
    const abs = getAbsoluteAyah(surahId, ayahNumber);
    const audio = new Audio(`https://cdn.islamic.network/quran/audio/${r.bitrate}/${reciter}/${abs}.mp3`);
    audio.volume = muted ? 0 : volume / 100;
    audio.playbackRate = speed;
    audioRef.current = audio;

    setPlayingAyah(ayahNumber);
    setActiveAyah(ayahNumber);
    activeAyahRef.current = ayahNumber;
    setPaused(false);
    repeatIdxRef.current = 0;
    setCurrentRepeat(0);
    setShowReview(null);

    // Scroll to card
    const el = cardRefs.current.get(ayahNumber);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });

    audio.addEventListener("ended", () => {
      repeatIdxRef.current++;
      if (repeatIdxRef.current < repeatCountRef.current) {
        setCurrentRepeat(repeatIdxRef.current);
        audio.play();
        return;
      }
      // Done repeating — show review prompt
      setPlayingAyah(null);
      setPaused(false);
      setCurrentRepeat(0);
      setShowReview(ayahNumber);

      // If auto-advance and user doesn't review within 10s, move on
      if (autoAdvanceRef.current && ayahNumber < ayahCount) {
        // Don't auto-advance, let user rate first
      }
    });

    audio.play().catch(() => { setPlayingAyah(null); setPaused(false); });
  }, [reciter, speed, volume, muted, surahId, surahs, ayahCount]);

  const togglePause = () => {
    if (!audioRef.current) return;
    if (paused) { audioRef.current.play(); setPaused(false); }
    else { audioRef.current.pause(); setPaused(true); }
  };

  const handleReview = async (ayahNumber: number, quality: number) => {
    await reviewAyah(ayahNumber, quality);
    setShowReview(null);
    // Auto-advance to next ayah
    if (autoAdvance && ayahNumber < ayahCount) {
      playAyah(ayahNumber + 1);
    }
  };

  const jumpToNextDue = () => {
    const next = getNextDue();
    if (next) {
      playAyah(next);
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = muted ? 0 : volume / 100;
      audioRef.current.playbackRate = speed;
    }
  }, [volume, muted, speed]);

  const revisionRing = (ayah: number) => {
    const s = getAyahStatus(ayah);
    if (s === "overdue") return "border-destructive";
    if (s === "due") return "border-warning";
    if (s === "safe") return "border-primary/40";
    return "border-border";
  };

  const statusColors: Record<string, string> = {
    not_started: "bg-muted",
    in_progress: "bg-warning",
    memorised: "bg-primary",
    needs_review: "bg-info",
  };

  if (textLoading) {
    return (
      <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading Quran text…</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Controls row */}
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={reciter} onValueChange={setReciter}>
          <SelectTrigger className="h-8 text-xs flex-1 min-w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RECITERS.map(r => (
              <SelectItem key={r.id} value={r.id} className="text-xs">{r.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Speed */}
        <div className="flex items-center gap-1">
          {SPEEDS.map(s => (
            <Button
              key={s}
              size="sm"
              variant={speed === s ? "default" : "outline"}
              className="h-7 text-xs px-2"
              onClick={() => setSpeed(s)}
            >
              {s}x
            </Button>
          ))}
        </div>
      </div>

      {/* Repeat + auto-advance + next due */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-muted-foreground">Repeat:</span>
          <Select value={String(repeatCount)} onValueChange={v => setRepeatCount(Number(v))}>
            <SelectTrigger className="w-16 h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REPEAT_OPTIONS.map(n => (
                <SelectItem key={n} value={String(n)} className="text-xs">×{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          size="sm"
          variant={autoAdvance ? "secondary" : "outline"}
          className="h-7 text-xs gap-1"
          onClick={() => setAutoAdvance(!autoAdvance)}
        >
          <SkipForward className="h-3 w-3" />
          Auto-advance
        </Button>

        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs gap-1"
          onClick={jumpToNextDue}
        >
          <Zap className="h-3 w-3" />
          Next Due
        </Button>

        <div className="flex items-center gap-1 ml-auto">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setMuted(!muted)}>
            {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
          </Button>
          <Slider value={[muted ? 0 : volume]} max={100} step={1} onValueChange={v => { setVolume(v[0]); setMuted(false); }} className="w-16" />
        </div>
      </div>

      {/* Ayah cards */}
      <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
        {ayahs.map(ayah => {
          const num = ayah.numberInSurah;
          const isPlaying = playingAyah === num;
          const isReview = showReview === num;
          const memStatus = surahAyahs[num] ?? "not_started";

          return (
            <Card
              key={num}
              ref={el => { if (el) cardRefs.current.set(num, el); }}
              className={`p-3 transition-colors ${revisionRing(num)} ${isPlaying ? "ring-2 ring-primary" : ""}`}
            >
              <div className="flex items-start gap-2">
                {/* Ayah number + play */}
                <div className="flex flex-col items-center gap-1 pt-1">
                  <button
                    onClick={() => onCycleStatus(num)}
                    className={`h-7 w-7 rounded text-xs font-medium ${statusColors[memStatus]} ${
                      memStatus === "memorised" ? "text-primary-foreground" : memStatus === "in_progress" ? "text-warning-foreground" : memStatus === "needs_review" ? "text-info-foreground" : "text-foreground"
                    }`}
                    title="Click to cycle status"
                  >
                    {num}
                  </button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => isPlaying ? togglePause() : playAyah(num)}
                  >
                    {isPlaying && !paused ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => explain(surahId, surahName, num, ayah.arabic)}
                    disabled={isExplaining(surahId, num)}
                    title="Explain this ayah"
                  >
                    {isExplaining(surahId, num) ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  </Button>
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="font-arabic text-xl leading-loose text-right" dir="rtl">
                    {ayah.arabic}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {ayah.transliteration}
                  </p>
                </div>
              </div>

              {/* Playing indicator */}
              {isPlaying && (
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-xs py-0">
                    {currentRepeat + 1}/{repeatCount}
                  </Badge>
                  <span>Playing at {speed}x</span>
                </div>
              )}

              {/* Review prompt */}
              {isReview && (
                <div className="mt-2 p-2 rounded-md bg-muted/50 space-y-1.5">
                  <p className="text-xs font-medium">How well did you recall?</p>
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="outline" className="h-7 text-xs flex-1" onClick={() => handleReview(num, 2)}>
                      <RotateCcw className="h-3 w-3 mr-1" /> Hard
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs flex-1" onClick={() => handleReview(num, 4)}>
                      Good
                    </Button>
                    <Button size="sm" className="h-7 text-xs flex-1" onClick={() => handleReview(num, 5)}>
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Easy
                    </Button>
                  </div>
                </div>
              )}

              {/* AI Explanation */}
              {getExplanation(surahId, num) && (
                <div className="mt-2 p-3 rounded-md bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Sparkles className="h-3 w-3 text-primary" />
                    <span className="text-xs font-medium text-primary">AI Explanation</span>
                  </div>
                  <div className="text-xs text-muted-foreground prose prose-sm max-w-none [&_h1]:text-sm [&_h2]:text-xs [&_h3]:text-xs [&_p]:text-xs [&_li]:text-xs [&_strong]:text-foreground">
                    <ReactMarkdown>{getExplanation(surahId, num)!}</ReactMarkdown>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
