import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CalendarEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  structure_id: string | null;
  source: string;
  created_at: string;
}

export function useCalendarEvents(date?: string) {
  return useQuery({
    queryKey: ["calendar_events", date],
    queryFn: async () => {
      let query = supabase.from("calendar_events").select("*").order("start_time");
      if (date) {
        query = query.gte("start_time", `${date}T00:00:00`).lte("start_time", `${date}T23:59:59`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as CalendarEvent[];
    },
  });
}
