import { useCalendarEvents, useCalendarEventsRange, useUpdateCalendarEvent, CalendarEvent } from "@/hooks/useCalendarEvents";
import { useTasks, useUpdateTask } from "@/hooks/useTasks";
import { useRoutines } from "@/hooks/useRoutines";
import { useWorkHoursSettings, useUpsertWorkHours, DEFAULT_WORK_HOURS, getWorkBlocks, parseTime } from "@/hooks/useWorkHours";
import { CalendarDays, Sparkles, Loader2, ChevronLeft, ChevronRight, Compass, Sun, Edit3, Clock, Settings } from "lucide-react";
import GuidedDayDialog from "@/components/guided/GuidedDayDialog";
import MorningAuditDialog from "@/components/audit/MorningAuditDialog";
import PlanningBlock from "@/components/planning/PlanningBlock";
import { CATEGORIES, CATEGORY_LIST, type TaskCategory, getCategoryColor } from "@/lib/categories";
import { useTodayAudit, useAuditSettings, getAuditAdaptation } from "@/hooks/useDailyAudit";
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay, eachDayOfInterval, isToday, getDay } from "date-fns";
import { fr } from "date-fns/locale";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageTransition, StaggerContainer, StaggerItem, HoverCard, FadeInSection } from "@/components/motion/MotionWrappers";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";

const SLOT_HEIGHT = 17; // px per 15-min slot
const HOUR_HEIGHT = SLOT_HEIGHT * 4; // 68px per hour
const START_HOUR = 7;
const END_HOUR = 21;
const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => i + START_HOUR);
const TABS = [
  { key: "today", label: "Aujourd'hui" },
  { key: "week", label: "Semaine" },
  { key: "month", label: "Mois" },
];

// ── Work hours types ──
type WorkBlock = { startHour: number; startMin: number; endHour: number; endMin: number };

/** Convert work block to absolute minutes from START_HOUR */
function workBlockToMinutes(block: WorkBlock) {
  return {
    start: (block.startHour - START_HOUR) * 60 + block.startMin,
    end: (block.endHour - START_HOUR) * 60 + block.endMin,
  };
}

/** Check if a range [startMin, endMin) fits entirely within work hours */
function isWithinWorkHours(startMin: number, endMin: number, workBlocks: WorkBlock[]): boolean {
  return workBlocks.some(block => {
    const b = workBlockToMinutes(block);
    return startMin >= b.start && endMin <= b.end;
  });
}

/** Check if a time slot is completely free (no collision AND within work hours) */
function isTimeSlotFree(
  startMin: number,
  endMin: number,
  events: { startMin: number; endMin: number; id: string }[],
  workBlocks: WorkBlock[],
  excludeId?: string
): { free: boolean; reason?: string } {
  if (!isWithinWorkHours(startMin, endMin, workBlocks)) {
    const absStartH = START_HOUR + Math.floor(startMin / 60);
    const absStartM = startMin % 60;
    const absEndH = START_HOUR + Math.floor(endMin / 60);
    const absEndM = endMin % 60;
    return {
      free: false,
      reason: `Hors horaires de travail (${String(absStartH).padStart(2, "0")}:${String(absStartM).padStart(2, "0")} – ${String(absEndH).padStart(2, "0")}:${String(absEndM).padStart(2, "0")}). Plages autorisées : ${workBlocks.map(b => `${String(b.startHour).padStart(2, "0")}:${String(b.startMin).padStart(2, "0")}–${String(b.endHour).padStart(2, "0")}:${String(b.endMin).padStart(2, "0")}`).join(", ")}`,
    };
  }
  if (hasCollision(startMin, endMin, events, excludeId)) {
    return { free: false, reason: "Créneau déjà occupé par un autre événement" };
  }
  return { free: true };
}

function getRoutineZones(routine: any) {
  if (!routine) return [];
  const zones: { start: number; end: number; label: string; type: string; icon: string }[] = [];
  const blocks = routine.blocks as any[];
  if (Array.isArray(blocks) && blocks.length > 0) {
    const iconMap: Record<string, string> = { deep_work: "🔴", admin: "☕", meetings: "☕", email: "📧", break: "⏸" };
    for (const b of blocks) {
      if (b.type === "break") continue;
      const startH = parseInt(b.start?.split(":")[0] || "0");
      const endH = parseInt(b.end?.split(":")[0] || "0");
      const endM = parseInt(b.end?.split(":")[1] || "0");
      zones.push({ start: startH, end: endM > 0 ? endH + 1 : endH, label: b.label || b.type, type: b.type === "meetings" ? "admin" : b.type, icon: iconMap[b.type] || "☕" });
    }
    return zones;
  }
  const mf = routine.morning_focus as any;
  const af = routine.afternoon_tasks as any;
  const es = routine.email_slots as any;
  if (mf?.start && mf?.end) zones.push({ start: parseInt(mf.start.split(":")[0]), end: parseInt(mf.end.split(":")[0]), label: mf.focus === "deep_work" ? "Deep Work" : "Focus", type: "deep_work", icon: "🧠" });
  if (af?.start && af?.end) zones.push({ start: parseInt(af.start.split(":")[0]), end: parseInt(af.end.split(":")[0]), label: af.focus === "meetings_admin" ? "Meetings & Admin" : "Admin", type: "admin", icon: "☕" });
  if (Array.isArray(es)) for (const slot of es) { const h = parseInt(slot.split(":")[0]); zones.push({ start: h, end: h + 1, label: "Emails", type: "email", icon: "📧" }); }
  return zones;
}

