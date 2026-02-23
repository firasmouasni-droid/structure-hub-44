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
      <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className={`w-4 h-4 rounded-full ${structure.color}`} />
          <h1 className="text-2xl font-bold text-foreground">{structure.name}</h1>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickStat icon={<CheckCircle2 className="w-4 h-4 text-success" />} iconBg="bg-success/15" label="Complétées" value={`${doneTasks}/${tasks.length}`} />
          <QuickStat icon={<Clock className="w-4 h-4 text-accent" />} iconBg="bg-accent/15" label="Aujourd'hui" value={String(todayCount)} />
          <QuickStat icon={<TrendingUp className="w-4 h-4 text-primary" />} iconBg="bg-primary/15" label="Progression" value={`${progress}%`} />
          <QuickStat icon={<Target className="w-4 h-4 text-secondary" />} iconBg="bg-secondary/15" label="Restantes" value={String(remaining)} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 card-soft p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-foreground">Tâches</h2>
              <Link to="/tasks" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">Voir tout <ArrowRight className="w-3.5 h-3.5" /></Link>
            </div>
            <div className="space-y-1.5">
              {tasks.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">Aucune tâche ✨</p>}
              {tasks.slice(0, 8).map((task) => (
                <div key={task.id} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-muted/50 transition-all duration-200 cursor-pointer" onClick={() => handleToggle(task.id, task.status)}>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${task.status === "done" ? "border-success bg-success" : "border-border"}`}>
                    {task.status === "done" && <span className="text-success-foreground text-[10px]">✓</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${task.status === "done" ? "line-through text-muted-foreground" : "text-foreground font-medium"}`}>{task.action_label}</p>
                    <p className="text-[11px] text-muted-foreground">{task.due_date || '-'} · {task.estimated_duration ? `${task.estimated_duration} min` : '-'}</p>
                  </div>
                  <span className={`text-[11px] font-medium px-2.5 py-1 pill ${task.priority === "high" ? "bg-destructive/20 text-destructive-foreground" : task.priority === "medium" ? "bg-warning/20 text-warning-foreground" : "bg-muted text-muted-foreground"}`}>{task.priority}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="card-soft p-5">
              <div className="flex items-center gap-2 mb-3">
                <Bot className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-bold text-foreground">Suggestions IA</h2>
              </div>
              <div className="space-y-2">
                <div className="p-3 rounded-2xl bg-primary/8 text-sm text-foreground">
                  Tu as {remaining} tâches restantes. Priorise les urgentes.
                </div>
              </div>
            </div>

            <div className="card-soft p-5">
              <h2 className="text-sm font-bold text-foreground mb-3">Objectifs</h2>
              <div className="space-y-3">
                {goals.length === 0 && <p className="text-xs text-muted-foreground">Aucun objectif défini</p>}
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

const QuickStat = ({ icon, iconBg, label, value }: { icon: React.ReactNode; iconBg: string; label: string; value: string }) => (
  <div className="card-soft p-4">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className={`w-8 h-8 rounded-xl ${iconBg} flex items-center justify-center`}>{icon}</div>
    </div>
    <div className="text-xl font-bold text-foreground">{value}</div>
  </div>
);

const ObjectiveItem = ({ label, progress }: { label: string; progress: number }) => (
  <div>
    <div className="flex justify-between text-xs mb-1.5">
      <span className="text-foreground font-medium">{label}</span>
      <span className="text-muted-foreground">{progress}%</span>
    </div>
    <div className="h-2 bg-muted rounded-pill overflow-hidden">
      <div className="h-full gradient-primary rounded-pill transition-all duration-500" style={{ width: `${progress}%` }} />
    </div>
  </div>
);

export default StructureDashboard;
