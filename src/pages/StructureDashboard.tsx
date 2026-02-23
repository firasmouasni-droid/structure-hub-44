import AppLayout from "@/components/layout/AppLayout";
import { mockTasks } from "@/data/mockData";
import { CheckCircle2, Clock, TrendingUp, Bot, ArrowRight, Target } from "lucide-react";
import { useParams, Link } from "react-router-dom";

const structureInfo: Record<string, { name: string; color: string; colorClass: string }> = {
  pro: { name: "Pro - Entreprise", color: "bg-primary", colorClass: "text-primary" },
  perso: { name: "Perso", color: "bg-success", colorClass: "text-success" },
  project: { name: "Side Project", color: "bg-secondary", colorClass: "text-secondary" },
  club: { name: "Aéroclub", color: "bg-warning", colorClass: "text-warning" },
};

const StructureDashboard = () => {
  const { id } = useParams<{ id: string }>();
  const info = structureInfo[id || "pro"] || structureInfo.pro;
  const tasks = mockTasks.filter((t) => t.structure === info.name.split(" - ")[0] || t.structure === info.name);

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className={`w-4 h-4 rounded-full ${info.color}`} />
          <h1 className="text-2xl font-bold text-foreground">{info.name}</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickStat icon={<CheckCircle2 className="w-5 h-5 text-success" />} label="Complétées" value="15/23" />
          <QuickStat icon={<Clock className="w-5 h-5 text-primary" />} label="Charge" value="85%" />
          <QuickStat icon={<TrendingUp className="w-5 h-5 text-secondary" />} label="Progression" value="68%" />
          <QuickStat icon={<Target className="w-5 h-5 text-warning" />} label="Objectifs" value="3/5" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tasks */}
          <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5 card-shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-foreground">Tâches</h2>
              <Link to="/tasks" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
                Voir tout <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="space-y-2">
              {(tasks.length > 0 ? tasks : mockTasks.slice(0, 4)).map((task) => (
                <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors">
                  <input type="checkbox" className="w-4 h-4 rounded border-border text-primary" checked={task.status === "done"} readOnly />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${task.status === "done" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                      {task.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{task.due_date} · {task.estimated_duration}</p>
                  </div>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                    task.priority === "high" ? "bg-destructive/10 text-destructive" :
                    task.priority === "medium" ? "bg-warning/10 text-warning" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* AI + Objectives */}
          <div className="space-y-4">
            <div className="bg-card rounded-xl border border-border p-5 card-shadow">
              <div className="flex items-center gap-2 mb-3">
                <Bot className="w-5 h-5 text-secondary" />
                <h2 className="text-sm font-semibold text-foreground">Suggestions IA</h2>
              </div>
              <div className="space-y-2">
                <div className="p-3 rounded-lg bg-secondary/5 border border-secondary/10 text-xs text-foreground">
                  Tu devrais bloquer 2h de deep work demain matin pour finir le contrat.
                </div>
                <div className="p-3 rounded-lg bg-secondary/5 border border-secondary/10 text-xs text-foreground">
                  3 emails non traités depuis 48h. Priorité suggérée : haute.
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-5 card-shadow">
              <h2 className="text-sm font-semibold text-foreground mb-3">Objectifs</h2>
              <div className="space-y-3">
                <ObjectiveItem label="Closer 3 clients" progress={66} />
                <ObjectiveItem label="0 email > 48h" progress={40} />
                <ObjectiveItem label="Routine tenue 5j/7" progress={80} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

const QuickStat = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="bg-card rounded-xl border border-border p-4 card-shadow">
    <div className="flex items-center gap-2 mb-1">
      {icon}
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
    <div className="text-xl font-bold text-foreground">{value}</div>
  </div>
);

const ObjectiveItem = ({ label, progress }: { label: string; progress: number }) => (
  <div>
    <div className="flex justify-between text-xs mb-1">
      <span className="text-foreground font-medium">{label}</span>
      <span className="text-muted-foreground">{progress}%</span>
    </div>
    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
      <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
    </div>
  </div>
);

export default StructureDashboard;
