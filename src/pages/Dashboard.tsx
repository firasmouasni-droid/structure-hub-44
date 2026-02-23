import AppLayout from "@/components/layout/AppLayout";
import { useStructures } from "@/hooks/useStructures";
import { useTasks } from "@/hooks/useTasks";
import { useUserStats } from "@/hooks/useUserStats";
import {
  TrendingUp, CheckCircle2, ArrowRight, Bot, Clock, CalendarDays, Flame, Zap, Target, BarChart3
} from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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

  // Category distribution for donut visual
  const categories = ["CALL", "EMAIL", "MEETING", "WRITE", "BUILD", "OTHER"];
  const catCounts = categories.map(c => ({ name: c, count: allTasks.filter(t => t.action_type === c).length }));
  const totalCat = catCounts.reduce((s, c) => s + c.count, 0) || 1;

  const catColors = ["hsl(263 85% 76%)", "hsl(214 95% 68%)", "hsl(330 90% 84%)", "hsl(160 72% 67%)", "hsl(48 96% 65%)", "hsl(260 30% 85%)"];

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
        {/* Header with gradient */}
        <div className="gradient-header rounded-3xl p-6 lg:p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl gradient-primary shadow-soft flex items-center justify-center text-primary-foreground font-bold text-lg">
                AM
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Bonjour Alexandre 👋</h1>
                <p className="text-muted-foreground text-sm mt-0.5 capitalize">
                  {dateStr} — {totalToday} tâches aujourd'hui
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 pill bg-white/70 backdrop-blur-sm shadow-soft">
                <Flame className="w-4 h-4 text-warning" />
                <span className="text-sm font-semibold text-foreground">{streak}j</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 pill bg-white/70 backdrop-blur-sm shadow-soft">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Niv. {level}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card-soft p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Score du jour</span>
              <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center">
                <Target className="w-4 h-4 text-primary" />
              </div>
            </div>
            <div className="text-3xl font-bold text-foreground">{score}%</div>
            <p className="text-xs text-muted-foreground mt-1">{completedToday}/{totalToday} complétées</p>
            {/* Mini progress */}
            <div className="h-2 bg-muted rounded-pill overflow-hidden mt-3">
              <div className="h-full gradient-primary rounded-pill transition-all duration-500" style={{ width: `${score}%` }} />
            </div>
          </div>

          <StatCard icon={<CheckCircle2 className="w-4 h-4 text-success" />} iconBg="bg-success/15" label="Complétées" value={`${completedToday}/${totalToday}`} sub="aujourd'hui" />
          <StatCard icon={<Clock className="w-4 h-4 text-accent" />} iconBg="bg-accent/15" label="Temps planifié" value={`${Math.floor(plannedMinutes / 60)}h${plannedMinutes % 60 > 0 ? String(plannedMinutes % 60).padStart(2, '0') : ''}`} sub={`${todayTasks.length} tâches`} />
          <StatCard icon={<CalendarDays className="w-4 h-4 text-secondary" />} iconBg="bg-secondary/15" label="Réunions" value={String(meetingsToday)} sub="aujourd'hui" />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Tasks today */}
          <div className="lg:col-span-2 card-soft p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-foreground">Tâches du jour</h2>
              <Link to="/tasks" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
                Voir tout <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="space-y-2">
              {todayTasks.length === 0 && <p className="text-sm text-muted-foreground py-6 text-center">Aucune tâche planifiée aujourd'hui ✨</p>}
              {todayTasks.map((task) => {
                const structure = structures.find(s => s.id === task.structure_id);
                return (
                  <div key={task.id} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-muted/50 transition-all duration-200">
                    <div className={`w-3 h-3 rounded-full ${structure?.color || 'bg-muted'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{task.action_label}</p>
                      <p className="text-xs text-muted-foreground">{structure?.name} · {task.estimated_duration ? `${task.estimated_duration} min` : '-'}</p>
                    </div>
                    <span className="text-[11px] font-medium px-2.5 py-1 pill bg-muted text-muted-foreground">{task.action_type}</span>
                    <span className={`text-[11px] font-medium px-2.5 py-1 pill ${
                      task.priority === "high" ? "bg-destructive/20 text-destructive-foreground" :
                      task.priority === "medium" ? "bg-warning/20 text-warning-foreground" :
                      "bg-muted text-muted-foreground"
                    }`}>{task.priority}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-5">
            {/* Category donut placeholder */}
            <div className="card-soft p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-bold text-foreground">Répartition</h2>
              </div>
              <div className="flex items-center justify-center py-2">
                <div className="relative w-28 h-28">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    {catCounts.reduce<{ offset: number; elements: React.ReactNode[] }>((acc, cat, i) => {
                      const pct = (cat.count / totalCat) * 100;
                      const el = (
                        <circle key={cat.name} cx="18" cy="18" r="14" fill="none" stroke={catColors[i]} strokeWidth="4"
                          strokeDasharray={`${pct} ${100 - pct}`} strokeDashoffset={`-${acc.offset}`} strokeLinecap="round" />
                      );
                      acc.elements.push(el);
                      acc.offset += pct;
                      return acc;
                    }, { offset: 0, elements: [] }).elements}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold text-foreground">{allTasks.length}</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1.5 mt-3">
                {catCounts.filter(c => c.count > 0).map((c, i) => (
                  <div key={c.name} className="flex items-center gap-1.5 text-[11px]">
                    <div className="w-2 h-2 rounded-full" style={{ background: catColors[i] }} />
                    <span className="text-muted-foreground">{c.name}</span>
                    <span className="font-medium text-foreground ml-auto">{c.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Coach IA */}
            <div className="card-soft p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl gradient-warm flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
                <h2 className="text-sm font-bold text-foreground">Coach IA</h2>
              </div>
              <div className="space-y-2">
                <div className="p-3 rounded-2xl bg-primary/8 text-sm text-foreground">
                  Tu as {todayTasks.filter(t => t.status === 'todo').length} tâches à faire. Veux-tu que je les priorise ?
                </div>
                <div className="p-3 rounded-2xl bg-warning/10 text-sm text-foreground">
                  🔥 {streak} jours de streak ! Continue !
                </div>
              </div>
              <Link to="/coach" className="mt-4 block">
                <button className="w-full py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold shadow-soft hover:shadow-soft-lg transition-all duration-200">
                  Ouvrir le Coach IA
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Structures */}
        <div>
          <h2 className="text-base font-bold text-foreground mb-4">Mes Structures</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {structureStats.map((s) => (
              <Link key={s.id} to={`/structure/${s.id}`} className="card-soft p-5 hover:shadow-soft-lg transition-all duration-200 group">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-3.5 h-3.5 rounded-full ${s.color}`} />
                  <h3 className="text-sm font-semibold text-foreground">{s.name}</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{s.tasksToday} aujourd'hui</span>
                    <span className="font-semibold text-foreground">{s.progress}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-pill overflow-hidden">
                    <div className={`h-full rounded-pill ${s.color} transition-all duration-500`} style={{ width: `${s.progress}%` }} />
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
        <div className="card-soft p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="text-base font-bold text-foreground">Progression</h2>
            </div>
            <span className="text-sm text-muted-foreground">{xp.toLocaleString()} / {xpForNextLevel.toLocaleString()} XP</span>
          </div>
          <div className="h-3 bg-muted rounded-pill overflow-hidden mb-4">
            <div className="h-full gradient-primary rounded-pill transition-all duration-500" style={{ width: `${xpPercent}%` }} />
          </div>
          <div className="flex gap-2 flex-wrap">
            <span className="pill text-[11px] px-3 py-1.5 bg-warning/15 text-warning-foreground font-medium">🔥 Streak {streak}j</span>
            <span className="pill text-[11px] px-3 py-1.5 bg-primary/15 text-primary font-medium">⚡ Speed Runner</span>
            <span className="pill text-[11px] px-3 py-1.5 bg-accent/15 text-accent font-medium">📧 Email Master</span>
            <span className="pill text-[11px] px-3 py-1.5 bg-success/15 text-success font-medium">🎯 Focus Pro</span>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

const StatCard = ({ icon, iconBg, label, value, sub }: { icon: React.ReactNode; iconBg: string; label: string; value: string; sub: string }) => (
  <div className="card-soft p-5">
    <div className="flex items-center justify-between mb-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className={`w-8 h-8 rounded-xl ${iconBg} flex items-center justify-center`}>
        {icon}
      </div>
    </div>
    <div className="text-2xl font-bold text-foreground">{value}</div>
    <p className="text-xs text-muted-foreground mt-1">{sub}</p>
  </div>
);

export default Dashboard;
