
-- Add Locke & Latham scientific fields to goals
ALTER TABLE public.goals
  ADD COLUMN IF NOT EXISTS kpi TEXT,
  ADD COLUMN IF NOT EXISTS kpi_unit TEXT,
  ADD COLUMN IF NOT EXISTS success_criteria TEXT,
  ADD COLUMN IF NOT EXISTS difficulty TEXT NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS parent_goal_id UUID REFERENCES public.goals(id);

-- Allow public delete on goals (for cleanup)
CREATE POLICY "Allow public delete goals"
  ON public.goals FOR DELETE USING (true);
