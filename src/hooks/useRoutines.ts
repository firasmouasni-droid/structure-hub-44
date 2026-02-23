import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface RoutineBlock {
  type: string;
  start: string;
  end: string;
  label: string;
  days?: string[];
}

export interface Routine {
  id: string;
  structure_id: string | null;
  user_id: string | null;
  routine_type: string;
  name: string | null;
  description: string | null;
  organization_mode: string | null;
  blocks: RoutineBlock[];
  is_active: boolean;
  morning_focus: Record<string, unknown>;
  afternoon_tasks: Record<string, unknown>;
  email_slots: string[];
  availability_rules: Record<string, unknown>;
  created_at: string;
}

export const ROUTINE_TEMPLATES: Record<string, {
  name: string;
  description: string;
  icon: string;
  mode: string;
  tags: string[];
  blocks: RoutineBlock[];
  email_slots: string[];
  science: string;
}> = {
  deep_work_morning: {
    name: "Deep Work Matin",
    description: "Focus intense le matin, meetings l'après-midi. Basé sur les travaux de Cal Newport.",
    icon: "🧠",
    mode: "classic",
    tags: ["Concentration", "Productivité", "Cal Newport"],
    science: "Le cortisol matinal (8h-12h) favorise la concentration profonde. 3h de deep work = plus que 8h de travail fragmenté.",
    blocks: [
      { type: "deep_work", start: "09:00", end: "12:00", label: "Deep Work" },
      { type: "break", start: "12:00", end: "13:00", label: "Pause déjeuner" },
      { type: "admin", start: "13:00", end: "14:00", label: "Admin & emails" },
      { type: "meetings", start: "14:00", end: "17:00", label: "Réunions & collaboratif" },
    ],
    email_slots: ["08:30", "12:00", "14:00", "17:00"],
  },
  deep_work_afternoon: {
    name: "Deep Work Après-midi",
    description: "Matin léger, concentration profonde l'après-midi. Idéal pour les chronotypes tardifs.",
    icon: "🌙",
    mode: "nocturnal",
    tags: ["Chronotype tardif", "Créatifs", "Flexibilité"],
    science: "15-20% des gens ont un pic cognitif l'après-midi. Respecter son chronotype augmente la productivité de 26%.",
    blocks: [
      { type: "admin", start: "09:00", end: "11:00", label: "Admin & emails" },
      { type: "meetings", start: "11:00", end: "12:30", label: "Réunions" },
      { type: "break", start: "12:30", end: "13:30", label: "Pause déjeuner" },
      { type: "deep_work", start: "13:30", end: "16:30", label: "Deep Work" },
      { type: "admin", start: "16:30", end: "17:30", label: "Wrap-up" },
    ],
    email_slots: ["09:00", "12:30", "17:00"],
  },
  dual_blocks: {
    name: "Dual Blocks",
    description: "2 sessions de focus par jour (90 min chacune). Bon compromis pour les managers créatifs.",
    icon: "⚡",
    mode: "intensive",
    tags: ["2 sessions", "Managers", "Équilibré"],
    science: "Les cycles ultradiens de 90 min correspondent au rythme naturel de l'attention. 2 blocs = 3h de deep work sans fatigue.",
    blocks: [
      { type: "deep_work", start: "09:00", end: "10:30", label: "Deep Work #1" },
      { type: "admin", start: "10:30", end: "12:00", label: "Emails & admin" },
      { type: "break", start: "12:00", end: "13:00", label: "Pause déjeuner" },
      { type: "meetings", start: "13:00", end: "14:00", label: "Réunions" },
      { type: "deep_work", start: "14:00", end: "15:30", label: "Deep Work #2" },
      { type: "admin", start: "15:30", end: "17:00", label: "Tâches variées" },
    ],
    email_slots: ["08:45", "12:00", "15:30", "17:00"],
  },
  pomodoro: {
    name: "Pomodoro Évolué",
    description: "Blocs courts de 25-50 min avec pauses. Idéal TDAH, procrastinateurs, esprits dispersés.",
    icon: "🍅",
    mode: "chaotic",
    tags: ["TDAH", "Blocs courts", "Anti-procrastination"],
    science: "La technique Pomodoro combat la procrastination par des engagements courts. Efficacité prouvée chez les profils TDAH (+40% de tâches complétées).",
    blocks: [
      { type: "deep_work", start: "09:00", end: "09:50", label: "Pomodoro 1 (50 min)" },
      { type: "break", start: "09:50", end: "10:00", label: "Pause" },
      { type: "deep_work", start: "10:00", end: "10:50", label: "Pomodoro 2 (50 min)" },
      { type: "break", start: "10:50", end: "11:10", label: "Grande pause" },
      { type: "deep_work", start: "11:10", end: "12:00", label: "Pomodoro 3 (50 min)" },
      { type: "break", start: "12:00", end: "13:00", label: "Pause déjeuner" },
      { type: "admin", start: "13:00", end: "13:50", label: "Pomodoro Admin" },
      { type: "break", start: "13:50", end: "14:00", label: "Pause" },
      { type: "meetings", start: "14:00", end: "15:00", label: "Réunions" },
      { type: "deep_work", start: "15:00", end: "15:50", label: "Pomodoro 4" },
      { type: "admin", start: "16:00", end: "17:00", label: "Wrap-up" },
    ],
    email_slots: ["09:00", "12:00", "16:00"],
  },
  time_boxing: {
    name: "Time-Boxing Complet",
    description: "Chaque heure est assignée à une catégorie. Structure ultra-rigide pour les très organisés.",
    icon: "📦",
    mode: "classic",
    tags: ["Ultra-structuré", "Prévisible", "Elon Musk"],
    science: "Le time-boxing élimine la 'paralysie du choix'. Réduit le temps de décision de 75% et augmente le sentiment de contrôle.",
    blocks: [
      { type: "admin", start: "08:00", end: "09:00", label: "Emails & planification" },
      { type: "deep_work", start: "09:00", end: "11:00", label: "Projets stratégiques" },
      { type: "meetings", start: "11:00", end: "12:00", label: "Réunions" },
      { type: "break", start: "12:00", end: "13:00", label: "Pause déjeuner" },
      { type: "admin", start: "13:00", end: "14:00", label: "Admin & suivi" },
      { type: "deep_work", start: "14:00", end: "15:30", label: "Travail de fond" },
      { type: "meetings", start: "15:30", end: "16:30", label: "Réunions & appels" },
      { type: "admin", start: "16:30", end: "17:30", label: "Review & emails" },
    ],
    email_slots: ["08:00", "13:00", "16:30"],
  },
  energy_based: {
    name: "Basé sur l'Énergie",
    description: "L'IA ajuste le planning selon votre niveau d'énergie du jour. Adaptatif et bienveillant.",
    icon: "🔋",
    mode: "energy",
    tags: ["Adaptatif", "Énergie", "Bienveillant"],
    science: "L'énergie cognitive varie de 40% selon les jours. Adapter les tâches au niveau d'énergie augmente la productivité de 31%.",
    blocks: [
      { type: "deep_work", start: "09:00", end: "11:00", label: "Tâches haute énergie" },
      { type: "admin", start: "11:00", end: "12:00", label: "Tâches moyennes" },
      { type: "break", start: "12:00", end: "13:00", label: "Pause déjeuner" },
      { type: "admin", start: "13:00", end: "15:00", label: "Tâches basse énergie" },
      { type: "deep_work", start: "15:00", end: "16:30", label: "Second pic (si énergie)" },
      { type: "admin", start: "16:30", end: "17:30", label: "Follow-up & emails" },
    ],
    email_slots: ["09:00", "13:00", "17:00"],
  },
  minimalist: {
    name: "Minimaliste (Anti-burnout)",
    description: "1 tâche importante + 2 tâches simples. Parfait pour reprendre le contrôle progressivement.",
    icon: "🌿",
    mode: "minimalist",
    tags: ["Anti-burnout", "Désorganisés", "Progressif"],
    science: "La 'règle du 1-3-5' réduit l'anxiété décisionnelle. 80% des résultats viennent de 20% des tâches (loi de Pareto).",
    blocks: [
      { type: "deep_work", start: "09:30", end: "10:00", label: "Deep Work (30 min)" },
      { type: "admin", start: "10:00", end: "11:00", label: "1 tâche importante" },
      { type: "break", start: "11:00", end: "11:15", label: "Pause" },
      { type: "admin", start: "11:15", end: "12:00", label: "Emails" },
      { type: "break", start: "12:00", end: "13:30", label: "Pause déjeuner longue" },
      { type: "admin", start: "13:30", end: "15:00", label: "2 tâches simples" },
      { type: "admin", start: "15:00", end: "16:00", label: "Optionnel : extras" },
    ],
    email_slots: ["11:15", "16:00"],
  },
};

