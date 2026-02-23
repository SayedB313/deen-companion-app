import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
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

const FEATURE_KEYS = [
  { icon: BookOpen, titleKey: "landing.quranMemorisation", descKey: "landing.quranMemorisationDesc" },
  { icon: Moon, titleKey: "landing.salahDhikr", descKey: "landing.salahDhikrDesc" },
  { icon: Clock, titleKey: "landing.deenTimeTracker", descKey: "landing.deenTimeTrackerDesc" },
  { icon: Flame, titleKey: "landing.streaksMilestones", descKey: "landing.streaksMilestonesDesc" },
  { icon: Users, titleKey: "landing.accountability", descKey: "landing.accountabilityDesc" },
  { icon: Sparkles, titleKey: "landing.aiDeenCoach", descKey: "landing.aiDeenCoachDesc" },
];

const COMPARISON_KEYS = [
  "Salah tracking with On Time/Late/Missed",
  "Qur'an reading mode with bookmarks",
  "Dhikr focus mode with haptic feedback",
  "Spaced repetition for hifz",
  "Islamic AI Coach",
  "Fasting & Sunnah day tracking",
  "Accountability partners & circles",
];

const COMPARISON = [
  ...COMPARISON_KEYS.map(f => ({ feature: f, us: true, them: false })),
  { feature: "Habit tracking", us: true, them: true },
  { feature: "Progress charts", us: true, them: true },
];

