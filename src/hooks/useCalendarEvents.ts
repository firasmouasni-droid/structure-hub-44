import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CalendarEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  structure_id: string | null;
  color: string | null;
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

export function useCalendarEventsRange(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["calendar_events", "range", startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("calendar_events")
        .select("*")
        .gte("start_time", `${startDate}T00:00:00`)
        .lte("start_time", `${endDate}T23:59:59`)
        .order("start_time");
      if (error) throw error;
      return data as CalendarEvent[];
    },
  });
}

export function useCalendarEventsByStructure(structureId: string, date?: string) {
  return useQuery({
    queryKey: ["calendar_events", structureId, date],
    queryFn: async () => {
      let query = supabase.from("calendar_events").select("*").eq("structure_id", structureId).order("start_time");
      if (date) {
        query = query.gte("start_time", `${date}T00:00:00`).lte("start_time", `${date}T23:59:59`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as CalendarEvent[];
    },
    enabled: !!structureId,
  });
}

export function useCalendarEventsByStructureRange(structureId: string, startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["calendar_events", structureId, "range", startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("calendar_events")
        .select("*")
        .eq("structure_id", structureId)
        .gte("start_time", `${startDate}T00:00:00`)
        .lte("start_time", `${endDate}T23:59:59`)
        .order("start_time");
      if (error) throw error;
      return data as CalendarEvent[];
    },
    enabled: !!structureId,
  });
}
