import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UserStats {
  id: string;
  user_id: string | null;
  xp: number;
  level: number;
  streak_days: number;
  last_activity_date: string | null;
  created_at: string;
}

export function useUserStats() {
  return useQuery({
    queryKey: ["user_stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_stats")
        .select("*")
        .order("created_at")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as UserStats | null;
    },
  });
}

export function useIncrementXP() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (amount: number = 10) => {
      // Get current stats
      const { data: current } = await supabase
        .from("user_stats")
        .select("*")
        .order("created_at")
        .limit(1)
        .maybeSingle();
      
      if (!current) return null;

      const today = new Date().toISOString().split("T")[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
      const newXP = current.xp + amount;
      const newLevel = Math.floor(newXP / 1000) + 1;
      const newStreak = current.last_activity_date === yesterday
        ? current.streak_days + 1
        : current.last_activity_date === today
          ? current.streak_days
          : 1;

      const { data, error } = await supabase
        .from("user_stats")
        .update({
          xp: newXP,
          level: newLevel,
          streak_days: newStreak,
          last_activity_date: today,
        })
        .eq("id", current.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user_stats"] }),
  });
}
