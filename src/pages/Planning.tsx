import AppLayout from "@/components/layout/AppLayout";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { useTasks, useUpdateTask } from "@/hooks/useTasks";
import { useStructures } from "@/hooks/useStructures";
import { CalendarDays, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

const hours = Array.from({ length: 12 }, (_, i) => i + 7);

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
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-accent/15 flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Planning</h1>
              <p className="text-sm text-muted-foreground capitalize">{dateStr}</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold shadow-soft hover:shadow-soft-lg transition-all">
            <Sparkles className="w-4 h-4" />
            Planifier avec l'IA
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          <div className="lg:col-span-3 card-soft overflow-hidden">
            <div className="relative">
              {hours.map((hour) => (
                <div key={hour} className="flex border-b border-border/30 last:border-0">
                  <div className="w-16 py-4 text-right pr-4 text-xs text-muted-foreground shrink-0 font-medium">{hour}:00</div>
                  <div className="flex-1 relative min-h-[60px] border-l border-border/30">
                    {mappedEvents
                      .filter((e) => e.startHour === hour)
                      .map((event, i) => (
                        <div key={i} className="absolute left-2 right-2 rounded-2xl px-3 py-2 bg-primary/10 border border-primary/20"
                          style={{ height: `${event.durationHours * 60}px`, top: `${event.startMin}px` }}>
                          <p className="text-xs font-semibold text-foreground truncate">{event.title}</p>
                          <p className="text-[11px] text-muted-foreground">{event.structureName} · {event.durationHours}h</p>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="card-soft p-5">
              <h2 className="text-sm font-bold text-foreground mb-3">À planifier</h2>
              <div className="space-y-2">
                {unplannedTasks.length === 0 && <p className="text-xs text-muted-foreground">Tout est planifié 🎉</p>}
                {unplannedTasks.map((task) => (
                  <div key={task.id} className="p-3 rounded-2xl border border-dashed border-border hover:border-primary/30 hover:bg-primary/5 transition-all duration-200">
                    <p className="text-sm font-medium text-foreground">{task.action_label}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{task.estimated_duration ? `${task.estimated_duration} min` : '-'}</span>
                        <span className={`px-2 py-0.5 pill ${task.priority === "high" ? "bg-destructive/20 text-destructive-foreground" : task.priority === "medium" ? "bg-warning/20 text-warning-foreground" : "bg-muted text-muted-foreground"}`}>{task.priority}</span>
                      </div>
                      <button onClick={() => handlePlanToday(task.id)} className="text-xs text-primary font-semibold hover:underline">Aujourd'hui</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card-soft p-5">
              <h2 className="text-sm font-bold text-foreground mb-3">Résumé</h2>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">Total planifié</span><span className="font-semibold text-foreground">{totalPlanned.toFixed(1)}h</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Événements</span><span className="font-semibold text-foreground">{mappedEvents.length}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Planning;
