import AppLayout from "@/components/layout/AppLayout";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { useTasks, useUpdateTask } from "@/hooks/useTasks";
import { useStructures } from "@/hooks/useStructures";
import { CalendarDays, Sparkles, GripVertical } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

const hours = Array.from({ length: 12 }, (_, i) => i + 7);

const typeStyles: Record<string, string> = {
  deep: "bg-primary/10 border-primary/30 text-primary",
  meeting: "bg-secondary/10 border-secondary/30 text-secondary",
  break: "bg-muted border-border text-muted-foreground",
  call: "bg-warning/10 border-warning/30 text-warning",
  email: "bg-success/10 border-success/30 text-success",
  default: "bg-primary/10 border-primary/30 text-primary",
};

const Planning = () => {
  const today = new Date().toISOString().split("T")[0];
  const { data: events = [] } = useCalendarEvents(today);
  const { data: allTasks = [] } = useTasks({ isInbox: false });
  const { data: structures = [] } = useStructures();
  const updateTask = useUpdateTask();

  const unplannedTasks = allTasks.filter(t => !t.due_date && t.status !== "done");

  const handlePlanToday = async (taskId: string) => {
    await updateTask.mutateAsync({ id: taskId, due_date: today });
    toast.success("Tâche planifiée aujourd'hui !");
  };

  // Map events to display format
  const mappedEvents = events.map(e => {
    const startHour = new Date(e.start_time).getHours();
    const startMin = new Date(e.start_time).getMinutes();
    const endTime = new Date(e.end_time);
    const startTime = new Date(e.start_time);
    const durationHours = (endTime.getTime() - startTime.getTime()) / 3600000;
    const structure = structures.find(s => s.id === e.structure_id);
    return { ...e, startHour, startMin, durationHours, structureName: structure?.name || "" };
  });

  // Compute summary
  const totalPlanned = mappedEvents.reduce((sum, e) => sum + e.durationHours, 0);
  const meetingHours = mappedEvents.filter(e => e.title.toLowerCase().includes("réunion")).reduce((s, e) => s + e.durationHours, 0);

  const dateStr = format(new Date(), "EEEE d MMMM", { locale: fr });

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarDays className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Planning</h1>
            <span className="text-sm text-muted-foreground">{dateStr}</span>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg gradient-ai text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
            <Sparkles className="w-4 h-4" />
            Planifier avec l'IA
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 bg-card rounded-xl border border-border card-shadow overflow-hidden">
            <div className="relative">
              {hours.map((hour) => (
                <div key={hour} className="flex border-b border-border/50 last:border-0">
                  <div className="w-16 py-4 text-right pr-3 text-xs text-muted-foreground shrink-0">{hour}:00</div>
                  <div className="flex-1 relative min-h-[60px] border-l border-border/50">
                    {mappedEvents
                      .filter((e) => e.startHour === hour)
                      .map((event, i) => (
                        <div key={i} className={`absolute left-1 right-1 rounded-lg border px-3 py-2 ${typeStyles.default}`}
                          style={{ height: `${event.durationHours * 60}px`, top: `${event.startMin}px` }}>
                          <div className="flex items-center gap-2">
                            <GripVertical className="w-3 h-3 opacity-40" />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold truncate">{event.title}</p>
                              <p className="text-[11px] opacity-70">{event.structureName} · {event.durationHours}h</p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-card rounded-xl border border-border p-4 card-shadow">
              <h2 className="text-sm font-semibold text-foreground mb-3">À planifier</h2>
              <div className="space-y-2">
                {unplannedTasks.length === 0 && <p className="text-xs text-muted-foreground">Toutes les tâches sont planifiées 🎉</p>}
                {unplannedTasks.map((task) => (
                  <div key={task.id} className="p-3 rounded-lg border border-dashed border-border hover:border-primary/30 hover:bg-primary/5 transition-colors">
                    <p className="text-sm font-medium text-foreground">{task.action_label}</p>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{task.estimated_duration ? `${task.estimated_duration} min` : '-'}</span>
                        <span className={`px-1.5 py-0.5 rounded-full ${task.priority === "high" ? "bg-destructive/10 text-destructive" : task.priority === "medium" ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground"}`}>{task.priority}</span>
                      </div>
                      <button onClick={() => handlePlanToday(task.id)} className="text-xs text-primary font-medium hover:underline">Aujourd'hui</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-4 card-shadow">
              <h2 className="text-sm font-semibold text-foreground mb-2">Résumé</h2>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">Total planifié</span><span className="font-medium text-primary">{totalPlanned.toFixed(1)}h</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Réunions</span><span className="font-medium text-foreground">{meetingHours.toFixed(1)}h</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Événements</span><span className="font-medium text-foreground">{mappedEvents.length}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Planning;
