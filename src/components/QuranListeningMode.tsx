import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Square, SkipBack, SkipForward, Repeat, Volume2, VolumeX } from "lucide-react";

const RECITERS = [
  { id: "ar.alafasy", name: "Mishary Alafasy", bitrate: 128 },
  { id: "ar.abdurrahmaansudais", name: "Abdurrahman As-Sudais", bitrate: 192 },
  { id: "ar.husary", name: "Mahmoud Khalil Al-Husary", bitrate: 128 },
  { id: "ar.minshawi", name: "Mohamed Siddiq El-Minshawi", bitrate: 128 },
  { id: "ar.abdulbasitmurattal", name: "Abdul Basit (Murattal)", bitrate: 192 },
];

type AutoPlayMode = "off" | "continuous" | "surah-loop";

interface Props {
  surahId: number;
  ayahCount: number;
  surahs: { id: number; ayah_count: number }[];
  surahAyahs: Record<number, string>;
  onCycleStatus: (ayah: number) => void;
  revisionStatus?: (ayah: number) => "overdue" | "due" | "safe" | "new";
}

export default function QuranListeningMode({ surahId, ayahCount, surahs, surahAyahs, onCycleStatus, revisionStatus }: Props) {
  const [reciter, setReciter] = useState(RECITERS[0].id);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [ayahNum, setAyahNum] = useState(1);
  const [autoPlay, setAutoPlay] = useState<AutoPlayMode>("off");
  const [volume, setVolume] = useState(80);
  const [muted, setMuted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ayahRef = useRef(ayahNum);
  const autoPlayRef = useRef(autoPlay);

  useEffect(() => { ayahRef.current = ayahNum; }, [ayahNum]);
  useEffect(() => { autoPlayRef.current = autoPlay; }, [autoPlay]);

  const getAbsoluteAyah = (sId: number, aNum: number) => {
    let total = 0;
    for (const s of surahs) { if (s.id >= sId) break; total += s.ayah_count; }
    return total + aNum;
  };

  const buildUrl = (aNum: number) => {
    const r = RECITERS.find(x => x.id === reciter) || RECITERS[0];
    return `https://cdn.islamic.network/quran/audio/${r.bitrate}/${reciter}/${getAbsoluteAyah(surahId, aNum)}.mp3`;
  };

  useEffect(() => {
    return () => { audioRef.current?.pause(); audioRef.current = null; };
  }, []);

  const loadAndPlay = (target: number) => {
    audioRef.current?.pause();
    audioRef.current = null;
    const audio = new Audio(buildUrl(target));
    audio.volume = muted ? 0 : volume / 100;
    audioRef.current = audio;
    setAyahNum(target);
    ayahRef.current = target;
    setPlaying(true);
    setPaused(false);
    setElapsed(0);
    setDuration(0);

    audio.addEventListener("loadedmetadata", () => setDuration(audio.duration));
    audio.addEventListener("timeupdate", () => setElapsed(audio.currentTime));
    audio.addEventListener("ended", () => {
      const mode = autoPlayRef.current;
      const cur = ayahRef.current;
      if (mode === "continuous") {
        if (cur < ayahCount) loadAndPlay(cur + 1);
        else { setPlaying(false); setPaused(false); }
      } else if (mode === "surah-loop") {
        loadAndPlay(cur < ayahCount ? cur + 1 : 1);
      } else {
        setPlaying(false); setPaused(false);
      }
    });
    audio.play().catch(() => { setPlaying(false); setPaused(false); });
  };

  const handlePlayPause = () => {
    if (playing && !paused) { audioRef.current?.pause(); setPaused(true); return; }
    if (paused && audioRef.current) { audioRef.current.play(); setPaused(false); return; }
    loadAndPlay(ayahNum);
  };

  const handleStop = () => {
    audioRef.current?.pause(); audioRef.current = null;
    setPlaying(false); setPaused(false); setElapsed(0);
  };

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = muted ? 0 : volume / 100;
  }, [volume, muted]);

  const handleReciterChange = (newReciter: string) => {
    setReciter(newReciter);
    if (playing) { loadAndPlay(ayahNum); }
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;

  const statusRing = (ayah: number) => {
    if (!revisionStatus) return "";
    const s = revisionStatus(ayah);
    if (s === "overdue") return "ring-2 ring-destructive";
    if (s === "due") return "ring-2 ring-warning";
    if (s === "safe") return "ring-2 ring-primary/40";
    return "";
  };

  const statusColors: Record<string, string> = {
    not_started: "bg-muted",
    in_progress: "bg-warning",
    memorised: "bg-primary",
    needs_review: "bg-info",
  };

  return (
    <div className="space-y-3">
      {/* Reciter */}
      <Select value={reciter} onValueChange={handleReciterChange}>
        <SelectTrigger className="h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {RECITERS.map(r => (
            <SelectItem key={r.id} value={r.id} className="text-xs">{r.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Progress */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground w-10 text-right tabular-nums">{fmt(elapsed)}</span>
        <Slider value={[elapsed]} max={duration || 1} step={0.1} onValueChange={v => { if (audioRef.current) { audioRef.current.currentTime = v[0]; setElapsed(v[0]); } }} className="flex-1" />
        <span className="text-xs text-muted-foreground w-10 tabular-nums">{fmt(duration)}</span>
      </div>

      {/* Transport */}
      <div className="flex items-center justify-center gap-1.5">
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => ayahNum > 1 && loadAndPlay(ayahNum - 1)} disabled={ayahNum <= 1}>
          <SkipBack className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="default" className="h-9 w-9" onClick={handlePlayPause}>
          {playing && !paused ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleStop} disabled={!playing && !paused}>
          <Square className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => ayahNum < ayahCount && loadAndPlay(ayahNum + 1)} disabled={ayahNum >= ayahCount}>
          <SkipForward className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        <Button
          size="sm"
          variant={autoPlay !== "off" ? "secondary" : "outline"}
          className="h-8 text-xs px-2 gap-1"
          onClick={() => setAutoPlay(p => p === "off" ? "continuous" : p === "continuous" ? "surah-loop" : "off")}
        >
          <Repeat className="h-3.5 w-3.5" />
          {autoPlay === "continuous" ? "Auto" : autoPlay === "surah-loop" ? "Loop" : "Off"}
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setMuted(!muted)}>
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </Button>
        <Slider value={[muted ? 0 : volume]} max={100} step={1} onValueChange={v => { setVolume(v[0]); setMuted(false); }} className="w-16" />
      </div>

      {/* Status */}
      <div className="text-xs text-muted-foreground text-center">
        Ayah {ayahNum}/{ayahCount} · Click an ayah to play
      </div>

      {/* Ayah grid — click to play */}
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: ayahCount }, (_, i) => i + 1).map(num => {
          const status = surahAyahs[num] ?? "not_started";
          return (
            <button
              key={num}
              onClick={() => loadAndPlay(num)}
              onContextMenu={e => { e.preventDefault(); onCycleStatus(num); }}
              className={`h-8 w-8 rounded text-xs font-medium transition-colors ${statusColors[status]} ${
                status === "memorised" ? "text-primary-foreground" : status === "in_progress" ? "text-warning-foreground" : status === "needs_review" ? "text-info-foreground" : "text-foreground"
              } ${ayahNum === num && playing ? "ring-2 ring-primary ring-offset-1" : statusRing(num)}`}
              title={`Ayah ${num} — Right-click to change status`}
            >
              {num}
            </button>
          );
        })}
      </div>
    </div>
  );
}
