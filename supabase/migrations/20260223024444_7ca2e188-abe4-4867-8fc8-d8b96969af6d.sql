
CREATE TABLE public.ayah_revision_schedule (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  surah_id integer NOT NULL,
  ayah_number integer NOT NULL,
  last_reviewed date NOT NULL DEFAULT CURRENT_DATE,
  next_review date NOT NULL DEFAULT CURRENT_DATE,
  interval_days integer NOT NULL DEFAULT 1,
  ease_factor numeric NOT NULL DEFAULT 2.5,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, surah_id, ayah_number)
);

ALTER TABLE public.ayah_revision_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own ayah revision schedule"
  ON public.ayah_revision_schedule
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
