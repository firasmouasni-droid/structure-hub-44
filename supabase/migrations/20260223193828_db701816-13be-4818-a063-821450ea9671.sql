
-- Create life_spaces table for predefined life domains
CREATE TABLE public.life_spaces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '📦',
  color TEXT NOT NULL DEFAULT 'bg-primary',
  description TEXT,
  enabled BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.life_spaces ENABLE ROW LEVEL SECURITY;

-- Public read (predefined data)
CREATE POLICY "Public read life_spaces" ON public.life_spaces FOR SELECT USING (true);

-- Add life_space_id to structures (structures become sub-spaces of a life space)
ALTER TABLE public.structures ADD COLUMN life_space_id UUID REFERENCES public.life_spaces(id);

-- Seed the 8 predefined life spaces
INSERT INTO public.life_spaces (key, label, icon, color, description, enabled, sort_order) VALUES
  ('work', 'Travail', '💼', 'bg-primary', 'Projets professionnels, carrière et productivité', true, 1),
  ('family', 'Famille & Foyer', '👨‍👩‍👧', 'bg-secondary', 'Vie familiale, enfants et maison', false, 2),
  ('nutrition', 'Nutrition', '🥗', 'bg-success', 'Alimentation, repas et habitudes alimentaires', false, 3),
  ('health', 'Santé physique', '💪', 'bg-warning', 'Sport, exercice et condition physique', false, 4),
  ('wellbeing', 'Bien-être mental', '🧘', 'bg-accent', 'Méditation, relaxation et équilibre mental', false, 5),
  ('finance', 'Admin & Finances', '💰', 'bg-primary', 'Budget, factures et administration', false, 6),
  ('projects', 'Projets personnels', '🎯', 'bg-secondary', 'Side projects, apprentissage et créativité', false, 7),
  ('leisure', 'Loisirs & Social', '🎮', 'bg-accent', 'Hobbies, sorties et vie sociale', false, 8);
