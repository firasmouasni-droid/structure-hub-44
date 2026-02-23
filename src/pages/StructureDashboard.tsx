import AppLayout from "@/components/layout/AppLayout";
import { useStructure } from "@/hooks/useStructures";
import { useTasksByStructure, useUpdateTask } from "@/hooks/useTasks";
import { useGoals } from "@/hooks/useGoals";
import { useIncrementXP } from "@/hooks/useUserStats";
import { CheckCircle2, Clock, TrendingUp, Bot, ArrowRight, Target } from "lucide-react";
import { useParams, Link } from "react-router-dom";
import { toast } from "sonner";

const StructureDashboard = () => {
  const { id } = useParams<{ id: string }>();
  const { data: structure } = useStructure(id || "");
  const { data: tasks = [] } = useTasksByStructure(id || "");
  const { data: goals = [] } = useGoals(id || "");
  const updateTask = useUpdateTask();
  const incrementXP = useIncrementXP();

  const today = new Date().toISOString().split("T")[0];
  const doneTasks = tasks.filter(t => t.status === "done").length;
  const todayCount = tasks.filter(t => t.due_date === today).length;
  const remaining = tasks.filter(t => t.status !== "done").length;
  const progress = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;

  const handleToggle = async (taskId: string, currentStatus: string) => {
    const next = currentStatus === "done" ? "todo" : "done";
    await updateTask.mutateAsync({ id: taskId, status: next });
    if (next === "done") { await incrementXP.mutateAsync(10); toast.success("+10 XP !"); }
  };

  if (!structure) return <AppLayout><div className="p-8 text-center text-muted-foreground">Chargement...</div></AppLayout>;

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-5 animate-fade-in">
        <div className="flex items-center gap-2.5">
          <div className={`w-2.5 h-2.5 rounded-full ${structure.color}`} />
          <h1 className="text-h1 text-foreground">{structure.name}</h1>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickStat icon={<CheckCircle2 className="w-4 h-4 text-success" />} label="Complétées" value={`${doneTasks}/${tasks.length}`} />
          <QuickStat icon={<Clock className="w-4 h-4 text-muted-foreground" />} label="Aujourd'hui" value={String(todayCount)} />
          <QuickStat icon={<TrendingUp className="w-4 h-4 text-muted-foreground" />} label="Progression" value={`${progress}%`} />
          <QuickStat icon={<Target className="w-4 h-4 text-muted-foreground" />} label="Restantes" value={String(remaining)} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bg-card rounded-lg border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-foreground">Tâches</h2>
              <Link to="/tasks" className="text-caption text-primary font-medium hover:underline flex items-center gap-1">Voir tout <ArrowRight className="w-3 h-3" /></Link>
            </div>
            <div className="space-y-0.5">
              {tasks.length === 0 && <p className="text-caption text-muted-foreground py-4 text-center">Aucune tâche</p>}
              {tasks.slice(0, 8).map((task) => (
                <div key={task.id} className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-accent transition-colors cursor-pointer" onClick={() => handleToggle(task.id, task.status)}>
                  <input type="checkbox" className="w-4 h-4 rounded-sm border-border accent-primary" checked={task.status === "done"} readOnly />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${task.status === "done" ? "line-through text-muted-foreground" : "text-foreground"}`}>{task.action_label}</p>
                    <p className="text-[11px] text-muted-foreground">{task.due_date || '-'} · {task.estimated_duration ? `${task.estimated_duration} min` : '-'}</p>
                  </div>
                  <span className={`text-[11px] px-1.5 py-0.5 rounded ${task.priority === "high" ? "bg-destructive/10 text-destructive" : task.priority === "medium" ? "bg-warning/10 text-warning" : "bg-accent text-muted-foreground"}`}>{task.priority}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-card rounded-lg border border-border p-5">
              <div className="flex items-center gap-2 mb-3">
                <Bot className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-sm font-medium text-foreground">Suggestions IA</h2>
              </div>
              <div className="space-y-2">
                <div className="p-3 rounded-md bg-accent text-[11px] text-foreground">
                  Tu as {remaining} tâches restantes dans cette structure. Priorise les urgentes.
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-5">
              <h2 className="text-sm font-medium text-foreground mb-3">Objectifs</h2>
              <div className="space-y-3">
                {goals.length === 0 && <p className="text-[11px] text-muted-foreground">Aucun objectif défini</p>}
                {goals.map(g => (
                  <ObjectiveItem key={g.id} label={g.title} progress={g.target_value ? Math.round((g.current_value / g.target_value) * 100) : 0} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

const QuickStat = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="bg-card rounded-lg border border-border p-4">
    <div className="flex items-center gap-2 mb-1">{icon}<span className="text-[11px] text-muted-foreground">{label}</span></div>
    <div className="text-lg font-semibold text-foreground">{value}</div>
  </div>
);

const ObjectiveItem = ({ label, progress }: { label: string; progress: number }) => (
  <div>
    <div className="flex justify-between text-[11px] mb-1">
      <span className="text-foreground font-medium">{label}</span>
      <span className="text-muted-foreground">{progress}%</span>
    </div>
    <div className="h-1 bg-accent rounded-full overflow-hidden">
      <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
    </div>
  </div>
);

export default StructureDashboard;
