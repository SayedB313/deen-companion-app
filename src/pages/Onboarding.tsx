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
  ArrowRight, ArrowLeft, Check, Star,
} from "lucide-react";

const FOCUS_AREAS = [
  { id: "salah", label: "Salah Tracking", icon: Star, desc: "Track your 5 daily prayers" },
  { id: "quran", label: "Qur'an Memorisation", icon: BookOpen, desc: "Ayah-by-ayah hifz progress" },
  { id: "dhikr", label: "Dhikr & Adhkar", icon: Sparkles, desc: "Daily remembrance counters" },
  { id: "fasting", label: "Fasting", icon: Moon, desc: "Log sunnah & obligatory fasts" },
  { id: "time", label: "Deen Time Tracking", icon: Clock, desc: "Track time spent on deen" },
  { id: "character", label: "Character Growth", icon: Flame, desc: "Journal virtues & habits" },
];

const Onboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [selectedAreas, setSelectedAreas] = useState<string[]>(["salah", "quran"]);
  const [saving, setSaving] = useState(false);

  const toggleArea = (id: string) => {
    setSelectedAreas((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const finish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Save display name + mark onboarding complete
      await supabase
        .from("profiles")
        .update({
          display_name: name.trim() || null,
          onboarding_complete: true,
        })
        .eq("id", user.id);

      // Create default goals for selected areas
      const goalRows = selectedAreas.map((area) => ({
        user_id: user.id,
        area,
        period: "daily",
        target_value: 1,
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

    // Step 2: Focus areas
    <div key="areas" className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Pick your focus areas</h2>
        <p className="text-muted-foreground">Select what matters most to you right now</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {FOCUS_AREAS.map((area) => {
          const selected = selectedAreas.includes(area.id);
          return (
            <button
              key={area.id}
              onClick={() => toggleArea(area.id)}
              className={`flex items-start gap-3 p-4 rounded-lg border text-left transition-all ${
                selected
                  ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                  : "border-border hover:border-primary/40"
              }`}
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
          );
        })}
      </div>
    </div>,

    // Step 3: Ready
    <div key="ready" className="space-y-6 text-center">
      <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
        <Check className="h-8 w-8 text-primary" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">You're all set{name ? `, ${name}` : ""}!</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          We've set up {selectedAreas.length} focus area{selectedAreas.length !== 1 ? "s" : ""} for you.
          You can always change these in Settings.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {selectedAreas.map((id) => {
          const area = FOCUS_AREAS.find((a) => a.id === id);
          if (!area) return null;
          return (
            <span key={id} className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-sm font-medium">
              <area.icon className="h-3.5 w-3.5" />
              {area.label}
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
            <span>Step {step + 1} of {steps.length}</span>
            <span>{Math.round(((step + 1) / steps.length) * 100)}%</span>
          </div>
          <Progress value={((step + 1) / steps.length) * 100} className="h-1.5" />
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

          {step < steps.length - 1 ? (
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
