import AppLayout from "@/components/layout/AppLayout";
import { useStructures } from "@/hooks/useStructures";
import { useTasks } from "@/hooks/useTasks";
import { useUserStats } from "@/hooks/useUserStats";
import {
  TrendingUp, CheckCircle2, ArrowRight, Bot, Clock, CalendarDays, Flame
} from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const actionTypeBadge: Record<string, string> = {
  CALL: "bg-accent text-muted-foreground",
  EMAIL: "bg-accent text-muted-foreground",
  MEETING: "bg-accent text-muted-foreground",
  WRITE: "bg-accent text-muted-foreground",
  PLAN: "bg-accent text-muted-foreground",
  BUILD: "bg-accent text-muted-foreground",
  REVIEW: "bg-accent text-muted-foreground",
  LEARN: "bg-accent text-muted-foreground",
  ADMIN: "bg-accent text-muted-foreground",
  OTHER: "bg-accent text-muted-foreground",
};

const Dashboard = () => {
  const { data: structures = [] } = useStructures();
  const { data: allTasks = [] } = useTasks({ isInbox: false });
  const { data: stats } = useUserStats();

  const today = new Date().toISOString().split("T")[0];
  const todayTasks = allTasks.filter(t => t.due_date === today);
  const completedToday = todayTasks.filter(t => t.status === "done").length;
  const totalToday = todayTasks.length;
  const score = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;
  const plannedMinutes = todayTasks.reduce((sum, t) => sum + (t.estimated_duration || 0), 0);
  const meetingsToday = todayTasks.filter(t => t.action_type === "MEETING").length;

  const xp = stats?.xp ?? 0;
  const level = stats?.level ?? 1;
  const streak = stats?.streak_days ?? 0;
  const xpForNextLevel = level * 1000;
  const xpInLevel = xp - (level - 1) * 1000;
  const xpPercent = Math.round((xpInLevel / 1000) * 100);

  const dateStr = format(new Date(), "EEEE d MMMM", { locale: fr });

  const structureStats = structures.map(s => {
    const sTasks = allTasks.filter(t => t.structure_id === s.id);
    const sToday = sTasks.filter(t => t.due_date === today);
    const sDone = sTasks.filter(t => t.status === "done").length;
    const progress = sTasks.length > 0 ? Math.round((sDone / sTasks.length) * 100) : 0;
    const charge = sTasks.filter(t => t.status !== "done").length;
    return { ...s, tasksToday: sToday.length, tasksTotal: sTasks.length, progress, charge };
  });

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-h1 text-foreground">Bonjour 👋</h1>
            <p className="text-muted-foreground text-caption mt-1 capitalize">
              {dateStr} — {totalToday} tâches aujourd'hui
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-accent text-caption">
              <Flame className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="font-medium text-muted-foreground">{streak}j</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-accent text-caption">
              <span className="font-medium text-muted-foreground">Niv. {level}</span>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard label="Score du jour" value={`${score}%`} sub={`${completedToday}/${totalToday} complétées`} icon={<TrendingUp className="w-4 h-4 text-muted-foreground" />} />
          <StatCard label="Complétées" value={`${completedToday}/${totalToday}`} sub="aujourd'hui" icon={<CheckCircle2 className="w-4 h-4 text-success" />} />
          <StatCard label="Temps planifié" value={`${Math.floor(plannedMinutes / 60)}h${plannedMinutes % 60 > 0 ? String(plannedMinutes % 60).padStart(2, '0') : ''}`} sub={`${todayTasks.length} tâches`} icon={<Clock className="w-4 h-4 text-muted-foreground" />} />
          <StatCard label="Réunions" value={String(meetingsToday)} sub="aujourd'hui" icon={<CalendarDays className="w-4 h-4 text-muted-foreground" />} />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bg-card rounded-lg border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-foreground">Tâches du jour</h2>
              <Link to="/tasks" className="text-caption text-primary font-medium hover:underline flex items-center gap-1">
                Voir tout <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-0.5">
              {todayTasks.length === 0 && <p className="text-caption text-muted-foreground py-6 text-center">Aucune tâche planifiée aujourd'hui</p>}
              {todayTasks.map((task) => {
                const structure = structures.find(s => s.id === task.structure_id);
                return (
                  <div key={task.id} className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-accent transition-colors">
                    <div className={`w-2 h-2 rounded-full ${structure?.color || 'bg-muted'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{task.action_label}</p>
                      <p className="text-[11px] text-muted-foreground">{structure?.name} · {task.estimated_duration ? `${task.estimated_duration} min` : '-'}</p>
                    </div>
                    <span className={`text-[11px] px-1.5 py-0.5 rounded ${actionTypeBadge[task.action_type] || 'bg-accent text-muted-foreground'}`}>
                      {task.action_type}
                    </span>
                    <span className={`text-[11px] px-1.5 py-0.5 rounded ${
                      task.priority === "high" ? "bg-destructive/10 text-destructive" :
                      task.priority === "medium" ? "bg-warning/10 text-warning" :
                      "bg-accent text-muted-foreground"
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Coach Quick */}
          <div className="bg-card rounded-lg border border-border p-5">
            <div className="flex items-center gap-2 mb-4">
              <Bot className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Coach IA</h2>
            </div>
            <div className="space-y-2">
              <div className="p-3 rounded-md bg-accent text-caption text-foreground">
                Tu as {todayTasks.filter(t => t.status === 'todo').length} tâches à faire aujourd'hui. Veux-tu que je les priorise ?
              </div>
              <div className="p-3 rounded-md bg-accent text-caption text-foreground">
                🔥 {streak} jours de streak ! Continue comme ça !
              </div>
            </div>
            <Link to="/coach" className="mt-4 block">
              <button className="w-full py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
                Ouvrir le Coach IA
              </button>
            </Link>
          </div>
        </div>

        {/* Structures */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Mes Structures</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {structureStats.map((s) => (
              <Link key={s.id} to={`/structure/${s.id}`} className="bg-card rounded-lg border border-border p-4 hover:border-primary/20 transition-colors">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className={`w-2 h-2 rounded-full ${s.color}`} />
                  <h3 className="text-sm font-medium text-foreground">{s.name}</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">{s.tasksToday} aujourd'hui</span>
                    <span className="text-foreground font-medium">{s.progress}%</span>
                  </div>
                  <div className="h-1 bg-accent rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${s.color}`} style={{ width: `${s.progress}%` }} />
                  </div>
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>Charge: {s.charge}</span>
                    <span>{s.tasksTotal} total</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* XP Progress */}
        <div className="bg-card rounded-lg border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">Progression</h2>
            <span className="text-caption text-muted-foreground">{xp.toLocaleString()} / {xpForNextLevel.toLocaleString()} XP</span>
          </div>
          <div className="h-1 bg-accent rounded-full overflow-hidden mb-3">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${xpPercent}%` }} />
          </div>
          <div className="flex gap-2 flex-wrap">
            <span className="text-[11px] px-2 py-1 rounded bg-accent text-muted-foreground font-medium">🔥 Streak {streak}j</span>
            <span className="text-[11px] px-2 py-1 rounded bg-accent text-muted-foreground font-medium">⚡ Speed Runner</span>
            <span className="text-[11px] px-2 py-1 rounded bg-accent text-muted-foreground font-medium">📧 Email Master</span>
            <span className="text-[11px] px-2 py-1 rounded bg-accent text-muted-foreground font-medium">🎯 Focus Pro</span>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

const StatCard = ({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) => (
  <div className="bg-card rounded-lg border border-border p-4">
    <div className="flex items-center gap-2 mb-1.5">
      {icon}
      <span className="text-caption text-muted-foreground">{label}</span>
    </div>
    <div className="text-xl font-semibold text-foreground">{value}</div>
    <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>
  </div>
);

export default Dashboard;
