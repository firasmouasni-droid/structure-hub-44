import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Badge {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  xp_reward: number;
  condition_type: string;
  condition_value: number;
}

export interface UserBadge {
  id: string;
  user_id: string | null;
  badge_id: string;
  earned_at: string;
}

export interface XPEvent {
  id: string;
  user_id: string | null;
  event_type: string;
  xp_amount: number;
  description: string | null;
  created_at: string;
}

// XP values for scientific behaviors (Self-Determination Theory)
export const XP_REWARDS = {
  task_completed: 10,
  deep_work_completed: 25,
  wip_under_limit: 15,
  email_batch_respected: 20,
  inbox_zero: 30,
  goal_completed: 50,
  streak_day: 5,
} as const;

export function useBadges() {
  return useQuery({
    queryKey: ["badges"],
    queryFn: async () => {
      const { data, error } = await supabase.from("badges").select("*").order("category, condition_value");
      if (error) throw error;
      return data as Badge[];
    },
  });
}

export function useUserBadges() {
  return useQuery({
    queryKey: ["user_badges"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_badges").select("*").order("earned_at", { ascending: false });
      if (error) throw error;
      return data as UserBadge[];
    },
  });
}

export function useXPEvents() {
  return useQuery({
    queryKey: ["xp_events"],
    queryFn: async () => {
      const { data, error } = await supabase.from("xp_events").select("*").order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return data as XPEvent[];
    },
  });
}

export function useLogXPEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ event_type, xp_amount, description }: { event_type: string; xp_amount: number; description?: string }) => {
      const { data, error } = await supabase.from("xp_events").insert({ event_type, xp_amount, description }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["xp_events"] }),
  });
}

export function useEarnBadge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (badgeId: string) => {
      // Check if already earned
      const { data: existing } = await supabase.from("user_badges").select("id").eq("badge_id", badgeId).maybeSingle();
      if (existing) return null; // Already earned
      const { data, error } = await supabase.from("user_badges").insert({ badge_id: badgeId }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data) qc.invalidateQueries({ queryKey: ["user_badges"] });
    },
  });
}

// Hook to check and award badges based on current stats
export function useCheckBadges() {
  const { data: badges = [] } = useBadges();
  const { data: userBadges = [] } = useUserBadges();
  const { data: xpEvents = [] } = useXPEvents();
  const earnBadge = useEarnBadge();
  const logXP = useLogXPEvent();
  const qc = useQueryClient();

  const earnedBadgeIds = new Set(userBadges.map(ub => ub.badge_id));

  const checkAndAward = async (conditionType: string, currentValue: number) => {
    const eligible = badges.filter(b =>
      b.condition_type === conditionType &&
      b.condition_value <= currentValue &&
      !earnedBadgeIds.has(b.id)
    );

    for (const badge of eligible) {
      const result = await earnBadge.mutateAsync(badge.id);
      if (result) {
        // Log XP event
        await logXP.mutateAsync({
          event_type: "badge_earned",
          xp_amount: badge.xp_reward,
          description: `Badge débloqué : ${badge.name}`,
        });
        // Increment user XP
        const { data: current } = await supabase.from("user_stats").select("*").order("created_at").limit(1).maybeSingle();
        if (current) {
          await supabase.from("user_stats").update({ xp: current.xp + badge.xp_reward }).eq("id", current.id);
          qc.invalidateQueries({ queryKey: ["user_stats"] });
        }
        toast.success(`${badge.icon} Badge débloqué : ${badge.name} (+${badge.xp_reward} XP)`);
      }
    }
  };

  return { checkAndAward };
}