/** Check if a given hour is within any work block */
function isHourInWorkBlock(hour: number, workBlocks: WorkBlock[]): boolean {
  return workBlocks.some(b => hour >= b.startHour && hour < b.endHour);
}

const ZONE_STYLES: Record<string, { bg: string; border: string }> = {
  deep_work: { bg: `${CATEGORIES.focus.colors.light}15`, border: CATEGORIES.focus.colors.normal },
  admin: { bg: `${CATEGORIES.admin.colors.light}15`, border: CATEGORIES.admin.colors.normal },
  email: { bg: `${CATEGORIES.communication.colors.light}15`, border: CATEGORIES.communication.colors.normal },
  meetings: { bg: `${CATEGORIES.meetings.colors.light}15`, border: CATEGORIES.meetings.colors.normal },
};

const DAY_NAMES_SHORT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

/** Convert a UTC ISO datetime to minutes from START_HOUR */
function toGridMinutes(iso: string): number {
  const d = new Date(iso);
  return (d.getUTCHours() - START_HOUR) * 60 + d.getUTCMinutes();
}

/** Snap minutes to nearest 15-min slot */
function snapTo15(min: number): number {
  return Math.round(min / 15) * 15;
}

/** Check if a range [startMin, endMin) overlaps with any existing event except excludeId */
function hasCollision(startMin: number, endMin: number, events: { startMin: number; endMin: number; id: string }[], excludeId?: string): boolean {
  return events.some(e => e.id !== excludeId && startMin < e.endMin && endMin > e.startMin);
}

