-- Salah (prayer) tracking table
CREATE TABLE public.salah_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  prayer TEXT NOT NULL, -- fajr, dhuhr, asr, maghrib, isha
  prayed BOOLEAN NOT NULL DEFAULT false,
  is_sunnah BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Unique constraint: one entry per user/date/prayer/sunnah combo
CREATE UNIQUE INDEX salah_logs_unique ON public.salah_logs (user_id, date, prayer, is_sunnah);

-- RLS
ALTER TABLE public.salah_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own salah logs"
  ON public.salah_logs
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Achievements / milestones gamification table
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_key TEXT NOT NULL, -- e.g. 'streak_7', 'streak_30', 'prayers_100'
  achieved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX achievements_unique ON public.achievements (user_id, achievement_key);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own achievements"
  ON public.achievements
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);