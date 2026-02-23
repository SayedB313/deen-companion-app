
-- Revision schedule for spaced repetition of memorised surahs
CREATE TABLE public.revision_schedule (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  surah_id integer NOT NULL REFERENCES public.surahs(id),
  last_reviewed date NOT NULL DEFAULT CURRENT_DATE,
  next_review date NOT NULL DEFAULT CURRENT_DATE,
  interval_days integer NOT NULL DEFAULT 1,
  ease_factor numeric NOT NULL DEFAULT 2.5,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_revision_schedule_user_surah ON public.revision_schedule(user_id, surah_id);

ALTER TABLE public.revision_schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own revision schedule" ON public.revision_schedule FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Custom dhikr entries created by users
CREATE TABLE public.custom_dhikr (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  arabic text,
  default_target integer NOT NULL DEFAULT 33,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_dhikr ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own custom dhikr" ON public.custom_dhikr FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
