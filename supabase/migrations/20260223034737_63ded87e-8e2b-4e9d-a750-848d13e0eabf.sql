
-- 1. partner_requests table
CREATE TABLE public.partner_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  message text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.partner_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own requests"
  ON public.partner_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users create requests"
  ON public.partner_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Receiver can update requests"
  ON public.partner_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiver_id);

-- 2. accountability_circles table
CREATE TABLE public.accountability_circles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_by uuid NOT NULL,
  invite_code text NOT NULL UNIQUE,
  max_members integer NOT NULL DEFAULT 7,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.accountability_circles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read circles"
  ON public.accountability_circles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users create circles"
  ON public.accountability_circles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creator can update circle"
  ON public.accountability_circles FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

-- 3. circle_members table
CREATE TABLE public.circle_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id uuid NOT NULL REFERENCES public.accountability_circles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(circle_id, user_id)
);
ALTER TABLE public.circle_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read circle members"
  ON public.circle_members FOR SELECT
  TO authenticated
  USING (circle_id IN (SELECT circle_id FROM public.circle_members WHERE user_id = auth.uid()));

CREATE POLICY "Users join circles"
  ON public.circle_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users leave circles"
  ON public.circle_members FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 4. partner_messages table
CREATE TABLE public.partner_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partnership_id uuid REFERENCES public.accountability_partners(id) ON DELETE CASCADE,
  circle_id uuid REFERENCES public.accountability_circles(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.partner_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partnership message access"
  ON public.partner_messages FOR SELECT
  TO authenticated
  USING (
    (partnership_id IS NOT NULL AND partnership_id IN (
      SELECT id FROM public.accountability_partners
      WHERE (user_id = auth.uid() OR partner_id = auth.uid()) AND status = 'active'
    ))
    OR
    (circle_id IS NOT NULL AND circle_id IN (
      SELECT circle_id FROM public.circle_members WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY "Send messages"
  ON public.partner_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND (
      (partnership_id IS NOT NULL AND partnership_id IN (
        SELECT id FROM public.accountability_partners
        WHERE (user_id = auth.uid() OR partner_id = auth.uid()) AND status = 'active'
      ))
      OR
      (circle_id IS NOT NULL AND circle_id IN (
        SELECT circle_id FROM public.circle_members WHERE user_id = auth.uid()
      ))
    )
  );

-- 5. Add win/loss columns to accountability_partners
ALTER TABLE public.accountability_partners
  ADD COLUMN IF NOT EXISTS user_wins integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS partner_wins integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ties integer NOT NULL DEFAULT 0;

-- 6. Update weekly_snapshots RLS to also allow circle members to read each other's snapshots
DROP POLICY IF EXISTS "Users manage own snapshots" ON public.weekly_snapshots;

CREATE POLICY "Users manage own snapshots"
  ON public.weekly_snapshots FOR ALL
  TO authenticated
  USING (
    auth.uid() = user_id
    OR user_id IN (
      SELECT partner_id FROM accountability_partners WHERE user_id = auth.uid() AND status = 'active'
      UNION
      SELECT user_id FROM accountability_partners WHERE partner_id = auth.uid() AND status = 'active'
    )
    OR user_id IN (
      SELECT cm2.user_id FROM circle_members cm1
      JOIN circle_members cm2 ON cm1.circle_id = cm2.circle_id
      WHERE cm1.user_id = auth.uid()
    )
  )
  WITH CHECK (auth.uid() = user_id);