export default function Landing() {
  const { t } = useTranslation();

  const STEPS = [
    { step: "01", titleKey: "landing.step01Title", descKey: "landing.step01Desc", icon: "🔐" },
    { step: "02", titleKey: "landing.step02Title", descKey: "landing.step02Desc", icon: "🎯" },
    { step: "03", titleKey: "landing.step03Title", descKey: "landing.step03Desc", icon: "🔥" },
  ];

  const TESTIMONIALS = [
    { nameKey: "landing.testimonial1Name", textKey: "landing.testimonial1Text" },
    { nameKey: "landing.testimonial2Name", textKey: "landing.testimonial2Text" },
    { nameKey: "landing.testimonial3Name", textKey: "landing.testimonial3Text" },
  ];

  const FAQ = [
    { qKey: "landing.faq1Q", aKey: "landing.faq1A" },
    { qKey: "landing.faq2Q", aKey: "landing.faq2A" },
    { qKey: "landing.faq3Q", aKey: "landing.faq3A" },
    { qKey: "landing.faq4Q", aKey: "landing.faq4A" },
    { qKey: "landing.faq5Q", aKey: "landing.faq5A" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <Moon className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-semibold">{t('app.name')}</span>
          </Link>
          <div className="flex items-center gap-3">
            <a href="#features" className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors">{t('landing.seeFeatures')}</a>
            <a href="#faq" className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
            <Link to="/auth">
              <Button variant="ghost" size="sm">{t('landing.signIn')}</Button>
            </Link>
            <Link to="/auth?signup=true">
              <Button size="sm">{t('landing.getStarted')}</Button>
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
            <Sparkles className="h-3.5 w-3.5" /> {t('landing.tagline')}
          </motion.div>

          <motion.h1
            className="font-display text-4xl sm:text-5xl md:text-6xl font-bold leading-tight tracking-tight"
            initial="hidden" animate="visible" variants={fadeUp} custom={0}
          >
            {t('landing.heroTitle')}{" "}
            <span className="text-primary">{t('landing.heroHighlight')}</span>
          </motion.h1>

          <motion.p
            className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed"
            initial="hidden" animate="visible" variants={fadeUp} custom={1}
          >
            {t('landing.heroDesc')}
          </motion.p>

          <motion.div
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3"
            initial="hidden" animate="visible" variants={fadeUp} custom={2}
          >
            <Link to="/auth?signup=true">
              <Button size="lg" className="text-base px-8 h-12">{t('landing.getStarted')}</Button>
            </Link>
            <a href="#features">
              <Button variant="outline" size="lg" className="text-base px-8 h-12">{t('landing.seeFeatures')}</Button>
            </a>
          </motion.div>

          <motion.div
            className="mt-10 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground"
            initial="hidden" animate="visible" variants={fadeUp} custom={3}
          >
            <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /> {t('landing.encryptedPrivate')}</span>
            <span className="flex items-center gap-1.5"><Smartphone className="h-3.5 w-3.5" /> {t('landing.worksOffline')}</span>
            <span className="flex items-center gap-1.5"><Star className="h-3.5 w-3.5" /> {t('landing.free')}</span>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6 bg-card/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-bold">{t('landing.featuresTitle')}</h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">{t('landing.featuresDesc')}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURE_KEYS.map((f, i) => (
              <motion.div
                key={f.titleKey}
                className="group p-6 rounded-xl border border-border/50 bg-background hover:border-primary/30 transition-colors"
                initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeUp} custom={i}
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{t(f.titleKey)}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t(f.descKey)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-bold">{t('landing.stepsTitle')}</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {STEPS.map((s, i) => (
              <motion.div key={s.step} className="text-center" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                <div className="text-4xl mb-3">{s.icon}</div>
                <div className="text-xs font-bold text-primary mb-2">STEP {s.step}</div>
                <h3 className="font-semibold text-lg mb-2">{t(s.titleKey)}</h3>
                <p className="text-sm text-muted-foreground">{t(s.descKey)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 px-6 bg-card/50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold">{t('landing.whyTitle')}</h2>
            <p className="mt-4 text-muted-foreground">{t('landing.whyDesc')}</p>
          </div>
          <motion.div className="rounded-xl border border-border/50 bg-background overflow-hidden" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <div className="grid grid-cols-[1fr,80px,80px] sm:grid-cols-[1fr,120px,120px] text-sm">
              <div className="p-3 font-medium border-b border-border/50 bg-muted/30">{t('landing.feature')}</div>
              <div className="p-3 font-medium border-b border-border/50 bg-muted/30 text-center text-primary">{t('landing.us')}</div>
              <div className="p-3 font-medium border-b border-border/50 bg-muted/30 text-center text-muted-foreground">{t('landing.others')}</div>
              {COMPARISON.map((row, i) => (
                <div key={i} className="contents">
                  <div className="p-3 border-b border-border/30 text-sm">{row.feature}</div>
                  <div className="p-3 border-b border-border/30 flex justify-center">
                    {row.us ? <Check className="h-4 w-4 text-success" /> : <X className="h-4 w-4 text-muted-foreground/30" />}
                  </div>
                  <div className="p-3 border-b border-border/30 flex justify-center">
                    {row.them ? <Check className="h-4 w-4 text-muted-foreground" /> : <X className="h-4 w-4 text-muted-foreground/30" />}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-bold">{t('landing.lovedTitle')}</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {TESTIMONIALS.map((item, i) => (
              <motion.div key={item.nameKey} className="p-6 rounded-xl border border-border/50 bg-card" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-warning text-warning" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">"{t(item.textKey)}"</p>
                <p className="text-sm font-medium">{t(item.nameKey)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-6 bg-card/50">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold">{t('landing.faqTitle')}</h2>
          </div>
          <Accordion type="single" collapsible className="space-y-2">
            {FAQ.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border border-border/50 rounded-lg px-4 bg-background">
                <AccordionTrigger className="text-sm font-medium hover:no-underline">{t(item.qKey)}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">{t(item.aKey)}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">{t('landing.ctaTitle')}</h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">{t('landing.ctaDesc')}</p>
          <Link to="/auth?signup=true">
            <Button size="lg" className="text-base px-10 h-12">
              {t('landing.ctaButton')} <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Moon className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{t('app.name')}</span>
          </div>
          <p className="text-xs text-muted-foreground">{t('landing.footerTagline')}</p>
        </div>
      </footer>
    </div>
  );
}
