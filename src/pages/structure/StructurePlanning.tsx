import { useCalendarEventsByStructure } from "@/hooks/useCalendarEvents";
import { useTasksByStructure, useUpdateTask } from "@/hooks/useTasks";
import { useRoutines } from "@/hooks/useRoutines";
import { CalendarDays, Sparkles, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useState } from "react";
import { useParams } from "react-router-dom";
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
  const mf = routine.morning_focus as any;
  const af = routine.afternoon_tasks as any;
  const es = routine.email_slots as any;
  if (mf?.start && mf?.end) {
    zones.push({
      start: parseInt(mf.start.split(":")[0]),
      end: parseInt(mf.end.split(":")[0]),
      label: mf.focus === "deep_work" ? "Deep Work" : mf.focus === "creative" ? "Créatif" : "Focus",
      type: "deep_work",
      icon: "🧠",
    });
  }
  if (af?.start && af?.end) {
    zones.push({
      start: parseInt(af.start.split(":")[0]),
      end: parseInt(af.end.split(":")[0]),
      label: af.focus === "meetings_admin" ? "Meetings & Admin" : "Admin",
      type: "admin",
      icon: "☕",
    });
  }
  if (Array.isArray(es)) {
    for (const slot of es) {
      const h = parseInt(slot.split(":")[0]);
      zones.push({ start: h, end: h + 1, label: "Emails", type: "email", icon: "📧" });
    }
  }
  return zones;
}

const ZONE_STYLES: Record<string, string> = {
  deep_work: "bg-purple-500/5 border-l-2 border-l-purple-500/20",
  admin: "bg-blue-500/5 border-l-2 border-l-blue-500/20",
  email: "bg-cyan-500/5 border-l-2 border-l-cyan-500/20",
};

