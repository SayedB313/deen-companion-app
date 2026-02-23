import { useState, useRef, useCallback, useEffect } from "react";
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
  { id: "ar.saaboreen", name: "Nasser Al Qatami", bitrate: 128 },
];

interface QuranAudioPlayerProps {
  surahId: number;
  ayahCount: number;
  surahs: { id: number; ayah_count: number }[];
  currentAyah?: number;
  onAyahChange?: (ayah: number) => void;
}

export default function QuranAudioPlayer({ surahId, ayahCount, surahs, currentAyah, onAyahChange }: QuranAudioPlayerProps) {
  const [reciter, setReciter] = useState(RECITERS[0].id);
  const [playing, setPlaying] = useState(false);
  const [currentAyahNum, setCurrentAyahNum] = useState(currentAyah || 1);
  const [loopMode, setLoopMode] = useState<"none" | "ayah" | "surah">("none");
  const [loopCount, setLoopCount] = useState(3);
  const [currentLoop, setCurrentLoop] = useState(0);
  const [volume, setVolume] = useState(80);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const loopCountRef = useRef(0);

  // Calculate absolute ayah number for the audio API
  const getAbsoluteAyah = useCallback((surahNum: number, ayahNum: number) => {
    let total = 0;
    for (const s of surahs) {
      if (s.id >= surahNum) break;
      total += s.ayah_count;
    }
    return total + ayahNum;
  }, [surahs]);

  const getAudioUrl = useCallback((ayahNum: number) => {
    const absAyah = getAbsoluteAyah(surahId, ayahNum);
    const reciterData = RECITERS.find((r) => r.id === reciter) || RECITERS[0];
    return `https://cdn.islamic.network/quran/audio/${reciterData.bitrate}/${reciter}/${absAyah}.mp3`;
  }, [surahId, reciter, getAbsoluteAyah]);

  const playAyah = useCallback((ayahNum: number) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeEventListener("ended", handleEnded);
      audioRef.current.removeEventListener("timeupdate", handleTimeUpdate);
    }

    const audio = new Audio(getAudioUrl(ayahNum));
    audio.volume = muted ? 0 : volume / 100;
    audioRef.current = audio;
    setCurrentAyahNum(ayahNum);
    setPlaying(true);
    setProgress(0);
    onAyahChange?.(ayahNum);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", () => setDuration(audio.duration));
    audio.addEventListener("ended", handleEnded);
    audio.play().catch(() => setPlaying(false));
  }, [getAudioUrl, volume, muted, onAyahChange]);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
    }
  }, []);

  const handleEnded = useCallback(() => {
    if (loopMode === "ayah") {
      loopCountRef.current++;
      if (loopCountRef.current < loopCount) {
        setCurrentLoop(loopCountRef.current);
        audioRef.current?.play();
        return;
      }
      loopCountRef.current = 0;
      setCurrentLoop(0);
      // Move to next ayah after loops complete
      if (currentAyahNum < ayahCount) {
        playAyah(currentAyahNum + 1);
        return;
      }
    }

    if (loopMode === "surah" && currentAyahNum < ayahCount) {
      playAyah(currentAyahNum + 1);
      return;
    }

    if (loopMode === "surah" && currentAyahNum >= ayahCount) {
      playAyah(1); // Loop back to first ayah
      return;
    }

    // Continuous play (no loop)
    if (loopMode === "none" && currentAyahNum < ayahCount) {
      playAyah(currentAyahNum + 1);
      return;
    }

    setPlaying(false);
  }, [loopMode, loopCount, currentAyahNum, ayahCount, playAyah]);

  // Re-attach ended handler when loop settings change
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.removeEventListener("ended", handleEnded);
    audio.addEventListener("ended", handleEnded);
    return () => audio.removeEventListener("ended", handleEnded);
  }, [handleEnded]);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = muted ? 0 : volume / 100;
    }
  }, [volume, muted]);

  const togglePlay = () => {
    if (!audioRef.current || !playing) {
      playAyah(currentAyahNum);
    } else if (playing) {
      audioRef.current?.pause();
      setPlaying(false);
    }
  };

  const resume = () => {
    audioRef.current?.play();
    setPlaying(true);
  };

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setPlaying(false);
    setProgress(0);
    loopCountRef.current = 0;
    setCurrentLoop(0);
  };

  const prevAyah = () => {
    if (currentAyahNum > 1) {
      loopCountRef.current = 0;
      setCurrentLoop(0);
      playAyah(currentAyahNum - 1);
    }
  };

  const nextAyah = () => {
    if (currentAyahNum < ayahCount) {
      loopCountRef.current = 0;
      setCurrentLoop(0);
      playAyah(currentAyahNum + 1);
    }
  };

  const seekTo = (val: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = val[0];
      setProgress(val[0]);
    }
  };

  const cycleLoopMode = () => {
    const modes: Array<"none" | "ayah" | "surah"> = ["none", "ayah", "surah"];
    const idx = modes.indexOf(loopMode);
    setLoopMode(modes[(idx + 1) % modes.length]);
    loopCountRef.current = 0;
    setCurrentLoop(0);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-3 bg-muted/30 rounded-lg p-3 border">
      {/* Reciter Select */}
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={reciter} onValueChange={(v) => { setReciter(v); if (playing) playAyah(currentAyahNum); }}>
          <SelectTrigger className="w-[200px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RECITERS.map((r) => (
              <SelectItem key={r.id} value={r.id} className="text-xs">{r.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Badge variant="outline" className="text-xs">
          Ayah {currentAyahNum}/{ayahCount}
        </Badge>
        {loopMode === "ayah" && (
          <Badge variant="secondary" className="text-xs">
            Loop {currentLoop + 1}/{loopCount}
          </Badge>
        )}
      </div>

      {/* Progress Bar */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground w-10 text-right tabular-nums">{formatTime(progress)}</span>
        <Slider
          value={[progress]}
          max={duration || 1}
          step={0.1}
          onValueChange={seekTo}
          className="flex-1"
        />
        <span className="text-xs text-muted-foreground w-10 tabular-nums">{formatTime(duration)}</span>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-1">
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={prevAyah} disabled={currentAyahNum <= 1}>
          <SkipBack className="h-4 w-4" />
        </Button>

        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={playing ? () => { audioRef.current?.pause(); setPlaying(false); } : (audioRef.current && audioRef.current.currentTime > 0 ? resume : togglePlay)}>
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>

        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={stop}>
          <Square className="h-4 w-4" />
        </Button>

        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={nextAyah} disabled={currentAyahNum >= ayahCount}>
          <SkipForward className="h-4 w-4" />
        </Button>

        <Button
          size="icon"
          variant={loopMode !== "none" ? "default" : "ghost"}
          className="h-8 w-8"
          onClick={cycleLoopMode}
          title={`Loop: ${loopMode === "none" ? "Off" : loopMode === "ayah" ? `Ayah ×${loopCount}` : "Surah"}`}
        >
          <Repeat className="h-4 w-4" />
        </Button>

        {loopMode === "ayah" && (
          <Select value={String(loopCount)} onValueChange={(v) => setLoopCount(Number(v))}>
            <SelectTrigger className="w-16 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2, 3, 5, 7, 10].map((n) => (
                <SelectItem key={n} value={String(n)} className="text-xs">×{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setMuted(!muted)}>
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </Button>

        <Slider
          value={[muted ? 0 : volume]}
          max={100}
          step={1}
          onValueChange={(v) => { setVolume(v[0]); setMuted(false); }}
          className="w-20"
        />
      </div>

      <p className="text-xs text-center text-muted-foreground">
        {loopMode === "none" && "Continuous play"}
        {loopMode === "ayah" && `Repeating each ayah ${loopCount}× for memorization`}
        {loopMode === "surah" && "Looping entire surah"}
      </p>
    </div>
  );
}
