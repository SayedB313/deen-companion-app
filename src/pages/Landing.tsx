import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Moon, BookOpen, Clock, Flame, Users, Sparkles, ChevronRight, Star, Check, X, Shield, Smartphone } from "lucide-react";
import { motion, type Easing } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as Easing },
  }),
};

const FEATURES = [
  { icon: BookOpen, title: "Qur'an Memorisation", desc: "Track every ayah with spaced repetition, reading mode with bookmarks, and AI explanations." },
  { icon: Moon, title: "Salah & Dhikr", desc: "Log prayers with on-time/late/missed tracking. Full-screen dhikr focus mode with haptic feedback." },
  { icon: Clock, title: "Deen Time Tracker", desc: "Measure how much of your day goes to deen. Set goals and see weekly trends." },
  { icon: Flame, title: "Streaks & Milestones", desc: "Build daily habits with streak counters, achievements, badges, and weekly insights." },
  { icon: Users, title: "Accountability", desc: "Partners, circles, chat, and friendly competition. Compare weekly progress." },
  { icon: Sparkles, title: "AI Deen Coach", desc: "Get personalised guidance, tafsir, and daily motivation powered by Islamic AI." },
];

const TESTIMONIALS = [
  { name: "Ahmed R.", text: "Deen Tracker transformed my Quran memorisation journey. The spaced repetition alone is worth it.", stars: 5 },
  { name: "Fatima K.", text: "Having an accountability partner keeps me consistent. I haven't missed Fajr in 3 months!", stars: 5 },
  { name: "Omar S.", text: "The AI Coach gives thoughtful, relevant advice. It's like having a knowledgeable friend always available.", stars: 5 },
];

const COMPARISON = [
  { feature: "Salah tracking with On Time/Late/Missed", us: true, them: false },
  { feature: "Qur'an reading mode with bookmarks", us: true, them: false },
  { feature: "Dhikr focus mode with haptic feedback", us: true, them: false },
  { feature: "Spaced repetition for hifz", us: true, them: false },
  { feature: "Islamic AI Coach", us: true, them: false },
  { feature: "Fasting & Sunnah day tracking", us: true, them: false },
  { feature: "Accountability partners & circles", us: true, them: false },
  { feature: "Habit tracking", us: true, them: true },
  { feature: "Progress charts", us: true, them: true },
];

const FAQ = [
  { q: "Is Deen Tracker free?", a: "Yes! Core features are completely free. We believe in making Islamic tools accessible to everyone." },
  { q: "Is my data private?", a: "Absolutely. Your data is encrypted and stored securely. We never sell or share your personal information with third parties." },
  { q: "Does it work offline?", a: "Yes, Deen Tracker is a Progressive Web App (PWA). Key features like dhikr counting and prayer logging work offline and sync when you're back online." },
  { q: "Can I use it on my phone?", a: "Yes! Install it as a PWA on iOS or Android for a native app-like experience. No app store needed." },
  { q: "How does the AI Coach work?", a: "Our AI Coach is trained on authentic Islamic sources and provides personalised guidance based on your goals and progress. It's like having a knowledgeable friend available 24/7." },
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
            <a href="#features" className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#faq" className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
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
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary mb-6"
            initial="hidden" animate="visible" variants={fadeUp} custom={0}
          >
            <Sparkles className="h-3.5 w-3.5" /> Your complete Islamic companion
          </motion.div>

          <motion.h1
            className="font-display text-4xl sm:text-5xl md:text-6xl font-bold leading-tight tracking-tight"
            initial="hidden" animate="visible" variants={fadeUp} custom={0}
          >
            Build a better deen,{" "}
            <span className="text-primary">every single day</span>
          </motion.h1>

          <motion.p
            className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed"
            initial="hidden" animate="visible" variants={fadeUp} custom={1}
          >
            Track Quran memorisation, prayers, fasting, dhikr, and more — all in one beautiful app designed for Muslims.
          </motion.p>

          <motion.div
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3"
            initial="hidden" animate="visible" variants={fadeUp} custom={2}
          >
            <Link to="/auth?signup=true">
              <Button size="lg" className="text-base px-8 h-12">
                Get Started — Free
              </Button>
            </Link>
            <a href="#features">
              <Button variant="outline" size="lg" className="text-base px-8 h-12">
                See Features
              </Button>
            </a>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            className="mt-10 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground"
            initial="hidden" animate="visible" variants={fadeUp} custom={3}
          >
            <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /> Encrypted & Private</span>
            <span className="flex items-center gap-1.5"><Smartphone className="h-3.5 w-3.5" /> Works Offline (PWA)</span>
            <span className="flex items-center gap-1.5"><Star className="h-3.5 w-3.5" /> 100% Free</span>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6 bg-card/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-bold">Everything you need for your deen</h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              A comprehensive suite of tools designed for consistency in worship and spiritual growth.
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
            <h2 className="font-display text-3xl sm:text-4xl font-bold">Get started in 3 steps</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Sign up in seconds", desc: "Create your free account — no credit card, no data sharing.", icon: "🔐" },
              { step: "02", title: "Set your goals", desc: "Choose focus areas and daily targets during onboarding.", icon: "🎯" },
              { step: "03", title: "Build your streak", desc: "Log daily, earn achievements, and watch your growth.", icon: "🔥" },
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
                <div className="text-4xl mb-3">{s.icon}</div>
                <div className="text-xs font-bold text-primary mb-2">STEP {s.step}</div>
                <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 px-6 bg-card/50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold">Why Deen Tracker?</h2>
            <p className="mt-4 text-muted-foreground">Generic habit apps don't understand your deen. We do.</p>
          </div>

          <motion.div
            className="rounded-xl border border-border/50 bg-background overflow-hidden"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <div className="grid grid-cols-[1fr,80px,80px] sm:grid-cols-[1fr,120px,120px] text-sm">
              <div className="p-3 font-medium border-b border-border/50 bg-muted/30">Feature</div>
              <div className="p-3 font-medium border-b border-border/50 bg-muted/30 text-center text-primary">Us</div>
              <div className="p-3 font-medium border-b border-border/50 bg-muted/30 text-center text-muted-foreground">Others</div>
              {COMPARISON.map((row, i) => (
                <>
                  <div key={`f-${i}`} className="p-3 border-b border-border/30 text-sm">{row.feature}</div>
                  <div key={`u-${i}`} className="p-3 border-b border-border/30 flex justify-center">
                    {row.us ? <Check className="h-4 w-4 text-success" /> : <X className="h-4 w-4 text-muted-foreground/30" />}
                  </div>
                  <div key={`t-${i}`} className="p-3 border-b border-border/30 flex justify-center">
                    {row.them ? <Check className="h-4 w-4 text-muted-foreground" /> : <X className="h-4 w-4 text-muted-foreground/30" />}
                  </div>
                </>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-bold">Loved by the ummah</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                className="p-6 rounded-xl border border-border/50 bg-card"
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

      {/* FAQ */}
      <section id="faq" className="py-20 px-6 bg-card/50">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold">Frequently Asked Questions</h2>
          </div>
          <Accordion type="single" collapsible className="space-y-2">
            {FAQ.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border border-border/50 rounded-lg px-4 bg-background">
                <AccordionTrigger className="text-sm font-medium hover:no-underline">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
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
