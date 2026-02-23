import AppLayout from "@/components/layout/AppLayout";
import { useStructures } from "@/hooks/useStructures";
import { useTasks } from "@/hooks/useTasks";
import { useUserStats } from "@/hooks/useUserStats";
import {
  Zap, TrendingUp, Flame, Trophy, CheckCircle2,
  ArrowRight, Bot, Clock, CalendarDays
} from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const actionTypeColors: Record<string, string> = {
  CALL: "bg-warning/10 text-warning",
  EMAIL: "bg-primary/10 text-primary",
  MEETING: "bg-secondary/10 text-secondary",
  WRITE: "bg-success/10 text-success",
  PLAN: "bg-primary/10 text-primary",
  BUILD: "bg-secondary/10 text-secondary",
  REVIEW: "bg-warning/10 text-warning",
  LEARN: "bg-success/10 text-success",
  ADMIN: "bg-muted text-muted-foreground",
  OTHER: "bg-muted text-muted-foreground",
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

  // Compute per-structure stats
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
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Bonjour 👋</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {dateStr} — {totalToday} tâches aujourd'hui, {todayTasks.filter(t => t.status === "in_progress").length} en cours
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-warning/10">
              <Flame className="w-4 h-4 text-warning" />
              <span className="text-sm font-semibold text-warning">{streak} jours</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/10">
              <Trophy className="w-4 h-4 text-secondary" />
              <span className="text-sm font-semibold text-secondary">Niv. {level}</span>
            </div>
          </div>
        </div>

        {/* Score + Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-1 rounded-xl gradient-primary p-5 text-primary-foreground card-shadow">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5" />
              <span className="text-sm font-medium opacity-90">Score du jour</span>
            </div>
            <div className="text-4xl font-bold">{score}</div>
            <div className="flex items-center gap-1.5 mt-2 text-sm opacity-80">
              <TrendingUp className="w-4 h-4" />
              <span>{completedToday}/{totalToday} complétées</span>
            </div>
          </div>

          <StatCard icon={<CheckCircle2 className="w-5 h-5 text-success" />} label="Complétées" value={`${completedToday}/${totalToday}`} sub="aujourd'hui" />
          <StatCard icon={<Clock className="w-5 h-5 text-primary" />} label="Temps planifié" value={`${Math.floor(plannedMinutes / 60)}h${plannedMinutes % 60 > 0 ? (plannedMinutes % 60).toString().padStart(2, '0') : ''}`} sub={`${todayTasks.length} tâches`} />
          <StatCard icon={<CalendarDays className="w-5 h-5 text-secondary" />} label="Réunions" value={String(meetingsToday)} sub="aujourd'hui" />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5 card-shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-foreground">Tâches du jour</h2>
              <Link to="/tasks" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
                Voir tout <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="space-y-2">
              {todayTasks.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">Aucune tâche planifiée aujourd'hui</p>}
              {todayTasks.map((task) => {
                const structure = structures.find(s => s.id === task.structure_id);
                return (
                  <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors group">
                    <div className={`w-2 h-2 rounded-full ${structure?.color || 'bg-muted'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{task.action_label}</p>
                      <p className="text-xs text-muted-foreground">{structure?.name} · {task.estimated_duration ? `${task.estimated_duration} min` : '-'}</p>
                    </div>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${actionTypeColors[task.action_type] || 'bg-muted text-muted-foreground'}`}>
                      {task.action_type}
                    </span>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                      task.priority === "high" ? "bg-destructive/10 text-destructive" :
                      task.priority === "medium" ? "bg-warning/10 text-warning" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Coach Quick */}
          <div className="bg-card rounded-xl border border-border p-5 card-shadow">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg gradient-ai flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary-foreground" />
              </div>
              <h2 className="text-base font-semibold text-foreground">Coach IA</h2>
            </div>
            <div className="space-y-3">
              {/* TODO: Replace with AI-generated suggestions */}
              <AISuggestion text={`Tu as ${todayTasks.filter(t => t.status === 'todo').length} tâches à faire aujourd'hui. Veux-tu que je les priorise ?`} />
              <AISuggestion text={`🔥 ${streak} jours de streak ! Continue comme ça !`} />
            </div>
            <Link to="/coach" className="mt-4 block">
              <button className="w-full py-2.5 rounded-lg gradient-ai text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
                Ouvrir le Coach IA
              </button>
            </Link>
          </div>
        </div>

        {/* Structures */}
        <div>
          <h2 className="text-base font-semibold text-foreground mb-4">Mes Structures</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {structureStats.map((s) => (
              <Link key={s.id} to={`/structure/${s.id}`} className="bg-card rounded-xl border border-border p-4 card-shadow hover:card-shadow-hover transition-shadow group">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-3 h-3 rounded-full ${s.color}`} />
                  <h3 className="text-sm font-semibold text-foreground">{s.name}</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{s.tasksToday} tâches aujourd'hui</span>
                    <span className="font-medium text-foreground">{s.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${s.color}`} style={{ width: `${s.progress}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Charge: {s.charge}</span>
                    <span>{s.tasksTotal} total</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* XP Progress */}
        <div className="bg-card rounded-xl border border-border p-5 card-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-secondary" />
              <h2 className="text-base font-semibold text-foreground">Progression</h2>
            </div>
            <span className="text-sm text-muted-foreground">{xp.toLocaleString()} / {xpForNextLevel.toLocaleString()} XP</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden mb-3">
            <div className="h-full gradient-xp rounded-full" style={{ width: `${xpPercent}%` }} />
          </div>
          <div className="flex gap-3 flex-wrap">
            <Badge icon="🔥" label={`Streak ${streak}j`} />
            <Badge icon="⚡" label="Speed Runner" />
            <Badge icon="📧" label="Email Master" />
            <Badge icon="🎯" label="Focus Pro" />
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

const StatCard = ({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) => (
  <div className="bg-card rounded-xl border border-border p-5 card-shadow">
    <div className="flex items-center gap-2 mb-2">
      {icon}
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
    <div className="text-2xl font-bold text-foreground">{value}</div>
    <p className="text-xs text-muted-foreground mt-1">{sub}</p>
  </div>
);

const AISuggestion = ({ text }: { text: string }) => (
  <div className="p-3 rounded-lg bg-secondary/5 border border-secondary/10 text-sm text-foreground">
    {text}
  </div>
);

const Badge = ({ icon, label }: { icon: string; label: string }) => (
  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/10 text-xs font-medium text-secondary">
    <span>{icon}</span>
    {label}
  </span>
);

export default Dashboard;
