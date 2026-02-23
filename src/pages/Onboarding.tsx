import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Moon, Clock, Flame, Sparkles,
  ArrowRight, ArrowLeft, Check, Star, Leaf, Zap, Trophy,
} from "lucide-react";

const FOCUS_AREAS = [
  { id: "salah", label: "Salah Tracking", icon: Star, desc: "Track your 5 daily prayers" },
  { id: "quran", label: "Qur'an Memorisation", icon: BookOpen, desc: "Ayah-by-ayah hifz progress" },
  { id: "dhikr", label: "Dhikr & Adhkar", icon: Sparkles, desc: "Daily remembrance counters" },
  { id: "fasting", label: "Fasting", icon: Moon, desc: "Log sunnah & obligatory fasts" },
  { id: "time", label: "Deen Time Tracking", icon: Clock, desc: "Track time spent on deen" },
  { id: "character", label: "Character Growth", icon: Flame, desc: "Journal virtues & habits" },
];

const EXPERIENCE_LEVELS = [
  { id: "beginner", label: "Just Starting", icon: Leaf, desc: "New to consistent worship habits", color: "bg-success/10 text-success" },
  { id: "intermediate", label: "Building Momentum", icon: Zap, desc: "Praying regularly, want to grow more", color: "bg-warning/10 text-warning" },
  { id: "advanced", label: "Striving for Excellence", icon: Trophy, desc: "Strong foundation, aiming for ihsan", color: "bg-primary/10 text-primary" },
];

const DAILY_TARGETS: Record<string, { label: string; options: number[]; unit: string }> = {
  salah: { label: "Prayers per day", options: [3, 5], unit: "prayers" },
  quran: { label: "Ayahs to memorise daily", options: [1, 3, 5, 10], unit: "ayahs" },
  dhikr: { label: "Dhikr sessions per day", options: [1, 3, 5], unit: "sessions" },
  fasting: { label: "Fasts per week", options: [1, 2, 3], unit: "days" },
  time: { label: "Deen minutes per day", options: [15, 30, 60, 90], unit: "min" },
  character: { label: "Character logs per week", options: [1, 3, 7], unit: "logs" },
};

const Onboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [selectedAreas, setSelectedAreas] = useState<string[]>(["salah", "quran"]);
  const [experience, setExperience] = useState("beginner");
  const [targets, setTargets] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  const toggleArea = (id: string) => {
    setSelectedAreas((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const getTarget = (area: string) => {
    if (targets[area]) return targets[area];
    const config = DAILY_TARGETS[area];
    if (!config) return 1;
    // Auto-set based on experience
    const idx = experience === "beginner" ? 0 : experience === "intermediate" ? 1 : Math.min(2, config.options.length - 1);
    return config.options[Math.min(idx, config.options.length - 1)];
  };

  const finish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await supabase
        .from("profiles")
        .update({
          display_name: name.trim() || null,
          onboarding_complete: true,
        })
        .eq("id", user.id);

      const goalRows = selectedAreas.map((area) => ({
        user_id: user.id,
        area,
        period: area === "fasting" || area === "character" ? "weekly" : "daily",
        target_value: getTarget(area),
        is_active: true,
      }));
      if (goalRows.length > 0) {
        await supabase.from("goals").insert(goalRows);
      }

      toast({ title: "Welcome aboard! 🎉", description: "Your deen journey starts now." });
      navigate("/", { replace: true });
    } catch {
      toast({ title: "Error saving", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const totalSteps = 4;

  const steps = [
    // Step 1: Name
    <div key="name" className="space-y-6 text-center">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Assalamu Alaikum 👋</h2>
        <p className="text-muted-foreground">What should we call you?</p>
      </div>
      <div className="max-w-sm mx-auto space-y-2">
        <Label htmlFor="name" className="sr-only">Your name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="text-center text-lg h-12"
          maxLength={50}
          autoFocus
        />
      </div>
    </div>,

    // Step 2: Experience level
    <div key="experience" className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Where are you on your journey?</h2>
        <p className="text-muted-foreground">This helps us personalise your experience</p>
      </div>
      <div className="grid gap-3">
        {EXPERIENCE_LEVELS.map((level) => {
          const selected = experience === level.id;
          return (
            <button
              key={level.id}
              onClick={() => setExperience(level.id)}
              className={`flex items-center gap-4 p-4 rounded-lg border text-left transition-all ${
                selected
                  ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <div className={`rounded-xl p-3 ${level.color}`}>
                <level.icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">{level.label}</p>
                <p className="text-sm text-muted-foreground">{level.desc}</p>
              </div>
              <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${selected ? "border-primary bg-primary" : "border-muted-foreground/30"}`}>
                {selected && <Check className="h-3 w-3 text-primary-foreground" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>,

    // Step 3: Focus areas + targets
    <div key="areas" className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Pick your focus & set targets</h2>
        <p className="text-muted-foreground">Select areas and choose daily goals</p>
      </div>
      <div className="grid gap-3">
        {FOCUS_AREAS.map((area) => {
          const selected = selectedAreas.includes(area.id);
          const config = DAILY_TARGETS[area.id];
          return (
            <div key={area.id} className={`rounded-lg border transition-all ${
              selected ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border"
            }`}>
              <button
                onClick={() => toggleArea(area.id)}
                className="flex items-start gap-3 p-4 w-full text-left"
              >
                <div className={`mt-0.5 rounded-md p-2 ${selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  <area.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{area.label}</p>
                  <p className="text-xs text-muted-foreground">{area.desc}</p>
                </div>
                <Checkbox checked={selected} className="mt-1 pointer-events-none" />
              </button>
              {selected && config && (
                <div className="px-4 pb-3 flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground">{config.label}:</span>
                  {config.options.map((opt) => {
                    const isActive = getTarget(area.id) === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => setTargets({ ...targets, [area.id]: opt })}
                        className={`text-xs px-3 py-1 rounded-full transition-colors ${
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-accent"
                        }`}
                      >
                        {opt} {config.unit}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>,

    // Step 4: Ready
    <div key="ready" className="space-y-6 text-center">
      <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
        <Check className="h-8 w-8 text-primary" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">You're all set{name ? `, ${name}` : ""}!</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          {selectedAreas.length} focus area{selectedAreas.length !== 1 ? "s" : ""} configured as a{" "}
          <span className="font-medium text-foreground">{EXPERIENCE_LEVELS.find(l => l.id === experience)?.label}</span>.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {selectedAreas.map((id) => {
          const area = FOCUS_AREAS.find((a) => a.id === id);
          if (!area) return null;
          const config = DAILY_TARGETS[id];
          return (
            <span key={id} className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-sm font-medium">
              <area.icon className="h-3.5 w-3.5" />
              {area.label} · {getTarget(id)} {config?.unit}
            </span>
          );
        })}
      </div>
    </div>,
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-lg space-y-8">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Step {step + 1} of {totalSteps}</span>
            <span>{Math.round(((step + 1) / totalSteps) * 100)}%</span>
          </div>
          <Progress value={((step + 1) / totalSteps) * 100} className="h-1.5" />
        </div>

        {/* Content */}
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-8 pb-6 px-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {steps[step]}
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>

          {step < totalSteps - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)}>
              Next <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={finish} disabled={saving}>
              {saving ? "Setting up…" : "Let's Go!"} <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
