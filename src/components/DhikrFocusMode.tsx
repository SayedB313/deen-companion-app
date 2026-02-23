import { useState, useCallback, useEffect } from "react";
import { X, SkipForward, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface DhikrItem {
  type: string;
  arabic: string;
  target: number;
  count: number;
}

interface DhikrFocusModeProps {
  dhikrs: DhikrItem[];
  startIndex: number;
  onTap: (type: string, target: number) => Promise<void>;
  onReset: (type: string, target: number) => Promise<void>;
  onClose: () => void;
}

const DhikrFocusMode = ({ dhikrs, startIndex, onTap, onReset, onClose }: DhikrFocusModeProps) => {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [localCount, setLocalCount] = useState(dhikrs[startIndex]?.count ?? 0);
  const [pulseKey, setPulseKey] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [allDone, setAllDone] = useState(false);

  const vibrate = useCallback((pattern: number | number[]) => {
    if ("vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  }, []);

  const advanceToNext = useCallback(() => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= dhikrs.length) {
      setAllDone(true);
      return;
    }
    setCurrentIndex(nextIndex);
    setLocalCount(dhikrs[nextIndex]?.count ?? 0);
    setCompleted(false);
  }, [currentIndex, dhikrs]);

  const current = dhikrs[currentIndex];
  const target = current?.target ?? 1;
  const progress = Math.min(1, localCount / target);
  const isDone = localCount >= target;

  const handleTap = useCallback(async () => {
    if (completed || allDone || !current) return;
    const newCount = localCount + 1;
    setLocalCount(newCount);
    setPulseKey(prev => prev + 1);
    vibrate(15);
    await onTap(current.type, target);
    if (newCount >= target) {
      vibrate([30, 50, 30]);
      setCompleted(true);
      setTimeout(() => advanceToNext(), 1500);
    }
  }, [localCount, current, target, completed, allDone, vibrate, onTap, advanceToNext]);

  const handleReset = useCallback(async () => {
    if (!current) return;
    setLocalCount(0);
    setCompleted(false);
    await onReset(current.type, target);
  }, [current, target, onReset]);

  useEffect(() => {
    setLocalCount(dhikrs[currentIndex]?.count ?? 0);
  }, [currentIndex, dhikrs]);

  if (!current) return null;

  const bgOpacity = Math.round(progress * 15);

  if (allDone) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background"
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.6 }}
          className="text-center space-y-4"
        >
          <div className="text-6xl">🤲</div>
          <h2 className="text-2xl font-bold text-foreground">MashaAllah!</h2>
          <p className="text-muted-foreground">All dhikr completed for today</p>
          <Button onClick={onClose} className="mt-6">Back to Overview</Button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col transition-colors duration-700"
      style={{ background: `hsl(var(--primary) / ${bgOpacity}%)` }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between p-4">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
        <span className="text-sm text-muted-foreground">
          {currentIndex + 1} / {dhikrs.length}
        </span>
        <Button variant="ghost" size="icon" onClick={advanceToNext}>
          <SkipForward className="h-5 w-5" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.type}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-3"
          >
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              {current.type}
            </p>
            {current.arabic && (
              <p className="font-arabic text-4xl md:text-5xl leading-relaxed text-foreground">
                {current.arabic}
              </p>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Circular tap target with progress ring */}
        <div className="relative flex items-center justify-center">
          <svg className="absolute w-56 h-56 md:w-64 md:h-64 -rotate-90" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="90" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
            <motion.circle
              cx="100" cy="100" r="90" fill="none"
              stroke="hsl(var(--primary))" strokeWidth="4" strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 90}
              animate={{ strokeDashoffset: 2 * Math.PI * 90 * (1 - progress) }}
              transition={{ duration: 0.3 }}
            />
          </svg>

          <AnimatePresence>
            <motion.div
              key={pulseKey}
              initial={{ scale: 1, opacity: 0.4 }}
              animate={{ scale: 1.3, opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute w-48 h-48 md:w-56 md:h-56 rounded-full bg-primary/20"
            />
          </AnimatePresence>

          <button
            onClick={handleTap}
            disabled={completed || allDone}
            className="relative w-48 h-48 md:w-56 md:h-56 rounded-full flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform select-none touch-manipulation border-2 border-border bg-card"
          >
            <span className="text-5xl md:text-6xl font-bold tabular-nums text-foreground">
              {localCount}
            </span>
            <span className="text-sm text-muted-foreground">/ {target}</span>
          </button>
        </div>

        <AnimatePresence>
          {completed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <p className="text-primary font-semibold text-lg">✓ Complete!</p>
              <p className="text-xs text-muted-foreground">Moving to next...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom */}
      <div className="flex items-center justify-center gap-4 p-6 safe-area-pb">
        <Button variant="outline" size="sm" onClick={handleReset} className="gap-2">
          <RotateCcw className="h-4 w-4" /> Reset
        </Button>
      </div>
    </motion.div>
  );
};

export default DhikrFocusMode;
