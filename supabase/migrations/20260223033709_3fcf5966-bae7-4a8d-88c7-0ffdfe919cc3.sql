
-- Partner discovery profiles for the community page
CREATE TABLE public.partner_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  display_name text NOT NULL,
  bio text,
  focus_areas text[] NOT NULL DEFAULT '{}',
  is_discoverable boolean NOT NULL DEFAULT true,
  current_streak integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_profiles ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read discoverable profiles
CREATE POLICY "Read discoverable profiles"
ON public.partner_profiles
FOR SELECT
TO authenticated
USING (is_discoverable = true OR auth.uid() = user_id);

-- Users manage their own profile
CREATE POLICY "Users manage own partner profile"
ON public.partner_profiles
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add a message field to accountability_partners for request messages
ALTER TABLE public.accountability_partners ADD COLUMN IF NOT EXISTS message text;
