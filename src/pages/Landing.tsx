import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Moon, BookOpen, Clock, Flame, Users, Sparkles, ChevronRight, Star } from "lucide-react";
import { motion, type Easing } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as Easing },
  }),
};

const FEATURES = [
  {
    icon: BookOpen,
    title: "Qur'an Memorisation",
    desc: "Track every ayah with spaced repetition, audio playback, and AI-powered explanations.",
  },
  {
    icon: Moon,
    title: "Salah & Dhikr",
    desc: "Log your five daily prayers and dhikr with beautiful counters and streak tracking.",
  },
  {
    icon: Clock,
    title: "Deen Time Tracker",
    desc: "Measure how much of your day is devoted to your deen — set goals and stay consistent.",
  },
  {
    icon: Flame,
    title: "Streaks & Milestones",
    desc: "Build daily habits with streak counters, achievements, and weekly progress insights.",
  },
  {
    icon: Users,
    title: "Accountability Partners",
    desc: "Find a partner or invite a friend — compare weekly progress and motivate each other.",
  },
  {
    icon: Sparkles,
    title: "AI Deen Coach",
    desc: "Get personalised Islamic guidance, tafsir, and daily motivation powered by AI.",
  },
];

const TESTIMONIALS = [
  {
    name: "Ahmed R.",
    text: "Deen Tracker transformed my Quran memorisation journey. The spaced repetition alone is worth it.",
    stars: 5,
  },
  {
    name: "Fatima K.",
    text: "Having an accountability partner keeps me consistent. I haven't missed Fajr in 3 months!",
    stars: 5,
  },
  {
    name: "Omar S.",
    text: "The AI Coach gives thoughtful, relevant advice. It's like having a knowledgeable friend always available.",
    stars: 5,
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <Moon className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-semibold">Deen Tracker</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/auth?signup=true">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
              <Sparkles className="h-3 w-3" /> Your complete Islamic growth companion
            </span>
          </motion.div>

          <motion.h1
            className="font-display text-4xl sm:text-5xl md:text-6xl font-bold leading-tight tracking-tight"
            initial="hidden" animate="visible" variants={fadeUp} custom={1}
          >
            Grow closer to Allah,{" "}
            <span className="text-primary">one day at a time</span>
          </motion.h1>

          <motion.p
            className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            initial="hidden" animate="visible" variants={fadeUp} custom={2}
          >
            Track your Quran memorisation, prayers, fasting, and daily habits.
            Get AI-powered guidance and stay accountable with a partner —
            all in one beautiful, private space.
          </motion.p>

          <motion.div
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            initial="hidden" animate="visible" variants={fadeUp} custom={3}
          >
            <Link to="/auth?signup=true">
              <Button size="lg" className="text-base px-8 h-12">
                Start Your Journey <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
            <a href="#features">
              <Button variant="outline" size="lg" className="text-base px-8 h-12">
                See Features
              </Button>
            </a>
          </motion.div>

          {/* Stats bar */}
          <motion.div
            className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto"
            initial="hidden" animate="visible" variants={fadeUp} custom={4}
          >
            {[
              { value: "6,236", label: "Ayahs tracked" },
              { value: "114", label: "Surahs" },
              { value: "∞", label: "Hasanat, inshaAllah" },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-display font-bold text-primary">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6 bg-card/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-bold">Everything you need for your deen</h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              A comprehensive suite of tools designed to help you build consistency in your worship and grow spiritually.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                className="group p-6 rounded-xl border border-border/50 bg-background hover:border-primary/30 transition-colors"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={fadeUp}
                custom={i}
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-bold">Simple. Private. Effective.</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Sign up in seconds", desc: "Create your free account — no credit card, no data sharing." },
              { step: "02", title: "Set your goals", desc: "Choose what to track: Quran, prayers, fasting, books, time, or all of them." },
              { step: "03", title: "Build your streak", desc: "Log daily, earn achievements, and watch your growth over weeks and months." },
            ].map((s, i) => (
              <motion.div
                key={s.step}
                className="text-center"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
              >
                <div className="text-4xl font-display font-bold text-primary/20 mb-3">{s.step}</div>
                <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6 bg-card/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-bold">Loved by the ummah</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                className="p-6 rounded-xl border border-border/50 bg-background"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
              >
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-warning text-warning" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">"{t.text}"</p>
                <p className="text-sm font-medium">{t.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
            Ready to transform your daily worship?
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
            Join thousands of Muslims using Deen Tracker to build consistency, track progress, and grow spiritually.
          </p>
          <Link to="/auth?signup=true">
            <Button size="lg" className="text-base px-10 h-12">
              Get Started — It's Free <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Moon className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Deen Tracker</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Built with love for the ummah. Your data is private and encrypted.
          </p>
        </div>
      </footer>
    </div>
  );
}