// ── Day view with 15-minute pixel grid + free drag ──
function DayView({ events, routineZones, onEventMove, onTaskDrop, onEventResize, workBlocks }: {
  events: CalendarEvent[];
  routineZones: ReturnType<typeof getRoutineZones>;
  onEventMove?: (eventId: string, newStartMin: number) => void;
  onTaskDrop?: (taskId: string, startMin: number) => void;
  onEventResize?: (eventId: string, newEndMin: number) => void;
  workBlocks: WorkBlock[];
}) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [dragGhostMin, setDragGhostMin] = useState<number | null>(null);
  const [dragGhostDuration, setDragGhostDuration] = useState<number>(30);
  const [dragType, setDragType] = useState<"event" | "task" | null>(null);
  const [resizing, setResizing] = useState<{ eventId: string; startMin: number; currentEndMin: number } | null>(null);

  const totalGridHeight = hours.length * HOUR_HEIGHT;

  // Map events to grid positions
  const gridEvents = useMemo(() => events.map(e => {
    const startMin = toGridMinutes(e.start_time);
    const endMin = toGridMinutes(e.end_time);
    const durationMin = endMin - startMin;
    return { ...e, startMin, endMin, durationMin };
  }), [events]);

  const getZoneForHour = (hour: number) => routineZones.find(z => hour >= z.start && hour < z.end);

  /** Convert a mouse Y position to grid minutes */
  const yToMinutes = useCallback((clientY: number): number => {
    if (!gridRef.current) return 0;
    const rect = gridRef.current.getBoundingClientRect();
    const y = clientY - rect.top + gridRef.current.scrollTop;
    const minutes = (y / HOUR_HEIGHT) * 60;
    return snapTo15(Math.max(0, Math.min(minutes, (END_HOUR - START_HOUR) * 60 - 15)));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const min = yToMinutes(e.clientY);
    setDragGhostMin(min);
  }, [yToMinutes]);

  const handleDragLeave = useCallback(() => {
    setDragGhostMin(null);
    setDragType(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const min = yToMinutes(e.clientY);
    const type = e.dataTransfer.getData("drag-type");
    const id = e.dataTransfer.getData("text/plain");
    const duration = parseInt(e.dataTransfer.getData("duration") || "30");

    if (!id) { setDragGhostMin(null); return; }

    const endMin = min + duration;
    const check = isTimeSlotFree(min, endMin, gridEvents, workBlocks, type === "event" ? id : undefined);

    if (!check.free) {
      toast.error(check.reason || "Créneau indisponible");
      setDragGhostMin(null);
      setDragType(null);
      return;
    }

    if (type === "task" && onTaskDrop) {
      onTaskDrop(id, min);
    } else if (type === "event" && onEventMove) {
      onEventMove(id, min);
    }
    setDragGhostMin(null);
    setDragType(null);
  }, [yToMinutes, gridEvents, onEventMove, onTaskDrop]);

  const handleEventDragStart = useCallback((e: React.DragEvent, event: typeof gridEvents[0]) => {
    e.dataTransfer.setData("text/plain", event.id);
    e.dataTransfer.setData("drag-type", "event");
    e.dataTransfer.setData("duration", String(event.durationMin));
    e.dataTransfer.effectAllowed = "move";
    setDragGhostDuration(event.durationMin);
    setDragType("event");
  }, []);

  // ── Resize logic ──
  const handleResizeStart = useCallback((e: React.MouseEvent, event: typeof gridEvents[0]) => {
    e.preventDefault();
    e.stopPropagation();
    setResizing({ eventId: event.id, startMin: event.startMin, currentEndMin: event.endMin });

    const onMouseMove = (me: MouseEvent) => {
      const newEndMin = yToMinutes(me.clientY);
      const snapped = Math.max(newEndMin, event.startMin + 15); // min 15 min
      setResizing(prev => prev ? { ...prev, currentEndMin: snapped } : null);
    };

    const onMouseUp = (me: MouseEvent) => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      const finalEndMin = yToMinutes(me.clientY);
      const snapped = snapTo15(Math.max(finalEndMin, event.startMin + 15));

      // Validate
      const check = isTimeSlotFree(event.startMin, snapped, gridEvents, workBlocks, event.id);
      if (!check.free) {
        toast.error(check.reason || "Créneau indisponible pour ce redimensionnement");
        setResizing(null);
        return;
      }

      if (onEventResize && snapped !== event.endMin) {
        onEventResize(event.id, snapped);
      }
      setResizing(null);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, [yToMinutes, gridEvents, onEventResize]);

  return (
    <div className="card-soft overflow-hidden relative">
      <div
        ref={gridRef}
        className="relative"
        style={{ height: `${totalGridHeight}px` }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Hour lines */}
        {hours.map((hour, idx) => {
          const zone = getZoneForHour(hour);
          const zoneStyle = zone ? ZONE_STYLES[zone.type] : null;
          const isZoneStart = zone && hour === zone.start;
          const inWorkHours = isHourInWorkBlock(hour, workBlocks);
          const y = idx * HOUR_HEIGHT;
          return (
            <div
              key={hour}
              className="absolute left-0 right-0 border-b border-border/10"
              style={{
                top: `${y}px`,
                height: `${HOUR_HEIGHT}px`,
                backgroundColor: !inWorkHours ? 'hsl(var(--muted) / 0.3)' : zoneStyle ? zoneStyle.bg : undefined,
                borderLeftWidth: zoneStyle ? "3px" : undefined,
                borderLeftColor: zoneStyle ? `${zoneStyle.border}40` : undefined,
                opacity: !inWorkHours ? 0.5 : 1,
              }}
            >
              <div className="w-16 text-right pr-4 pt-1 text-xs text-muted-foreground font-semibold absolute left-0 top-0">
                {hour}:00
                {isZoneStart && (
                  <div className="text-[9px] mt-0.5 font-medium" style={{ color: zoneStyle?.border || undefined, opacity: 0.7 }}>
                    {zone.icon} {zone.label}
                  </div>
                )}
                {!inWorkHours && (
                  <div className="text-[9px] mt-0.5 font-medium text-muted-foreground/50">
                    Hors horaires
                  </div>
                )}
              </div>
              {/* 15-min sub-lines */}
              <div className="absolute left-16 right-0 top-0 h-full">
                <div className="absolute w-full border-b border-border/5" style={{ top: `${SLOT_HEIGHT}px` }} />
                <div className="absolute w-full border-b border-border/8" style={{ top: `${SLOT_HEIGHT * 2}px` }} />
                <div className="absolute w-full border-b border-border/5" style={{ top: `${SLOT_HEIGHT * 3}px` }} />
              </div>
            </div>
          );
        })}

        {/* Events */}
        {gridEvents.map((event, i) => {
          const isResizing = resizing?.eventId === event.id;
          const effectiveEndMin = isResizing ? resizing.currentEndMin : event.endMin;
          const effectiveDuration = effectiveEndMin - event.startMin;
          const topPx = (event.startMin / 60) * HOUR_HEIGHT;
          const heightPx = Math.max((effectiveDuration / 60) * HOUR_HEIGHT, 28);
          return (
            <div
              key={event.id}
              className="absolute z-10"
              style={{ left: "68px", right: "8px", top: `${topPx}px`, height: `${heightPx}px` }}
            >
              <PlanningBlock
                eventId={event.id}
                title={event.title}
                category={(event as any).category || "admin"}
                durationHours={effectiveDuration / 60}
                source={event.source}
                height={heightPx}
                top={0}
                index={i}
                isDragging={false}
                onDragStart={(e) => handleEventDragStart(e, event)}
                onDragEnd={() => { setDragGhostMin(null); setDragType(null); }}
              />
              {/* Resize handle at bottom */}
              <div
                className="absolute bottom-0 left-2 right-2 h-3 cursor-s-resize z-20 group/resize flex items-center justify-center"
                onMouseDown={(e) => handleResizeStart(e, event)}
              >
                <div className="w-8 h-1 rounded-full bg-muted-foreground/20 group-hover/resize:bg-primary/50 transition-colors" />
              </div>
            </div>
          );
        })}

        {/* Drop ghost indicator */}
        {dragGhostMin !== null && (
          <div
            className="absolute z-20 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/8 flex items-center justify-center pointer-events-none transition-all duration-75"
            style={{
              left: "68px",
              right: "8px",
              top: `${(dragGhostMin / 60) * HOUR_HEIGHT}px`,
              height: `${Math.max((dragGhostDuration / 60) * HOUR_HEIGHT, 28)}px`,
            }}
          >
            <p className="text-[11px] text-primary/60 font-medium">
              {String(START_HOUR + Math.floor(dragGhostMin / 60)).padStart(2, "0")}:{String(dragGhostMin % 60).padStart(2, "0")} — Déposer ici
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Week view ──
function WeekView({ events, weekStart, onDayClick }: { events: CalendarEvent[]; weekStart: Date; onDayClick?: (date: Date) => void }) {
  const days = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });

  const eventsByDay = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const e of events) {
      const key = new Date(e.start_time).toISOString().split("T")[0];
      if (!map[key]) map[key] = [];
      map[key].push(e);
    }
    return map;
  }, [events]);

  return (
    <div className="card-soft overflow-hidden">
      <div className="grid grid-cols-7 divide-x divide-border/20">
        {days.map(day => {
          const key = format(day, "yyyy-MM-dd");
          const dayEvents = eventsByDay[key] || [];
          const todayClass = isToday(day) ? "bg-primary/5" : "";
          return (
            <div key={key} className={`min-h-[200px] p-2 cursor-pointer hover:bg-primary/5 transition-colors ${todayClass}`} onClick={() => onDayClick?.(day)}>
              <div className="text-center mb-2">
                <p className="text-[11px] text-muted-foreground font-medium">{format(day, "EEE", { locale: fr })}</p>
                <p className={`text-sm font-bold ${isToday(day) ? "text-primary" : "text-foreground"}`}>{format(day, "d")}</p>
              </div>
              <div className="space-y-1">
                {dayEvents.map((event, i) => {
                  const d = new Date(event.start_time);
                  const startH = `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
                  const cat = CATEGORIES[(event as any).category as TaskCategory] || CATEGORIES.admin;
                  return (
                    <div key={i} className="rounded-lg px-1.5 py-1 border" style={{ backgroundColor: `${cat.colors.light}40`, borderColor: `${cat.colors.normal}30`, color: cat.colors.normal }}>
                      <p className="text-[10px] font-bold truncate" style={{ color: "#2A2A2A" }}>{event.title}</p>
                      <p className="text-[9px] opacity-70">{startH}</p>
                    </div>
                  );
                })}
                {dayEvents.length === 0 && <p className="text-[10px] text-muted-foreground/50 text-center mt-4">—</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Month view ──
function MonthView({ events, currentDate, onDayClick }: { events: CalendarEvent[]; currentDate: Date; onDayClick?: (date: Date) => void }) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const eventsByDay = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const e of events) {
      const key = new Date(e.start_time).toISOString().split("T")[0];
      if (!map[key]) map[key] = [];
      map[key].push(e);
    }
    return map;
  }, [events]);

  return (
    <div className="card-soft overflow-hidden">
      <div className="grid grid-cols-7 border-b border-border/20">
        {DAY_NAMES_SHORT.map(d => (
          <div key={d} className="text-center py-2 text-[11px] font-semibold text-muted-foreground">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 divide-x divide-border/10">
        {days.map(day => {
          const key = format(day, "yyyy-MM-dd");
          const dayEvents = eventsByDay[key] || [];
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          return (
            <div key={key} className={`min-h-[80px] p-1 border-b border-border/10 cursor-pointer hover:bg-primary/5 transition-colors ${isToday(day) ? "bg-primary/5" : ""} ${!isCurrentMonth ? "opacity-40" : ""}`} onClick={() => onDayClick?.(day)}>
              <p className={`text-[11px] font-bold mb-0.5 ${isToday(day) ? "text-primary" : "text-foreground"}`}>{format(day, "d")}</p>
              {dayEvents.slice(0, 3).map((event, i) => {
                const cat = CATEGORIES[(event as any).category as TaskCategory] || CATEGORIES.admin;
                return (
                  <div key={i} className="rounded px-1 py-0.5 mb-0.5 truncate" style={{ backgroundColor: `${cat.colors.light}40`, color: cat.colors.normal }}>
                    <p className="text-[9px] font-medium truncate" style={{ color: "#2A2A2A" }}>{event.title}</p>
                  </div>
                );
              })}
              {dayEvents.length > 3 && <p className="text-[9px] text-muted-foreground">+{dayEvents.length - 3}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Time picker for unplanned tasks ──
function getTimeSlots(workBlocks: WorkBlock[]) {
  const slots: { hour: number; minute: number; label: string }[] = [];
  for (let h = 7; h <= 20; h++) {
    for (const m of [0, 15, 30, 45]) {
      if (isHourInWorkBlock(h, workBlocks)) {
        const slotEndMin = h * 60 + m + 15;
        const inBlock = workBlocks.some(b => {
          const bEnd = b.endHour * 60 + b.endMin;
          return h * 60 + m >= b.startHour * 60 + b.startMin && slotEndMin <= bEnd;
        });
        if (inBlock) {
          slots.push({ hour: h, minute: m, label: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}` });
        }
      }
    }
  }
  return slots;
}

function UnplannedTaskCard({ task, cat, CatIcon, onSchedule, onDragStart, workBlocks }: {
  task: any;
  cat: any;
  CatIcon: any;
  onSchedule: (hour: number, minute: number) => void;
  onDragStart: (e: React.DragEvent) => void;
  workBlocks: WorkBlock[];
}) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="p-3 rounded-2xl border border-dashed transition-all cursor-grab active:cursor-grabbing hover:-translate-y-0.5 hover:shadow-md relative"
      style={{ borderColor: `${cat.colors.normal}30`, backgroundColor: `${cat.colors.light}12` }}
    >
      <div className="flex items-center gap-2">
        <CatIcon className="w-3.5 h-3.5 shrink-0" style={{ color: cat.colors.normal }} />
        <p className="text-sm font-medium text-foreground truncate flex-1">{task.action_label}</p>
        <button
          onClick={(e) => { e.stopPropagation(); setShowPicker(!showPicker); }}
          className="shrink-0 p-1.5 rounded-lg hover:bg-primary/10 transition-colors"
          title="Choisir l'heure"
        >
          <Clock className="w-3.5 h-3.5 text-primary" />
        </button>
      </div>
      <div className="flex items-center gap-2 mt-1.5">
        <span className="pill text-[10px] font-bold px-2 py-0.5" style={{ backgroundColor: `${cat.colors.light}50`, color: cat.colors.normal }}>{cat.label}</span>
        {task.estimated_duration && (
          <span className="text-[10px] text-muted-foreground">{task.estimated_duration} min</span>
        )}
        {task.priority === "high" && (
          <span className="pill text-[10px] font-bold px-2 py-0.5" style={{ backgroundColor: `${CATEGORIES.urgent.colors.light}50`, color: CATEGORIES.urgent.colors.normal }}>Prioritaire</span>
        )}
      </div>

      {/* Time picker dropdown */}
      {showPicker && (
        <motion.div
          initial={{ opacity: 0, y: -4, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="absolute left-0 right-0 top-full mt-1 z-50 bg-card border border-border/50 rounded-2xl shadow-lg p-2 max-h-48 overflow-y-auto"
        >
          <p className="text-[10px] text-muted-foreground font-semibold px-2 py-1 mb-1">Planifier à…</p>
          <div className="grid grid-cols-4 gap-1">
            {getTimeSlots(workBlocks).map(slot => (
              <button
                key={slot.label}
                onClick={() => { onSchedule(slot.hour, slot.minute); setShowPicker(false); }}
                className="px-1.5 py-1.5 rounded-lg text-[11px] font-medium text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
              >
                {slot.label}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ── Main component ──
const GlobalPlanning = () => {
  const [activeTab, setActiveTab] = useState("today");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [autoplanning, setAutoplanning] = useState(false);
  const [showWorkHoursSettings, setShowWorkHoursSettings] = useState(false);
  const qc = useQueryClient();

  // Work hours settings
  const { data: workHoursData } = useWorkHoursSettings();
  const upsertWorkHours = useUpsertWorkHours();
  const workHoursSettings = workHoursData || DEFAULT_WORK_HOURS;
  const workBlocks = useMemo(() => getWorkBlocks(workHoursSettings), [workHoursSettings]);

  // Work hours form state
  const [whForm, setWhForm] = useState({ work_start: "", work_end: "", pause_start: "", pause_end: "" });
  useEffect(() => {
    setWhForm({
      work_start: workHoursSettings.work_start,
      work_end: workHoursSettings.work_end,
      pause_start: workHoursSettings.pause_start,
      pause_end: workHoursSettings.pause_end,
    });
  }, [workHoursSettings]);

  const today = new Date().toISOString().split("T")[0];

  // Compute date range based on active tab
  const viewDate = selectedDay || new Date();
  const viewDateStr = format(viewDate, "yyyy-MM-dd");

  const { rangeStart, rangeEnd } = useMemo(() => {
    if (activeTab === "today" || selectedDay) return { rangeStart: selectedDay ? viewDateStr : today, rangeEnd: selectedDay ? viewDateStr : today };
    if (activeTab === "week") {
      const ws = startOfWeek(currentDate, { weekStartsOn: 1 });
      return { rangeStart: format(ws, "yyyy-MM-dd"), rangeEnd: format(addDays(ws, 6), "yyyy-MM-dd") };
    }
    // month
    const ms = startOfMonth(currentDate);
    const me = endOfMonth(currentDate);
    const calStart = startOfWeek(ms, { weekStartsOn: 1 });
    const calEnd = endOfWeek(me, { weekStartsOn: 1 });
    return { rangeStart: format(calStart, "yyyy-MM-dd"), rangeEnd: format(calEnd, "yyyy-MM-dd") };
  }, [activeTab, currentDate, today, selectedDay, viewDateStr]);

  const { data: events = [] } = useCalendarEventsRange(rangeStart, rangeEnd);
  const { data: allTasks = [] } = useTasks();
  const { data: routines = [] } = useRoutines();
  const updateTask = useUpdateTask();
  const updateEvent = useUpdateCalendarEvent();

  const routine = routines.find(r => !r.structure_id) || routines[0] || null;
  const routineZones = getRoutineZones(routine);
  const unplannedTasks = allTasks.filter(t => !t.due_date && t.status !== "done" && !t.is_inbox);
  const [guidedOpen, setGuidedOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);

  // Morning audit
  const { data: todayAudit, isLoading: auditLoading } = useTodayAudit();
  const { data: auditSettings } = useAuditSettings();
  const auditAdaptation = todayAudit ? getAuditAdaptation(todayAudit) : null;

  // Auto-show audit if not completed today and settings enabled
  useEffect(() => {
    if (auditLoading) return;
    const isEnabled = auditSettings?.enabled !== false; // default enabled
    if (isEnabled && !todayAudit) {
      setAuditOpen(true);
    }
  }, [todayAudit, auditLoading, auditSettings]);

  const handleEventMove = useCallback((eventId: string, newStartMin: number) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;
    const oldStart = new Date(event.start_time);
    const oldEnd = new Date(event.end_time);
    const durationMs = oldEnd.getTime() - oldStart.getTime();
    const newStart = new Date(oldStart);
    newStart.setUTCHours(START_HOUR + Math.floor(newStartMin / 60), newStartMin % 60, 0, 0);
    const newEnd = new Date(newStart.getTime() + durationMs);
    updateEvent.mutate(
      { id: eventId, start_time: newStart.toISOString(), end_time: newEnd.toISOString() },
      { onSuccess: () => toast.success(`Événement déplacé à ${String(START_HOUR + Math.floor(newStartMin / 60)).padStart(2, "0")}:${String(newStartMin % 60).padStart(2, "0")} !`), onError: () => toast.error("Erreur lors du déplacement") }
    );
  }, [events, updateEvent]);

  const handleEventResize = useCallback((eventId: string, newEndMin: number) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;
    const oldStart = new Date(event.start_time);
    const newEnd = new Date(oldStart);
    const endHour = START_HOUR + Math.floor(newEndMin / 60);
    const endMinute = newEndMin % 60;
    newEnd.setUTCHours(endHour, endMinute, 0, 0);
    const durationMin = Math.round((newEnd.getTime() - oldStart.getTime()) / 60000);
    updateEvent.mutate(
      { id: eventId, start_time: oldStart.toISOString(), end_time: newEnd.toISOString() },
      {
        onSuccess: () => toast.success(`Durée modifiée → ${durationMin} min`),
        onError: () => toast.error("Erreur lors du redimensionnement"),
      }
    );
  }, [events, updateEvent]);

  const handleTaskDrop = useCallback(async (taskId: string, startMin: number) => {
    const task = allTasks.find(t => t.id === taskId);
    if (!task) return;
    const targetDate = selectedDay || new Date();
    const startTime = new Date(targetDate);
    const hour = START_HOUR + Math.floor(startMin / 60);
    const minute = startMin % 60;
    startTime.setUTCHours(hour, minute, 0, 0);
    const durationMin = task.estimated_duration || 30;
    const endTime = new Date(startTime.getTime() + durationMin * 60_000);
    const category = (task as any).category || "admin";

    try {
      const { error } = await supabase.from("calendar_events").insert({
        title: task.action_label,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        structure_id: task.structure_id,
        category,
        source: "manual",
        color: null,
      });
      if (error) throw error;
      await supabase.from("tasks").update({ due_date: format(targetDate, "yyyy-MM-dd") }).eq("id", taskId);
      qc.invalidateQueries({ queryKey: ["calendar_events"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.success(`"${task.action_label}" planifiée à ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")} !`);
    } catch (e: any) {
      toast.error("Erreur lors de la planification");
    }
  }, [allTasks, selectedDay, qc]);

  const handleAutoplan = async () => {
    setAutoplanning(true);
    try {
      const { data, error } = await supabase.functions.invoke("autoplan", { body: {} });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const skipped = data.skipped_count > 0 ? ` (${data.skipped_count} reportées)` : '';
      const routineInfo = data.routine_used ? ` · Routine: ${data.routine_used}` : '';
      toast.success(`${data.planned} tâches planifiées par l'IA !${skipped}${routineInfo} 🤖`);
      if (data.placement_summary) {
        toast.info(data.placement_summary, { duration: 5000 });
      }
      qc.invalidateQueries({ queryKey: ["calendar_events"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    } catch (e: any) { toast.error(e.message || "Erreur d'auto-planification"); }
    setAutoplanning(false);
  };

  const navigateDate = (dir: number) => {
    if (activeTab === "week") setCurrentDate(prev => addDays(prev, dir * 7));
    else if (activeTab === "month") setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + dir, 1));
  };

  const totalPlanned = events.reduce((sum, e) => sum + (new Date(e.end_time).getTime() - new Date(e.start_time).getTime()) / 3600000, 0);

  const handleDayClick = (date: Date) => {
    setSelectedDay(date);
  };

  const dateLabel = selectedDay
    ? format(selectedDay, "EEEE d MMMM", { locale: fr })
    : activeTab === "today"
    ? format(new Date(), "EEEE d MMMM", { locale: fr })
    : activeTab === "week"
      ? `Semaine du ${format(startOfWeek(currentDate, { weekStartsOn: 1 }), "d MMM", { locale: fr })}`
      : format(currentDate, "MMMM yyyy", { locale: fr });

  return (
    <PageTransition>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <motion.div className="w-12 h-12 rounded-3xl bg-accent/15 flex items-center justify-center" initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}>
              <CalendarDays className="w-6 h-6 text-accent" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Planning global</h1>
              <p className="text-sm text-muted-foreground capitalize">{dateLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setAuditOpen(true)} className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-sm font-bold transition-all ${todayAudit ? "border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/5" : "border-warning/30 text-warning hover:bg-warning/5"}`}>
              <Sun className="w-4 h-4" />
              {todayAudit ? "Modifier audit" : "Audit matinal"}
            </motion.button>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setGuidedOpen(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-primary/30 text-primary text-sm font-bold hover:bg-primary/5 transition-all">
              <Compass className="w-4 h-4" />
              Mode guidé
            </motion.button>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleAutoplan} disabled={autoplanning} className="flex items-center gap-2 px-5 py-2.5 rounded-2xl gradient-primary text-primary-foreground text-sm font-bold shadow-soft disabled:opacity-70">
              {autoplanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {autoplanning ? "Planification..." : "Auto-planifier via IA"}
            </motion.button>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setShowWorkHoursSettings(!showWorkHoursSettings)} className={`p-2.5 rounded-2xl border text-sm font-bold transition-all ${showWorkHoursSettings ? "border-primary/50 text-primary bg-primary/5" : "border-border/30 text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}>
              <Settings className="w-4 h-4" />
            </motion.button>
          </div>
          <GuidedDayDialog open={guidedOpen} onOpenChange={setGuidedOpen} />
          <MorningAuditDialog open={auditOpen} onOpenChange={setAuditOpen} />
        </div>

        {/* Work hours settings panel */}
        {showWorkHoursSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="card-soft p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Settings className="w-4 h-4 text-primary" />
                Horaires de travail
              </h3>
              <p className="text-[11px] text-muted-foreground">Les tâches ne pourront être planifiées que dans ces plages</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">Début de journée</label>
                <input
                  type="time"
                  value={whForm.work_start}
                  onChange={e => setWhForm(f => ({ ...f, work_start: e.target.value }))}
                  className="w-full rounded-xl border border-border/50 bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">Début de pause</label>
                <input
                  type="time"
                  value={whForm.pause_start}
                  onChange={e => setWhForm(f => ({ ...f, pause_start: e.target.value }))}
                  className="w-full rounded-xl border border-border/50 bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">Fin de pause</label>
                <input
                  type="time"
                  value={whForm.pause_end}
                  onChange={e => setWhForm(f => ({ ...f, pause_end: e.target.value }))}
                  className="w-full rounded-xl border border-border/50 bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">Fin de journée</label>
                <input
                  type="time"
                  value={whForm.work_end}
                  onChange={e => setWhForm(f => ({ ...f, work_end: e.target.value }))}
                  className="w-full rounded-xl border border-border/50 bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-muted-foreground">
                Plages actives : <span className="font-semibold text-foreground">{whForm.work_start}–{whForm.pause_start}</span> et <span className="font-semibold text-foreground">{whForm.pause_end}–{whForm.work_end}</span>
              </p>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  const id = (workHoursData as any)?.id;
                  upsertWorkHours.mutate(
                    { ...whForm, id },
                    {
                      onSuccess: () => {
                        toast.success("Horaires de travail mis à jour !");
                        setShowWorkHoursSettings(false);
                      },
                      onError: () => toast.error("Erreur lors de la sauvegarde"),
                    }
                  );
                }}
                className="px-5 py-2 rounded-2xl gradient-primary text-primary-foreground text-sm font-bold shadow-soft"
              >
                Enregistrer
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Adaptive planning banner */}
        {todayAudit && auditAdaptation && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl border"
            style={{ backgroundColor: "#C5F4EE15", borderColor: "#4ADBC830" }}
          >
            <Sun className="w-5 h-5 shrink-0" style={{ color: "#4ADBC8" }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">Planning adapté selon votre état du jour</p>
              <p className="text-xs text-muted-foreground mt-0.5">{auditAdaptation.planningNote || "Planning normal"}</p>
            </div>
            <button onClick={() => setAuditOpen(true)} className="shrink-0 p-1.5 rounded-lg hover:bg-muted transition-colors">
              <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </motion.div>
        )}

        {/* Tab bar + navigation arrows */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-card/70 backdrop-blur-sm rounded-2xl shadow-soft">
            {TABS.map(tab => (
              <motion.button key={tab.key} onClick={() => { setActiveTab(tab.key); setCurrentDate(new Date()); setSelectedDay(null); }} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === tab.key && !selectedDay ? "gradient-primary text-primary-foreground shadow-soft" : "text-muted-foreground hover:text-foreground"}`}>
                {tab.label}
              </motion.button>
            ))}
          </div>
          {activeTab !== "today" && (
            <div className="flex items-center gap-1">
              <button onClick={() => navigateDate(-1)} className="p-1.5 rounded-xl hover:bg-muted transition-colors"><ChevronLeft className="w-4 h-4 text-muted-foreground" /></button>
              <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 rounded-xl text-xs font-medium text-primary hover:bg-primary/10 transition-colors">Aujourd'hui</button>
              <button onClick={() => navigateDate(1)} className="p-1.5 rounded-xl hover:bg-muted transition-colors"><ChevronRight className="w-4 h-4 text-muted-foreground" /></button>
            </div>
          )}
        </div>

        {/* Category color legend */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground font-semibold mr-1">Catégories :</span>
          {CATEGORY_LIST.map(cat => {
            const Icon = cat.icon;
            return (
              <div key={cat.key} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-colors" style={{ backgroundColor: `${cat.colors.light}30` }}>
                <Icon className="w-3 h-3" style={{ color: cat.colors.normal }} />
                <span className="text-[11px] font-medium" style={{ color: cat.colors.normal }}>{cat.label}</span>
              </div>
            );
          })}
        </div>

        {/* Routine zones legend */}
        {routineZones.length > 0 && (activeTab === "today" || selectedDay) && (
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs text-muted-foreground font-semibold">Zones :</span>
            {routineZones.filter((z, i, arr) => arr.findIndex(x => x.type === z.type) === i).map(z => {
              const zoneColor = ZONE_STYLES[z.type];
              return (
                <div key={z.type} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ backgroundColor: zoneColor ? `${zoneColor.border}15` : undefined }}>
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: zoneColor?.border }} />
                  <span className="text-[11px] font-medium" style={{ color: zoneColor?.border }}>{z.label}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Back button when viewing a specific day */}
        {selectedDay && (
          <motion.button initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} onClick={() => setSelectedDay(null)} className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors">
            <ChevronLeft className="w-3.5 h-3.5" />
            Retour à la vue {activeTab === "week" ? "semaine" : "mois"}
          </motion.button>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <FadeInSection className="lg:col-span-3">
             {selectedDay ? (
              <DayView events={events} routineZones={routineZones} onEventMove={handleEventMove} onTaskDrop={handleTaskDrop} onEventResize={handleEventResize} workBlocks={workBlocks} />
            ) : (
              <>
                {activeTab === "today" && <DayView events={events} routineZones={routineZones} onEventMove={handleEventMove} onTaskDrop={handleTaskDrop} onEventResize={handleEventResize} workBlocks={workBlocks} />}
                {activeTab === "week" && <WeekView events={events} weekStart={startOfWeek(currentDate, { weekStartsOn: 1 })} onDayClick={handleDayClick} />}
                {activeTab === "month" && <MonthView events={events} currentDate={currentDate} onDayClick={handleDayClick} />}
              </>
            )}
          </FadeInSection>

          <StaggerContainer className="space-y-5" delay={0.2}>
            <StaggerItem>
              <div className="card-soft p-5">
                <h2 className="text-sm font-bold text-foreground mb-3">À planifier</h2>
                <div className="space-y-2">
                  {unplannedTasks.length === 0 && <p className="text-xs text-muted-foreground">Tout est planifié 🎉</p>}
                  {unplannedTasks.slice(0, 6).map(task => {
                    const cat = CATEGORIES[(task as any).category as TaskCategory] || CATEGORIES.admin;
                    const CatIcon = cat.icon;
                    return (
                      <UnplannedTaskCard
                        key={task.id}
                        task={task}
                        cat={cat}
                        CatIcon={CatIcon}
                        workBlocks={workBlocks}
                        onSchedule={(hour, minute) => {
                          const startMin = (hour - START_HOUR) * 60 + minute;
                          const duration = task.estimated_duration || 30;
                          const endMin = startMin + duration;
                          if (!isWithinWorkHours(startMin, endMin, workBlocks)) {
                            toast.error(`Hors horaires de travail. Plages : ${workBlocks.map(b => `${String(b.startHour).padStart(2, "0")}:${String(b.startMin).padStart(2, "0")}–${String(b.endHour).padStart(2, "0")}:${String(b.endMin).padStart(2, "0")}`).join(", ")}`);
                            return;
                          }
                          handleTaskDrop(task.id, startMin);
                        }}
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", task.id);
                          e.dataTransfer.setData("drag-type", "task");
                          e.dataTransfer.setData("duration", String(task.estimated_duration || 30));
                          e.dataTransfer.effectAllowed = "copyMove";
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="card-soft p-5">
                <h2 className="text-sm font-bold text-foreground mb-3">Résumé</h2>
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between"><span className="text-muted-foreground">Total planifié</span><span className="font-bold text-foreground">{totalPlanned.toFixed(1)}h</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Événements</span><span className="font-bold text-foreground">{events.length}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Non planifiées</span><span className="font-bold text-foreground">{unplannedTasks.length}</span></div>
                </div>
              </div>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </div>
    </PageTransition>
  );
};

export default GlobalPlanning;
