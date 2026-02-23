
-- Accountability Partners table
CREATE TABLE public.accountability_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  partner_id uuid,
  invite_code text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.accountability_partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own partnerships"
ON public.accountability_partners
FOR ALL
TO authenticated
USING (auth.uid() = user_id OR auth.uid() = partner_id)
WITH CHECK (auth.uid() = user_id OR auth.uid() = partner_id);

-- Weekly Snapshots table
CREATE TABLE public.weekly_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  week_start date NOT NULL,
  prayers_logged integer NOT NULL DEFAULT 0,
  quran_ayahs_reviewed integer NOT NULL DEFAULT 0,
  dhikr_completed integer NOT NULL DEFAULT 0,
  fasting_days integer NOT NULL DEFAULT 0,
  streak_days integer NOT NULL DEFAULT 0,
  deen_minutes integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start)
);

ALTER TABLE public.weekly_snapshots ENABLE ROW LEVEL SECURITY;

-- Users can manage their own snapshots
CREATE POLICY "Users manage own snapshots"
ON public.weekly_snapshots
FOR ALL
TO authenticated
USING (
  auth.uid() = user_id
  OR user_id IN (
    SELECT partner_id FROM public.accountability_partners WHERE user_id = auth.uid() AND status = 'active'
    UNION
    SELECT user_id FROM public.accountability_partners WHERE partner_id = auth.uid() AND status = 'active'
  )
)
WITH CHECK (auth.uid() = user_id);
