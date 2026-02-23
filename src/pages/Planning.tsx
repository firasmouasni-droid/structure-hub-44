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
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-5 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CalendarDays className="w-5 h-5 text-muted-foreground" />
            <h1 className="text-h1 text-foreground">Planning</h1>
            <span className="text-caption text-muted-foreground capitalize">{dateStr}</span>
          </div>
          <button className="flex items-center gap-2 px-3.5 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
            <Sparkles className="w-3.5 h-3.5" />
            Planifier avec l'IA
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          <div className="lg:col-span-3 bg-card rounded-lg border border-border overflow-hidden">
            <div className="relative">
              {hours.map((hour) => (
                <div key={hour} className="flex border-b border-border last:border-0">
                  <div className="w-14 py-4 text-right pr-3 text-[11px] text-muted-foreground shrink-0">{hour}:00</div>
                  <div className="flex-1 relative min-h-[56px] border-l border-border">
                    {mappedEvents
                      .filter((e) => e.startHour === hour)
                      .map((event, i) => (
                        <div key={i} className="absolute left-1 right-1 rounded-md border border-primary/20 bg-primary/5 px-3 py-1.5"
                          style={{ height: `${event.durationHours * 56}px`, top: `${event.startMin}px` }}>
                          <p className="text-[11px] font-medium text-foreground truncate">{event.title}</p>
                          <p className="text-[10px] text-muted-foreground">{event.structureName} · {event.durationHours}h</p>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-card rounded-lg border border-border p-4">
              <h2 className="text-sm font-medium text-foreground mb-3">À planifier</h2>
              <div className="space-y-1.5">
                {unplannedTasks.length === 0 && <p className="text-[11px] text-muted-foreground">Toutes les tâches sont planifiées 🎉</p>}
                {unplannedTasks.map((task) => (
                  <div key={task.id} className="p-2.5 rounded-md border border-dashed border-border hover:border-primary/20 hover:bg-accent transition-colors">
                    <p className="text-sm text-foreground">{task.action_label}</p>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span>{task.estimated_duration ? `${task.estimated_duration} min` : '-'}</span>
                        <span className={`px-1 py-0.5 rounded ${task.priority === "high" ? "bg-destructive/10 text-destructive" : task.priority === "medium" ? "bg-warning/10 text-warning" : "bg-accent text-muted-foreground"}`}>{task.priority}</span>
                      </div>
                      <button onClick={() => handlePlanToday(task.id)} className="text-[11px] text-primary font-medium hover:underline">Aujourd'hui</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-4">
              <h2 className="text-sm font-medium text-foreground mb-2">Résumé</h2>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between"><span className="text-muted-foreground">Total planifié</span><span className="font-medium text-foreground">{totalPlanned.toFixed(1)}h</span></div>
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
