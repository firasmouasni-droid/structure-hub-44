import AppLayout from "@/components/layout/AppLayout";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { useTasks, useUpdateTask } from "@/hooks/useTasks";
import { useStructures } from "@/hooks/useStructures";
import { CalendarDays, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useState } from "react";
import { toast } from "sonner";
import { PageTransition, StaggerContainer, StaggerItem, HoverCard, FadeInSection } from "@/components/motion/MotionWrappers";
import { motion } from "framer-motion";

const hours = Array.from({ length: 12 }, (_, i) => i + 7);

const TABS = [
  { key: "today", label: "Aujourd'hui" },
  { key: "week", label: "Semaine" },
  { key: "month", label: "Mois" },
];

const typeStyles: Record<string, string> = {
  deep: "bg-primary/12 border-primary/20 text-primary",
  meeting: "bg-accent/12 border-accent/20 text-accent",
  admin: "bg-warning/12 border-warning/20 text-warning-foreground",
};

const Planning = () => {
  const today = new Date().toISOString().split("T")[0];
  const { data: events = [] } = useCalendarEvents(today);
  const { data: allTasks = [] } = useTasks({ isInbox: false });
  const { data: structures = [] } = useStructures();
  const updateTask = useUpdateTask();
  const [activeTab, setActiveTab] = useState("today");

  const unplannedTasks = allTasks.filter(t => !t.due_date && t.status !== "done");

  const handlePlanToday = async (taskId: string) => {
    await updateTask.mutateAsync({ id: taskId, due_date: today });
    toast.success("Tâche planifiée aujourd'hui !");
  };

  const mappedEvents = events.map(e => {
    const startHour = new Date(e.start_time).getHours();
    const startMin = new Date(e.start_time).getMinutes();
    const endTime = new Date(e.end_time);
    const startTime = new Date(e.start_time);
    const durationHours = (endTime.getTime() - startTime.getTime()) / 3600000;
    const structure = structures.find(s => s.id === e.structure_id);
    return { ...e, startHour, startMin, durationHours, structureName: structure?.name || "" };
  });

  const totalPlanned = mappedEvents.reduce((sum, e) => sum + e.durationHours, 0);
  const dateStr = format(new Date(), "EEEE d MMMM", { locale: fr });

  return (
    <AppLayout>
      <PageTransition>
        <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                className="w-12 h-12 rounded-3xl bg-accent/15 flex items-center justify-center"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              >
                <CalendarDays className="w-6 h-6 text-accent" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Planning</h1>
                <p className="text-sm text-muted-foreground capitalize">{dateStr}</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl gradient-primary text-primary-foreground text-sm font-bold shadow-soft hover:shadow-soft-lg transition-all"
            >
              <Sparkles className="w-4 h-4" />
              Auto-planifier via IA
            </motion.button>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 p-1 bg-white/70 backdrop-blur-sm rounded-2xl shadow-soft w-fit">
            {TABS.map(tab => (
              <motion.button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className={`px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === tab.key ? "gradient-primary text-primary-foreground shadow-soft" : "text-muted-foreground hover:text-foreground"}`}
              >
                {tab.label}
              </motion.button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Timeline */}
            <FadeInSection className="lg:col-span-3">
              <div className="card-soft overflow-hidden">
                <div className="relative">
                  {hours.map((hour, idx) => (
                    <motion.div
                      key={hour}
                      className="flex border-b border-border/20 last:border-0"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03, duration: 0.3 }}
                    >
                      <div className="w-16 py-5 text-right pr-4 text-xs text-muted-foreground shrink-0 font-semibold">{hour}:00</div>
                      <div className="flex-1 relative min-h-[64px] border-l border-border/20">
                        {mappedEvents
                          .filter((e) => e.startHour === hour)
                          .map((event, i) => (
                            <motion.div
                              key={i}
                              className={`absolute left-2 right-2 rounded-2xl px-4 py-2.5 border ${typeStyles.deep}`}
                              style={{ height: `${event.durationHours * 64}px`, top: `${event.startMin}px` }}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.3 + i * 0.1, duration: 0.4, type: "spring" }}
                            >
                              <p className="text-xs font-bold truncate">{event.title}</p>
                              <p className="text-[11px] opacity-70">{event.structureName} · {event.durationHours}h</p>
                            </motion.div>
                          ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </FadeInSection>

            {/* Right Panel */}
            <StaggerContainer className="space-y-5" delay={0.2}>
              <StaggerItem>
                <div className="card-soft p-5">
                  <h2 className="text-sm font-bold text-foreground mb-3">À planifier</h2>
                  <div className="space-y-2">
                    {unplannedTasks.length === 0 && <p className="text-xs text-muted-foreground">Tout est planifié 🎉</p>}
                    {unplannedTasks.map((task) => (
                      <HoverCard key={task.id} className="p-3 rounded-2xl border border-dashed border-border hover:border-primary/30 hover:bg-primary/5 transition-all duration-200">
                        <p className="text-sm font-medium text-foreground">{task.action_label}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className={`pill text-[10px] font-bold px-2 py-0.5 ${task.priority === "high" ? "bg-destructive/20 text-destructive-foreground" : task.priority === "medium" ? "bg-warning/20 text-warning-foreground" : "bg-muted text-muted-foreground"}`}>{task.priority}</span>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handlePlanToday(task.id)}
                            className="pill px-3 py-1 text-[11px] font-bold text-primary bg-primary/10 hover:bg-primary/20 transition-all"
                          >
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
    </AppLayout>
  );
};

export default Planning;
