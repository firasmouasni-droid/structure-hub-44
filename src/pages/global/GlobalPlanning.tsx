import { useCalendarEvents, useCalendarEventsRange, useUpdateCalendarEvent, CalendarEvent } from "@/hooks/useCalendarEvents";
import { useTasks, useUpdateTask } from "@/hooks/useTasks";
import { useRoutines } from "@/hooks/useRoutines";
import { CalendarDays, Sparkles, Loader2, ChevronLeft, ChevronRight, Compass } from "lucide-react";
import GuidedDayDialog from "@/components/guided/GuidedDayDialog";
import PlanningBlock from "@/components/planning/PlanningBlock";
import { CATEGORIES, type TaskCategory, getCategoryColor } from "@/lib/categories";
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay, eachDayOfInterval, isToday, getDay } from "date-fns";
import { fr } from "date-fns/locale";
import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageTransition, StaggerContainer, StaggerItem, HoverCard, FadeInSection } from "@/components/motion/MotionWrappers";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";

const hours = Array.from({ length: 14 }, (_, i) => i + 7);
const TABS = [
  { key: "today", label: "Aujourd'hui" },
  { key: "week", label: "Semaine" },
  { key: "month", label: "Mois" },
];

function getRoutineZones(routine: any) {
  if (!routine) return [];
  const zones: { start: number; end: number; label: string; type: string; icon: string }[] = [];

  // Use blocks array if available (Module 1 routines)
  const blocks = routine.blocks as any[];
  if (Array.isArray(blocks) && blocks.length > 0) {
    const iconMap: Record<string, string> = { deep_work: "🔴", admin: "☕", meetings: "☕", email: "📧", break: "⏸" };
    for (const b of blocks) {
      if (b.type === "break") continue;
      const startH = parseInt(b.start?.split(":")[0] || "0");
      const endH = parseInt(b.end?.split(":")[0] || "0");
      const endM = parseInt(b.end?.split(":")[1] || "0");
      zones.push({
        start: startH,
        end: endM > 0 ? endH + 1 : endH,
        label: b.label || b.type,
        type: b.type === "meetings" ? "admin" : b.type,
        icon: iconMap[b.type] || "☕",
      });
    }
    return zones;
  }

  // Fallback to legacy morning_focus / afternoon_tasks
  const mf = routine.morning_focus as any;
  const af = routine.afternoon_tasks as any;
  const es = routine.email_slots as any;
  if (mf?.start && mf?.end) {
    zones.push({ start: parseInt(mf.start.split(":")[0]), end: parseInt(mf.end.split(":")[0]), label: mf.focus === "deep_work" ? "Deep Work" : "Focus", type: "deep_work", icon: "🧠" });
  }
  if (af?.start && af?.end) {
    zones.push({ start: parseInt(af.start.split(":")[0]), end: parseInt(af.end.split(":")[0]), label: af.focus === "meetings_admin" ? "Meetings & Admin" : "Admin", type: "admin", icon: "☕" });
  }
  if (Array.isArray(es)) {
    for (const slot of es) {
      const h = parseInt(slot.split(":")[0]);
      zones.push({ start: h, end: h + 1, label: "Emails", type: "email", icon: "📧" });
    }
  }
  return zones;
}

const ZONE_STYLES: Record<string, { bg: string; border: string }> = {
  deep_work: { bg: `${CATEGORIES.focus.colors.light}15`, border: CATEGORIES.focus.colors.normal },
  admin: { bg: `${CATEGORIES.admin.colors.light}15`, border: CATEGORIES.admin.colors.normal },
  email: { bg: `${CATEGORIES.communication.colors.light}15`, border: CATEGORIES.communication.colors.normal },
  meetings: { bg: `${CATEGORIES.meetings.colors.light}15`, border: CATEGORIES.meetings.colors.normal },
};

const DAY_NAMES_SHORT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

