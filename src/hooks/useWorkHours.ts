import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface WorkHoursSettings {
  id: string;
  work_start: string;
  work_end: string;
  pause_start: string;
  pause_end: string;
}

export const DEFAULT_WORK_HOURS: Omit<WorkHoursSettings, "id"> = {
  work_start: "09:00",
  work_end: "18:00",
  pause_start: "12:00",
  pause_end: "13:00",
};

/** Parse "HH:MM" to { hour, min } */
export function parseTime(t: string): { hour: number; min: number } {
  const [h, m] = t.split(":").map(Number);
  return { hour: h, min: m };
}

/** Compute work blocks from settings (morning + afternoon, excluding pause) */
export function getWorkBlocks(settings: Omit<WorkHoursSettings, "id">) {
  const ws = parseTime(settings.work_start);
  const we = parseTime(settings.work_end);
  const ps = parseTime(settings.pause_start);
  const pe = parseTime(settings.pause_end);
  return [
    { startHour: ws.hour, startMin: ws.min, endHour: ps.hour, endMin: ps.min },
    { startHour: pe.hour, startMin: pe.min, endHour: we.hour, endMin: we.min },
  ];
}

export function useWorkHoursSettings() {
  return useQuery({
    queryKey: ["work_hours_settings"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("work_hours_settings")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as WorkHoursSettings | null;
    },
  });
}

export function useUpsertWorkHours() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (settings: Omit<WorkHoursSettings, "id"> & { id?: string }) => {
      if (settings.id) {
        const { data, error } = await (supabase as any)
          .from("work_hours_settings")
          .update({
            work_start: settings.work_start,
            work_end: settings.work_end,
            pause_start: settings.pause_start,
            pause_end: settings.pause_end,
          })
          .eq("id", settings.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await (supabase as any)
          .from("work_hours_settings")
          .insert({
            work_start: settings.work_start,
            work_end: settings.work_end,
            pause_start: settings.pause_start,
            pause_end: settings.pause_end,
          })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["work_hours_settings"] }),
  });
}