const StructurePlanning = () => {
  const { id } = useParams<{ id: string }>();
  const today = new Date().toISOString().split("T")[0];
  const { data: events = [] } = useCalendarEventsByStructure(id || "", today);
  const { data: allTasks = [] } = useTasksByStructure(id || "");
  const { data: routines = [] } = useRoutines();
  const updateTask = useUpdateTask();
  const [activeTab, setActiveTab] = useState("today");
  const [autoplanning, setAutoplanning] = useState(false);
  const qc = useQueryClient();

  const routine = routines.find(r => r.structure_id === id) || routines.find(r => !r.structure_id) || null;
  const routineZones = getRoutineZones(routine);

  const unplannedTasks = allTasks.filter(t => !t.due_date && t.status !== "done" && !t.is_inbox);

  const handlePlanToday = async (taskId: string) => {
    await updateTask.mutateAsync({ id: taskId, due_date: today });
    toast.success("Tâche planifiée aujourd'hui !");
  };

  const handleAutoplan = async () => {
    setAutoplanning(true);
    try {
      const { data, error } = await supabase.functions.invoke("autoplan", { body: { structure_id: id } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`${data.planned} tâches planifiées par l'IA ! 🤖`);
      qc.invalidateQueries({ queryKey: ["calendar_events"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    } catch (e: any) { toast.error(e.message || "Erreur d'auto-planification"); }
    setAutoplanning(false);
  };

  const mappedEvents = events.map(e => {
    const startHour = new Date(e.start_time).getHours();
    const startMin = new Date(e.start_time).getMinutes();
    const durationHours = (new Date(e.end_time).getTime() - new Date(e.start_time).getTime()) / 3600000;
    return { ...e, startHour, startMin, durationHours };
  });

  const totalPlanned = mappedEvents.reduce((sum, e) => sum + e.durationHours, 0);
  const dateStr = format(new Date(), "EEEE d MMMM", { locale: fr });

  const getZoneForHour = (hour: number) => routineZones.find(z => hour >= z.start && hour < z.end);

  return (
    <PageTransition>
        <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div className="w-12 h-12 rounded-3xl bg-accent/15 flex items-center justify-center" initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}>
                <CalendarDays className="w-6 h-6 text-accent" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Planning</h1>
                <p className="text-sm text-muted-foreground capitalize">{dateStr}</p>
              </div>
            </div>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleAutoplan} disabled={autoplanning} className="flex items-center gap-2 px-5 py-2.5 rounded-2xl gradient-primary text-primary-foreground text-sm font-bold shadow-soft disabled:opacity-70">
              {autoplanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {autoplanning ? "Planification..." : "Auto-planifier via IA"}
            </motion.button>
          </div>

          <div className="flex items-center gap-1 p-1 bg-card/70 backdrop-blur-sm rounded-2xl shadow-soft w-fit">
            {TABS.map(tab => (
              <motion.button key={tab.key} onClick={() => setActiveTab(tab.key)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === tab.key ? "gradient-primary text-primary-foreground shadow-soft" : "text-muted-foreground hover:text-foreground"}`}>
                {tab.label}
              </motion.button>
            ))}
          </div>

          {/* Routine zones legend */}
          {routineZones.length > 0 && (
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-xs text-muted-foreground font-semibold">Zones de routine :</span>
              {routineZones.filter((z, i, arr) => arr.findIndex(x => x.type === z.type) === i).map(z => (
                <div key={z.type} className="flex items-center gap-1.5">
                  <span className="text-xs">{z.icon}</span>
                  <span className="text-[11px] text-muted-foreground">{z.label}</span>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <FadeInSection className="lg:col-span-3">
              <div className="card-soft overflow-hidden">
                {hours.map((hour, idx) => {
                  const zone = getZoneForHour(hour);
                  const zoneStyle = zone ? ZONE_STYLES[zone.type] || "" : "";
                  const isZoneStart = zone && hour === zone.start;

                  return (
                    <motion.div key={hour} className={`flex border-b border-border/20 last:border-0 ${zoneStyle}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.02, duration: 0.3 }}>
                      <div className="w-16 py-5 text-right pr-4 text-xs text-muted-foreground shrink-0 font-semibold">
                        {hour}:00
                        {isZoneStart && (
                          <div className="text-[9px] mt-0.5 opacity-60">{zone.icon} {zone.label}</div>
                        )}
                      </div>
                      <div className="flex-1 relative min-h-[64px] border-l border-border/20">
                        {mappedEvents.filter(e => e.startHour === hour).map((event, i) => (
                          <motion.div key={i} className="absolute left-2 right-2 rounded-2xl px-4 py-2.5 border bg-primary/12 border-primary/20 text-primary z-10" style={{ height: `${Math.max(event.durationHours * 64, 40)}px`, top: `${event.startMin}px` }} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 + i * 0.1 }}>
                            <p className="text-xs font-bold truncate">{event.title}</p>
                            <p className="text-[11px] opacity-70">{event.durationHours.toFixed(1)}h · {event.source === "ai" ? "IA" : event.source}</p>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </FadeInSection>

            <StaggerContainer className="space-y-5" delay={0.2}>
              <StaggerItem>
                <div className="card-soft p-5">
                  <h2 className="text-sm font-bold text-foreground mb-3">À planifier</h2>
                  <div className="space-y-2">
                    {unplannedTasks.length === 0 && <p className="text-xs text-muted-foreground">Tout est planifié 🎉</p>}
                    {unplannedTasks.slice(0, 6).map(task => (
                      <HoverCard key={task.id} className="p-3 rounded-2xl border border-dashed border-border hover:border-primary/30 transition-all">
                        <p className="text-sm font-medium text-foreground">{task.action_label}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className={`pill text-[10px] font-bold px-2 py-0.5 ${task.priority === "high" ? "bg-destructive/20 text-destructive-foreground" : task.priority === "medium" ? "bg-warning/20 text-warning-foreground" : "bg-muted text-muted-foreground"}`}>{task.priority}</span>
                          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handlePlanToday(task.id)} className="pill px-3 py-1 text-[11px] font-bold text-primary bg-primary/10 hover:bg-primary/20 transition-all">
                            Aujourd'hui
                          </motion.button>
                        </div>
                      </HoverCard>
                    ))}
                  </div>
                </div>
              </StaggerItem>
              <StaggerItem>
                <div className="card-soft p-5">
                  <h2 className="text-sm font-bold text-foreground mb-3">Résumé</h2>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between"><span className="text-muted-foreground">Total planifié</span><span className="font-bold text-foreground">{totalPlanned.toFixed(1)}h</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Événements</span><span className="font-bold text-foreground">{mappedEvents.length}</span></div>
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

export default StructurePlanning;