// ── Day view (hourly grid) with drag-and-drop + category colors ──
function DayView({ events, routineZones, onEventMove }: { events: CalendarEvent[]; routineZones: ReturnType<typeof getRoutineZones>; onEventMove?: (eventId: string, newHour: number) => void }) {
  const [dragOverHour, setDragOverHour] = useState<number | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const mappedEvents = events.map(e => {
    const startHour = new Date(e.start_time).getUTCHours();
    const startMin = new Date(e.start_time).getUTCMinutes();
    const durationHours = (new Date(e.end_time).getTime() - new Date(e.start_time).getTime()) / 3600000;
    return { ...e, startHour, startMin, durationHours };
  });

  const getZoneForHour = (hour: number) => routineZones.find(z => hour >= z.start && hour < z.end);

  const handleDragStart = (e: React.DragEvent, eventId: string) => {
    e.dataTransfer.setData("text/plain", eventId);
    e.dataTransfer.effectAllowed = "move";
    setDraggingId(eventId);
  };

  const handleDrop = (e: React.DragEvent, hour: number) => {
    e.preventDefault();
    const eventId = e.dataTransfer.getData("text/plain");
    if (eventId && onEventMove) onEventMove(eventId, hour);
    setDragOverHour(null);
    setDraggingId(null);
  };

  return (
    <div className="card-soft overflow-hidden">
      {hours.map((hour, idx) => {
        const zone = getZoneForHour(hour);
        const zoneStyle = zone ? ZONE_STYLES[zone.type] : null;
        const isZoneStart = zone && hour === zone.start;
        const isDropTarget = dragOverHour === hour;
        return (
          <motion.div
            key={hour}
            className={`flex border-b border-border/10 last:border-0 transition-colors`}
            style={{
              backgroundColor: isDropTarget
                ? "rgba(138,99,246,0.08)"
                : zoneStyle
                ? zoneStyle.bg
                : undefined,
              borderLeftWidth: zoneStyle ? "3px" : undefined,
              borderLeftColor: zoneStyle ? `${zoneStyle.border}40` : undefined,
            }}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.015, duration: 0.25 }}
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setDragOverHour(hour); }}
            onDragLeave={() => setDragOverHour(null)}
            onDrop={(e) => handleDrop(e, hour)}
          >
            <div className="w-16 py-5 text-right pr-4 text-xs text-muted-foreground shrink-0 font-semibold">
              {hour}:00
              {isZoneStart && (
                <div className="text-[9px] mt-0.5 font-medium" style={{ color: zoneStyle?.border || undefined, opacity: 0.7 }}>
                  {zone.icon} {zone.label}
                </div>
              )}
            </div>
            <div className="flex-1 relative min-h-[68px] border-l border-border/15 py-0.5">
              {mappedEvents.filter(e => e.startHour === hour).map((event, i) => (
                <PlanningBlock
                  key={event.id}
                  eventId={event.id}
                  title={event.title}
                  category={(event as any).category || "admin"}
                  durationHours={event.durationHours}
                  source={event.source}
                  height={Math.max(event.durationHours * 68, 44)}
                  top={event.startMin}
                  index={i}
                  isDragging={draggingId === event.id}
                  onDragStart={(e) => handleDragStart(e, event.id)}
                  onDragEnd={() => { setDragOverHour(null); setDraggingId(null); }}
                />
              ))}
              {isDropTarget && mappedEvents.filter(e => e.startHour === hour).length === 0 && (
                <div className="absolute inset-2 rounded-2xl border-2 border-dashed border-primary/25 flex items-center justify-center">
                  <p className="text-[10px] text-primary/40 font-medium">Déposer ici</p>
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
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

// ── Main component ──
const GlobalPlanning = () => {
  const [activeTab, setActiveTab] = useState("today");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [autoplanning, setAutoplanning] = useState(false);
  const qc = useQueryClient();

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

  const handleEventMove = useCallback((eventId: string, newHour: number) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;
    const oldStart = new Date(event.start_time);
    const oldEnd = new Date(event.end_time);
    const durationMs = oldEnd.getTime() - oldStart.getTime();
    const newStart = new Date(oldStart);
    newStart.setUTCHours(newHour, 0, 0, 0);
    const newEnd = new Date(newStart.getTime() + durationMs);
    updateEvent.mutate(
      { id: eventId, start_time: newStart.toISOString(), end_time: newEnd.toISOString() },
      { onSuccess: () => toast.success("Événement déplacé !"), onError: () => toast.error("Erreur lors du déplacement") }
    );
  }, [events, updateEvent]);

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
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setGuidedOpen(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-primary/30 text-primary text-sm font-bold hover:bg-primary/5 transition-all">
              <Compass className="w-4 h-4" />
              Mode guidé
            </motion.button>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleAutoplan} disabled={autoplanning} className="flex items-center gap-2 px-5 py-2.5 rounded-2xl gradient-primary text-primary-foreground text-sm font-bold shadow-soft disabled:opacity-70">
              {autoplanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {autoplanning ? "Planification..." : "Auto-planifier via IA"}
            </motion.button>
          </div>
          <GuidedDayDialog open={guidedOpen} onOpenChange={setGuidedOpen} />
        </div>

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
              <DayView events={events} routineZones={routineZones} onEventMove={handleEventMove} />
            ) : (
              <>
                {activeTab === "today" && <DayView events={events} routineZones={routineZones} onEventMove={handleEventMove} />}
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
                      <HoverCard key={task.id} className="p-3 rounded-2xl border border-dashed transition-all" style={{ borderColor: `${cat.colors.normal}30`, backgroundColor: `${cat.colors.light}12` }}>
                        <div className="flex items-center gap-2">
                          <CatIcon className="w-3.5 h-3.5 shrink-0" style={{ color: cat.colors.normal }} />
                          <p className="text-sm font-medium text-foreground truncate">{task.action_label}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="pill text-[10px] font-bold px-2 py-0.5" style={{ backgroundColor: `${cat.colors.light}50`, color: cat.colors.normal }}>{cat.label}</span>
                          {task.priority === "high" && (
                            <span className="pill text-[10px] font-bold px-2 py-0.5" style={{ backgroundColor: `${CATEGORIES.urgent.colors.light}50`, color: CATEGORIES.urgent.colors.normal }}>Prioritaire</span>
                          )}
                        </div>
                      </HoverCard>
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
