
-- Add new columns to routines table for the routine catalog system
ALTER TABLE public.routines 
  ADD COLUMN IF NOT EXISTS routine_type text NOT NULL DEFAULT 'custom',
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS blocks jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS organization_mode text;

-- Add comment explaining blocks structure
COMMENT ON COLUMN public.routines.blocks IS 'Array of time blocks: [{type, start, end, label, days}]';
COMMENT ON COLUMN public.routines.routine_type IS 'Template key: deep_work_morning, deep_work_afternoon, dual_blocks, pomodoro, time_boxing, energy_based, minimalist, custom';
COMMENT ON COLUMN public.routines.organization_mode IS 'Organization mode: classic, intensive, nocturnal, manager, chaotic, energy, minimalist';
