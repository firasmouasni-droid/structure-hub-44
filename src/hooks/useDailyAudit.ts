import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface DailyAudit {
  id: string;
  user_id: string | null;
  audit_date: string;
  energy_level: number;
  mental_clarity: string;
  mood: string;
  distraction_level: string;
  day_objective: string;
  cognitive_availability: string;
  created_at: string;
  updated_at: string;
}

export interface AuditSettings {
  id: string;
  user_id: string | null;
  enabled: boolean;
  audit_hour: number;
  created_at: string;
}

export function useTodayAudit() {
  const { user } = useAuth();
  const today = new Date().toISOString().split("T")[0];
  return useQuery({
    queryKey: ["daily_audit", today, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("daily_audits")
        .select("*")
        .eq("audit_date", today)
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data as DailyAudit | null;
    },
    enabled: !!user,
  });
}

export function useAuditHistory(limit = 14) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["daily_audits_history", limit, user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("daily_audits")
        .select("*")
        .eq("user_id", user.id)
        .order("audit_date", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as DailyAudit[];
    },
    enabled: !!user,
  });
}

export function useSubmitAudit() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (audit: Omit<DailyAudit, "id" | "user_id" | "created_at" | "updated_at">) => {
      if (!user) throw new Error("Not authenticated");
      const payload = { ...audit, user_id: user.id };
      const { data, error } = await supabase
        .from("daily_audits")
        .upsert(payload, { onConflict: "user_id,audit_date" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["daily_audit"] });
      qc.invalidateQueries({ queryKey: ["daily_audits_history"] });
    },
  });
}

export function useAuditSettings() {
  return useQuery({
    queryKey: ["audit_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_settings")
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return data as AuditSettings | null;
    },
  });
}

export function useUpdateAuditSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (settings: { enabled: boolean; audit_hour: number }) => {
      // Try update first, then insert
      const { data: existing } = await supabase.from("audit_settings").select("id").maybeSingle();
      if (existing) {
        const { data, error } = await supabase.from("audit_settings").update(settings).eq("id", existing.id).select().single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase.from("audit_settings").insert(settings).select().single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["audit_settings"] }),
  });
}

/** Convert audit to autoplan adaptation rules */
export function getAuditAdaptation(audit: DailyAudit) {
  const rules: {
    maxDeepWorkMin: number;
    blockDurationMode: "short" | "normal" | "long";
    capacityMultiplier: number;
    priorityMode: "impact" | "easy_first" | "normal" | "low_friction";
    planningNote: string;
  } = {
    maxDeepWorkMin: 120,
    blockDurationMode: "normal",
    capacityMultiplier: 1.0,
    priorityMode: "normal",
    planningNote: "",
  };

  // 1. Energy level
  if (audit.energy_level >= 4) {
    rules.maxDeepWorkMin = 240;
    rules.planningNote += "Énergie haute → deep work prolongé. ";
  } else if (audit.energy_level >= 3) {
    rules.maxDeepWorkMin = 120;
  } else {
    rules.maxDeepWorkMin = 60;
    rules.planningNote += "Énergie basse → deep work limité à 1h. ";
  }

  // 2. Mental clarity
  if (audit.mental_clarity === "fog") {
    rules.priorityMode = "easy_first";
    rules.planningNote += "Brume mentale → tâches simples d'abord. ";
  } else if (audit.mental_clarity === "clear") {
    rules.priorityMode = "impact";
    rules.planningNote += "Clarté mentale → tâches importantes dès le matin. ";
  }

  // 3. Mood
  if (audit.mood === "stressed" || audit.mood === "anxious") {
    rules.capacityMultiplier = 0.7;
    rules.priorityMode = "easy_first";
    rules.planningNote += "Stress/anxiété → planning allégé, tâches admin simples. ";
  } else if (audit.mood === "motivated") {
    rules.priorityMode = "impact";
    rules.planningNote += "Motivé → priorités à fort impact. ";
  }

  // 4. Distraction
  if (audit.distraction_level === "distracted" || audit.distraction_level === "scattered") {
    rules.blockDurationMode = "short";
    rules.planningNote += "Distractible → blocs courts Pomodoro. ";
  } else if (audit.distraction_level === "focus") {
    rules.blockDurationMode = "long";
    rules.planningNote += "Bonne concentration → blocs longs 60-90 min. ";
  }

  // 5. Day objective
  if (audit.day_objective === "productivity") {
    rules.priorityMode = "impact";
  } else if (audit.day_objective === "recovery") {
    rules.capacityMultiplier = 0.5;
    rules.planningNote += "Mode récupération → planning à 50%. ";
  } else if (audit.day_objective === "slow") {
    rules.priorityMode = "low_friction";
    rules.planningNote += "Avancer tranquillement → next actions simples. ";
  }

  // 6. Cognitive availability
  if (audit.cognitive_availability === "<2h") {
    rules.maxDeepWorkMin = Math.min(rules.maxDeepWorkMin, 60);
    rules.capacityMultiplier = Math.min(rules.capacityMultiplier, 0.5);
    rules.planningNote += "Dispo cognitive <2h → 1 tâche importante max. ";
  } else if (audit.cognitive_availability === ">4h") {
    rules.maxDeepWorkMin = Math.max(rules.maxDeepWorkMin, 240);
    rules.planningNote += "Dispo cognitive >4h → deep work renforcé. ";
  }

  return rules;
}
