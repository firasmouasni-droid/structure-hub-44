import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const REMINDER_MINUTES = 15;
const POLL_INTERVAL_MS = 60_000; // check every minute

/**
 * Hook that polls upcoming calendar events and fires
 * both an in-app toast and a browser push notification
 * 15 minutes before each event starts.
 */
export function useEventReminders() {
  // Track which event IDs we already notified to avoid duplicates
  const notifiedRef = useRef<Set<string>>(new Set());

  const requestPermission = useCallback(async () => {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  }, []);

  const sendBrowserNotification = useCallback((title: string, body: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(title, {
          body,
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          tag: `event-reminder-${Date.now()}`,
        });
      } catch {
        // Silent fail for environments that block notifications
      }
    }
  }, []);

  const checkUpcomingEvents = useCallback(async () => {
    const now = new Date();
    const windowStart = new Date(now.getTime());
    const windowEnd = new Date(now.getTime() + REMINDER_MINUTES * 60_000 + 60_000);

    const { data: events } = await supabase
      .from("calendar_events")
      .select("id, title, start_time, category")
      .gte("start_time", windowStart.toISOString())
      .lte("start_time", windowEnd.toISOString())
      .order("start_time");

    if (!events) return;

    for (const event of events) {
      if (notifiedRef.current.has(event.id)) continue;

      const startTime = new Date(event.start_time);
      const diffMs = startTime.getTime() - now.getTime();
      const diffMin = Math.round(diffMs / 60_000);

      if (diffMin <= REMINDER_MINUTES && diffMin >= 0) {
        notifiedRef.current.add(event.id);

        const timeLabel = diffMin <= 1 ? "dans 1 minute" : `dans ${diffMin} min`;
        const body = `${event.title} commence ${timeLabel}`;

        // In-app toast
        toast("⏰ Rappel", {
          description: body,
          duration: 10_000,
        });

        // Browser push notification
        sendBrowserNotification("⏰ Rappel", body);
      }
    }
  }, [sendBrowserNotification]);

  useEffect(() => {
    // Request notification permission on mount
    requestPermission();

    // Initial check
    checkUpcomingEvents();

    // Poll every minute
    const interval = setInterval(checkUpcomingEvents, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [checkUpcomingEvents, requestPermission]);

  // Clean up old entries every hour to prevent memory leak
  useEffect(() => {
    const cleanup = setInterval(() => {
      if (notifiedRef.current.size > 100) {
        notifiedRef.current.clear();
      }
    }, 3_600_000);
    return () => clearInterval(cleanup);
  }, []);
}
