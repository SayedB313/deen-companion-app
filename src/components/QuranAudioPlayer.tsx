import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Square, SkipBack, SkipForward, Repeat, Repeat1, Volume2, VolumeX } from "lucide-react";

const RECITERS = [
  { id: "ar.alafasy", name: "Mishary Alafasy", bitrate: 128 },
  { id: "ar.abdurrahmaansudais", name: "Abdurrahman As-Sudais", bitrate: 192 },
  { id: "ar.husary", name: "Mahmoud Khalil Al-Husary", bitrate: 128 },
  { id: "ar.minshawi", name: "Mohamed Siddiq El-Minshawi", bitrate: 128 },
  { id: "ar.abdulbasitmurattal", name: "Abdul Basit (Murattal)", bitrate: 192 },
];

type LoopMode = "off" | "one" | "continuous" | "surah-loop";

interface QuranAudioPlayerProps {
  surahId: number;
  ayahCount: number;
  surahs: { id: number; ayah_count: number }[];
  currentAyah?: number;
  onAyahChange?: (ayah: number) => void;
}

export default function QuranAudioPlayer({
  surahId,
  ayahCount,
  surahs,
  currentAyah,
  onAyahChange,
}: QuranAudioPlayerProps) {
  const [reciter, setReciter] = useState(RECITERS[0].id);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [ayahNum, setAyahNum] = useState(currentAyah || 1);
  const [loopMode, setLoopMode] = useState<LoopMode>("off");
  const [repeatCount, setRepeatCount] = useState(3);
  const [currentRepeat, setCurrentRepeat] = useState(0);
  const [volume, setVolume] = useState(80);
  const [muted, setMuted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);

  // Use refs for values needed in the ended handler to avoid stale closures
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ayahRef = useRef(ayahNum);
  const loopRef = useRef(loopMode);
  const repeatRef = useRef(repeatCount);
  const repeatIdxRef = useRef(0);

  // Keep refs in sync
  useEffect(() => { ayahRef.current = ayahNum; }, [ayahNum]);
  useEffect(() => { loopRef.current = loopMode; }, [loopMode]);
  useEffect(() => { repeatRef.current = repeatCount; }, [repeatCount]);

  const getAbsoluteAyah = (sId: number, aNum: number) => {
    let total = 0;
    for (const s of surahs) {
      if (s.id >= sId) break;
      total += s.ayah_count;
    }
    return total + aNum;
  };

  const buildUrl = (aNum: number, rec?: string) => {
    const r = RECITERS.find((x) => x.id === (rec || reciter)) || RECITERS[0];
    const abs = getAbsoluteAyah(surahId, aNum);
    return `https://cdn.islamic.network/quran/audio/${r.bitrate}/${rec || reciter}/${abs}.mp3`;
  };

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const loadAndPlay = (targetAyah: number) => {
    // Stop existing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const url = buildUrl(targetAyah);
    const audio = new Audio(url);
    audio.volume = muted ? 0 : volume / 100;
    audioRef.current = audio;

    setAyahNum(targetAyah);
    ayahRef.current = targetAyah;
    setPlaying(true);
    setPaused(false);
    setElapsed(0);
    setDuration(0);
    repeatIdxRef.current = 0;
    setCurrentRepeat(0);
    onAyahChange?.(targetAyah);

    audio.addEventListener("loadedmetadata", () => {
      setDuration(audio.duration);
    });

    audio.addEventListener("timeupdate", () => {
      setElapsed(audio.currentTime);
    });

    audio.addEventListener("ended", handleAudioEnded);

    audio.play().catch(() => {
      setPlaying(false);
      setPaused(false);
    });
  };

  const handleAudioEnded = () => {
    const mode = loopRef.current;
    const curAyah = ayahRef.current;

    if (mode === "one") {
      // Repeat current ayah N times
      repeatIdxRef.current++;
      if (repeatIdxRef.current < repeatRef.current) {
        setCurrentRepeat(repeatIdxRef.current);
        audioRef.current?.play();
        return;
      }
      // Done repeating — stop
      repeatIdxRef.current = 0;
      setCurrentRepeat(0);
      setPlaying(false);
      setPaused(false);
      return;
    }

    if (mode === "continuous") {
      // Play next ayah, stop at end of surah
      if (curAyah < ayahCount) {
        loadAndPlay(curAyah + 1);
      } else {
        setPlaying(false);
        setPaused(false);
      }
      return;
    }

    if (mode === "surah-loop") {
      // Play next ayah, loop back to 1 at end
      if (curAyah < ayahCount) {
        loadAndPlay(curAyah + 1);
      } else {
        loadAndPlay(1);
      }
      return;
    }

    // "off" — just stop after this ayah
    setPlaying(false);
    setPaused(false);
  };

  // ---- Controls ----

  const handlePlayPause = () => {
    if (playing && !paused) {
      // Pause
      audioRef.current?.pause();
      setPaused(true);
      return;
    }
    if (paused && audioRef.current) {
      // Resume
      audioRef.current.play();
      setPaused(false);
      return;
    }
    // Start fresh
    loadAndPlay(ayahNum);
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlaying(false);
    setPaused(false);
    setElapsed(0);
    repeatIdxRef.current = 0;
    setCurrentRepeat(0);
  };

  const handlePrev = () => {
    if (ayahNum > 1) loadAndPlay(ayahNum - 1);
  };

  const handleNext = () => {
    if (ayahNum < ayahCount) loadAndPlay(ayahNum + 1);
  };

  /** Called from the parent when user clicks an ayah number to play it */
  const playSpecificAyah = (num: number) => {
    loadAndPlay(num);
  };

  // Expose playSpecificAyah by attaching to a ref the parent can call
  // Instead, we use onAyahChange callback and accept clicks from parent via prop
  // We'll handle this via the parent passing a selectedAyahToPlay prop

  const handleSeek = (val: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = val[0];
      setElapsed(val[0]);
    }
  };

  // Volume sync
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = muted ? 0 : volume / 100;
    }
  }, [volume, muted]);

  const cycleLoop = () => {
    const modes: LoopMode[] = ["off", "one", "continuous", "surah-loop"];
    setLoopMode((prev) => modes[(modes.indexOf(prev) + 1) % modes.length]);
    repeatIdxRef.current = 0;
    setCurrentRepeat(0);
  };

  const handleReciterChange = (newReciter: string) => {
    setReciter(newReciter);
    if (playing) {
      // Restart current ayah with new reciter
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      const r = RECITERS.find((x) => x.id === newReciter) || RECITERS[0];
      const abs = getAbsoluteAyah(surahId, ayahNum);
      const url = `https://cdn.islamic.network/quran/audio/${r.bitrate}/${newReciter}/${abs}.mp3`;
      const audio = new Audio(url);
      audio.volume = muted ? 0 : volume / 100;
      audioRef.current = audio;
      setElapsed(0);
      setDuration(0);
      audio.addEventListener("loadedmetadata", () => setDuration(audio.duration));
      audio.addEventListener("timeupdate", () => setElapsed(audio.currentTime));
      audio.addEventListener("ended", handleAudioEnded);
      audio.play().catch(() => { setPlaying(false); setPaused(false); });
    }
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const loopLabel: Record<LoopMode, string> = {
    off: "Play once — stops after current ayah",
    one: `Repeat ayah ×${repeatCount}`,
    continuous: "Continuous — plays through to end of surah",
    "surah-loop": "Loop surah — restarts from ayah 1 at the end",
  };

  const loopIcon: Record<LoopMode, React.ReactNode> = {
    off: <Repeat className="h-4 w-4" />,
    one: <Repeat1 className="h-4 w-4" />,
    continuous: <SkipForward className="h-4 w-4" />,
    "surah-loop": <Repeat className="h-4 w-4" />,
  };

  return (
    <div className="space-y-3 bg-muted/30 rounded-lg p-3 border">
      {/* Reciter + Ayah selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={reciter} onValueChange={handleReciterChange}>
          <SelectTrigger className="h-8 text-xs flex-1 min-w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RECITERS.map((r) => (
              <SelectItem key={r.id} value={r.id} className="text-xs">{r.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Ayah selector */}
        <Select value={String(ayahNum)} onValueChange={(v) => loadAndPlay(Number(v))}>
          <SelectTrigger className="w-24 h-8 text-xs">
            <SelectValue placeholder="Ayah" />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {Array.from({ length: ayahCount }, (_, i) => i + 1).map((n) => (
              <SelectItem key={n} value={String(n)} className="text-xs">Ayah {n}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground w-10 text-right tabular-nums">{fmt(elapsed)}</span>
        <Slider value={[elapsed]} max={duration || 1} step={0.1} onValueChange={handleSeek} className="flex-1" />
        <span className="text-xs text-muted-foreground w-10 tabular-nums">{fmt(duration)}</span>
      </div>

      {/* Transport controls */}
      <div className="flex items-center justify-center gap-1.5">
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handlePrev} disabled={ayahNum <= 1}>
          <SkipBack className="h-4 w-4" />
        </Button>

        <Button size="icon" variant="default" className="h-9 w-9" onClick={handlePlayPause}>
          {playing && !paused ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
        </Button>

        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleStop} disabled={!playing && !paused}>
          <Square className="h-4 w-4" />
        </Button>

        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleNext} disabled={ayahNum >= ayahCount}>
          <SkipForward className="h-4 w-4" />
        </Button>

      <div className="w-px h-6 bg-border mx-1" />

        {/* Auto-play next toggle */}
        <Button
          size="sm"
          variant={loopMode === "continuous" || loopMode === "surah-loop" ? "secondary" : "outline"}
          className="h-8 text-xs px-2 gap-1"
          onClick={() => {
            if (loopMode === "continuous") setLoopMode("surah-loop");
            else if (loopMode === "surah-loop") setLoopMode("off");
            else setLoopMode("continuous");
          }}
          title={loopMode === "continuous" ? "Auto-play to end of surah" : loopMode === "surah-loop" ? "Loop entire surah" : "Auto-play off"}
        >
          <SkipForward className="h-3.5 w-3.5" />
          {loopMode === "continuous" ? "Auto" : loopMode === "surah-loop" ? "Loop" : "Auto"}
        </Button>

        {/* Repeat ayah toggle */}
        <Button
          size="icon"
          variant={loopMode === "one" ? "secondary" : "ghost"}
          className="h-8 w-8"
          onClick={() => {
            if (loopMode === "one") setLoopMode("off");
            else setLoopMode("one");
            repeatIdxRef.current = 0;
            setCurrentRepeat(0);
          }}
          title={loopMode === "one" ? `Repeating ayah ×${repeatCount}` : "Repeat current ayah"}
        >
          <Repeat1 className="h-4 w-4" />
        </Button>

        {loopMode === "one" && (
          <Select value={String(repeatCount)} onValueChange={(v) => setRepeatCount(Number(v))}>
            <SelectTrigger className="w-16 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2, 3, 5, 7, 10, 20].map((n) => (
                <SelectItem key={n} value={String(n)} className="text-xs">×{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <div className="w-px h-6 bg-border mx-1" />

        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setMuted(!muted)}>
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </Button>
        <Slider
          value={[muted ? 0 : volume]}
          max={100}
          step={1}
          onValueChange={(v) => { setVolume(v[0]); setMuted(false); }}
          className="w-16"
        />
      </div>

      {/* Status line */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <span>Ayah {ayahNum}/{ayahCount}</span>
        <span>·</span>
        <span>{loopLabel[loopMode]}</span>
        {loopMode === "one" && playing && (
          <>
            <span>·</span>
            <Badge variant="outline" className="text-xs py-0">{currentRepeat + 1}/{repeatCount}</Badge>
          </>
        )}
      </div>
    </div>
  );
}