export const ORGANIZATION_MODES: Record<string, { name: string; description: string; icon: string; defaultRoutine: string }> = {
  classic: { name: "Classique", description: "Deep work matin, meetings après-midi", icon: "📋", defaultRoutine: "deep_work_morning" },
  intensive: { name: "Intensif", description: "2 sessions deep work par jour", icon: "🔥", defaultRoutine: "dual_blocks" },
  nocturnal: { name: "Nocturne", description: "Focus décalé en après-midi/soirée", icon: "🌙", defaultRoutine: "deep_work_afternoon" },
  manager: { name: "Manager", description: "Optimisé pour les réunions fréquentes", icon: "👔", defaultRoutine: "dual_blocks" },
  chaotic: { name: "Chaotique", description: "Pomodoro + micro-actions pour esprits dispersés", icon: "🌀", defaultRoutine: "pomodoro" },
  energy: { name: "Basé sur l'énergie", description: "S'adapte à votre niveau d'énergie du jour", icon: "🔋", defaultRoutine: "energy_based" },
  minimalist: { name: "Minimaliste", description: "Anti-burnout, progression douce", icon: "🌿", defaultRoutine: "minimalist" },
};

export function useRoutines() {
  return useQuery({
    queryKey: ["routines"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("routines")
        .select("*")
        .order("created_at");
      if (error) throw error;
      return data as unknown as Routine[];
    },
  });
}

export function useActiveRoutine() {
  const { data: routines = [] } = useRoutines();
  return routines.find(r => r.is_active && !r.structure_id) || routines.find(r => !r.structure_id) || null;
}

export function useCreateRoutine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (routine: Partial<Routine>) => {
      const { data, error } = await supabase
        .from("routines")
        .insert(routine as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["routines"] }),
  });
}

export function useUpdateRoutine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Routine> & { id: string }) => {
      const { data, error } = await supabase
        .from("routines")
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["routines"] }),
  });
}
