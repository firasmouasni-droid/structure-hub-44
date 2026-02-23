-- Add category column to tasks table with universal categories
ALTER TABLE public.tasks ADD COLUMN category text NOT NULL DEFAULT 'admin';

-- Add category column to calendar_events table
ALTER TABLE public.calendar_events ADD COLUMN category text NOT NULL DEFAULT 'focus';

-- Auto-map existing action_types to categories via a one-time update
UPDATE public.tasks SET category = CASE
  WHEN action_type IN ('WRITE', 'BUILD', 'LEARN') THEN 'focus'
  WHEN action_type IN ('MEETING') THEN 'meetings'
  WHEN action_type IN ('ADMIN', 'PLAN', 'REVIEW') THEN 'admin'
  WHEN action_type IN ('EMAIL', 'CALL') THEN 'communication'
  ELSE 'admin'
END;