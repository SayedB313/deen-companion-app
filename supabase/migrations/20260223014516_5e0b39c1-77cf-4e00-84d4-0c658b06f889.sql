CREATE TABLE public.notification_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  push_enabled boolean NOT NULL DEFAULT false,
  streak_reminder boolean NOT NULL DEFAULT true,
  streak_reminder_time time NOT NULL DEFAULT '21:00',
  salah_reminders boolean NOT NULL DEFAULT false,
  quran_revision_reminder boolean NOT NULL DEFAULT true,
  fasting_reminders boolean NOT NULL DEFAULT false,
  weekly_report boolean NOT NULL DEFAULT true,
  motivational_quotes boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own notification preferences" ON public.notification_preferences
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);