import AppLayout from "@/components/layout/AppLayout";
import { useStructures } from "@/hooks/useStructures";
import { useTasks } from "@/hooks/useTasks";
import { useUserStats } from "@/hooks/useUserStats";
import {
  TrendingUp, CheckCircle2, ArrowRight, Bot, Clock, CalendarDays, Flame, Zap, Target,
  Search, Sparkles, Mail, Timer, BarChart3, ChevronRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const Dashboard = () => {
  const { data: structures = [] } = useStructures();
  const { data: allTasks = [] } = useTasks({ isInbox: false });
  const { data: inboxTasks = [] } = useTasks({ isInbox: true });
  const { data: stats } = useUserStats();

  const today = new Date().toISOString().split("T")[0];
  const todayTasks = allTasks.filter(t => t.due_date === today);
  const completedToday = todayTasks.filter(t => t.status === "done").length;
  const totalToday = todayTasks.length;
  const score = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;
  const plannedMinutes = todayTasks.reduce((sum, t) => sum + (t.estimated_duration || 0), 0);
  const emailTasks = allTasks.filter(t => t.action_type === "EMAIL").length;
  const meetingsToday = todayTasks.filter(t => t.action_type === "MEETING");

  const xp = stats?.xp ?? 0;
  const level = stats?.level ?? 1;
  const streak = stats?.streak_days ?? 0;
  const xpForNextLevel = level * 1000;
  const xpInLevel = xp - (level - 1) * 1000;
  const xpPercent = Math.round((xpInLevel / 1000) * 100);

  const dateStr = format(new Date(), "EEEE d MMMM yyyy", { locale: fr });

  const structureStats = structures.map(s => {
    const sTasks = allTasks.filter(t => t.structure_id === s.id);
    const sDone = sTasks.filter(t => t.status === "done").length;
    const progress = sTasks.length > 0 ? Math.round((sDone / sTasks.length) * 100) : 0;
    const charge = sTasks.filter(t => t.status !== "done").length;
    return { ...s, tasksTotal: sTasks.length, progress, charge };
  });

  // Objectives mock (simple daily goals)
  const objectives = [
    { label: "Compléter 5 tâches", current: completedToday, target: 5, color: "text-primary" },
    { label: `${Math.floor(plannedMinutes / 60)}h de focus`, current: Math.min(plannedMinutes, 240), target: 240, color: "text-accent" },
    { label: "0 inbox pending", current: Math.max(0, 5 - inboxTasks.length), target: 5, color: "text-success" },
  ];

  // Timeline events for today
  const timeSlots = [
    { time: "09:00", label: "Deep Work", type: "deep", duration: "2h" },
    { time: "11:00", label: "Réunion équipe", type: "meeting", duration: "1h" },
    { time: "14:00", label: "Emails & Admin", type: "admin", duration: "1h" },
    { time: "15:00", label: "Deep Work", type: "deep", duration: "2h" },
  ];
  const slotStyles: Record<string, string> = {
    deep: "bg-primary/15 border-primary/25 text-primary",
    meeting: "bg-accent/15 border-accent/25 text-accent",
    admin: "bg-warning/15 border-warning/25 text-warning-foreground",
  };

  // Important tasks
  const importantTasks = allTasks.filter(t => t.priority === "high" && t.status !== "done").slice(0, 4);

  // Categories donut
  const categories = ["CALL", "EMAIL", "MEETING", "WRITE", "BUILD", "OTHER"];
  const catCounts = categories.map(c => ({ name: c, count: allTasks.filter(t => t.action_type === c).length }));
  const totalCat = catCounts.reduce((s, c) => s + c.count, 0) || 1;
  const catColors = ["hsl(263 85% 76%)", "hsl(214 95% 68%)", "hsl(330 90% 84%)", "hsl(160 72% 67%)", "hsl(48 96% 65%)", "hsl(260 30% 85%)"];

  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in pb-8">
        {/* ===== A — GRADIENT HEADER ===== */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/15 to-accent/10" />
          <div className="relative px-6 lg:px-8 pt-8 pb-10">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-3xl gradient-primary shadow-soft flex items-center justify-center text-primary-foreground font-bold text-xl ring-4 ring-white/50">
                    AM
                  </div>
                  <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Hello, Alexandre 👋</h1>
                    <p className="text-muted-foreground text-sm mt-0.5 capitalize">{dateStr}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="pill px-4 py-2 bg-white/70 backdrop-blur-sm shadow-soft flex items-center gap-2">
                    <Flame className="w-4 h-4 text-warning" />
                    <span className="text-sm font-bold text-foreground">{streak}j</span>
                  </div>
                  <div className="pill px-4 py-2 gradient-warm shadow-soft flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary-foreground" />
                    <span className="text-sm font-bold text-primary-foreground">Score {score}%</span>
                  </div>
                </div>
              </div>
              {/* Search */}
              <div className="relative max-w-lg">
                <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input type="text" placeholder="Rechercher une tâche, structure, objectif..." className="w-full pl-12 pr-5 py-3.5 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/50 shadow-soft text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
          {/* ===== B — PRODUCTIVITÉ DU JOUR ===== */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-4">Productivité du jour</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ProductivityCard
                icon={<CheckCircle2 className="w-5 h-5" />}
                iconGradient="gradient-primary"
                label="Tâches complétées"
                value={`${completedToday}/${totalToday}`}
                sub="aujourd'hui"
                progress={score}
              />
              <ProductivityCard
                icon={<Timer className="w-5 h-5" />}
                iconGradient="gradient-warm"
                label="Temps focus"
                value={`${Math.floor(plannedMinutes / 60)}h${plannedMinutes % 60 > 0 ? String(plannedMinutes % 60).padStart(2, '0') : ''}`}
                sub={`${todayTasks.length} blocs planifiés`}
                progress={Math.min(100, Math.round((plannedMinutes / 480) * 100))}
              />
              <ProductivityCard
                icon={<Mail className="w-5 h-5" />}
                iconGradient="bg-accent"
                label="Emails traités"
                value={String(emailTasks)}
                sub="aujourd'hui"
                progress={Math.min(100, emailTasks * 10)}
              />
            </div>
          </section>

          {/* ===== C — OBJECTIFS DU JOUR ===== */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">Objectifs du jour</h2>
              <Link to="/tasks" className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
                Voir mes objectifs <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {objectives.map((obj, i) => {
                const pct = obj.target > 0 ? Math.min(100, Math.round((obj.current / obj.target) * 100)) : 0;
                return (
                  <div key={i} className="card-soft p-5 flex items-center gap-4">
                    {/* Circle progress */}
                    <div className="relative w-16 h-16 shrink-0">
                      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                        <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                        <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(var(--primary))" strokeWidth="3"
                          strokeDasharray={`${pct} ${100 - pct}`} strokeLinecap="round" className="transition-all duration-700" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-bold text-foreground">{pct}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{obj.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{obj.current} / {obj.target}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ===== D — PLANNING DU JOUR ===== */}
            <section className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground">Planning du jour</h2>
                <Link to="/planning" className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
                  Voir le planning <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="card-soft p-5 space-y-3">
                {timeSlots.map((slot, i) => (
                  <div key={i} className={`flex items-center gap-4 p-3.5 rounded-2xl border ${slotStyles[slot.type] || 'bg-muted border-border'} transition-all`}>
                    <span className="text-sm font-bold w-14 shrink-0">{slot.time}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{slot.label}</p>
                    </div>
                    <span className="text-xs font-medium pill px-3 py-1 bg-white/50">{slot.duration}</span>
                  </div>
                ))}
                {meetingsToday.length > 0 && meetingsToday.map(m => (
                  <div key={m.id} className="flex items-center gap-4 p-3.5 rounded-2xl border bg-accent/15 border-accent/25 text-accent">
                    <CalendarDays className="w-4 h-4" />
                    <p className="text-sm font-semibold flex-1">{m.action_label}</p>
                    <span className="text-xs font-medium">{m.estimated_duration ? `${m.estimated_duration}min` : ''}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* ===== E — INBOX IA (mini) ===== */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground">Inbox IA ⚡</h2>
                <Link to="/inbox" className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
                  Voir tout <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="space-y-3">
                {inboxTasks.length === 0 && (
                  <div className="card-soft p-6 text-center">
                    <Sparkles className="w-8 h-8 text-primary mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Inbox vide 🎉</p>
                  </div>
                )}
                {inboxTasks.slice(0, 3).map((task) => {
                  const structure = structures.find(s => s.id === task.structure_id);
                  return (
                    <div key={task.id} className="card-soft p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-xl bg-primary/15 flex items-center justify-center">
                          <Sparkles className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <div className={`w-2 h-2 rounded-full ${structure?.color || 'bg-muted'}`} />
                        <span className="text-[11px] text-muted-foreground">{structure?.name}</span>
                      </div>
                      <p className="text-sm font-medium text-foreground mb-2 line-clamp-2">{task.action_label}</p>
                      <div className="flex gap-1.5">
                        <Link to="/inbox" className="pill px-3 py-1 bg-success/15 text-success-foreground text-[11px] font-semibold hover:bg-success/25 transition-all">✔ Accepter</Link>
                        <Link to="/inbox" className="pill px-3 py-1 bg-accent/15 text-accent text-[11px] font-semibold hover:bg-accent/25 transition-all">⏰ Planifier</Link>
                        <Link to="/inbox" className="pill px-3 py-1 bg-muted text-muted-foreground text-[11px] font-medium hover:bg-muted/80 transition-all">✖ Ignorer</Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* ===== F — TÂCHES IMPORTANTES ===== */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">Tâches importantes 🔥</h2>
              <Link to="/tasks" className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
                Voir tout <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {importantTasks.length === 0 && <p className="text-sm text-muted-foreground col-span-2 text-center py-4">Aucune tâche haute priorité ✨</p>}
              {importantTasks.map((task) => {
                const structure = structures.find(s => s.id === task.structure_id);
                return (
                  <div key={task.id} className="card-soft p-5 flex items-start gap-4 hover:shadow-soft-lg transition-all duration-200">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${structure?.color || 'bg-muted'}`}>
                      <span className="text-white text-xs font-bold">{structure?.name?.charAt(0) || '?'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{task.action_label}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="pill text-[10px] font-bold px-2 py-0.5 bg-destructive/20 text-destructive-foreground">haute</span>
                        <span className="text-[11px] text-muted-foreground">{task.due_date || 'Pas de date'}</span>
                      </div>
                      {/* Mini progress bar */}
                      <div className="h-1.5 bg-muted rounded-pill overflow-hidden mt-2.5">
                        <div className="h-full gradient-warm rounded-pill" style={{ width: task.status === "in_progress" ? "50%" : "0%" }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ===== STRUCTURES ===== */}
            <section className="lg:col-span-2">
              <h2 className="text-lg font-bold text-foreground mb-4">Mes Structures</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {structureStats.map((s) => (
                  <Link key={s.id} to={`/structure/${s.id}`} className="card-soft p-5 hover:shadow-soft-lg transition-all duration-200 group">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 rounded-2xl ${s.color} flex items-center justify-center`}>
                        <span className="text-white text-sm font-bold">{s.name.charAt(0)}</span>
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-foreground">{s.name}</h3>
                        <p className="text-[11px] text-muted-foreground">{s.charge} restantes · {s.tasksTotal} total</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-muted-foreground">Progression</span>
                      <span className="font-bold text-foreground">{s.progress}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-pill overflow-hidden">
                      <div className={`h-full rounded-pill ${s.color} transition-all duration-500`} style={{ width: `${s.progress}%` }} />
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* ===== G — CONSEILS IA ===== */}
            <section>
              <h2 className="text-lg font-bold text-foreground mb-4">Conseils IA 💡</h2>
              <div className="space-y-3">
                <div className="card-soft p-5 border-l-4 border-primary">
                  <div className="flex items-center gap-2 mb-2">
                    <Bot className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold text-primary">Coach IA</span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">
                    Tu as {todayTasks.filter(t => t.status === 'todo').length} tâches à faire. Commence par les plus urgentes pour booster ton score ! 🚀
                  </p>
                </div>
                <div className="card-soft p-5 border-l-4 border-success">
                  <p className="text-sm text-foreground leading-relaxed">
                    🔥 {streak} jours de streak ! Tu es sur une bonne lancée, continue !
                  </p>
                </div>
                <Link to="/coach" className="block">
                  <button className="w-full py-3 rounded-2xl gradient-primary text-primary-foreground text-sm font-bold shadow-soft hover:shadow-soft-lg transition-all">
                    💬 Ouvrir le Coach IA
                  </button>
                </Link>
              </div>
            </section>
          </div>

          {/* ===== XP & GAMIFICATION ===== */}
          <section className="card-soft p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl gradient-warm flex items-center justify-center shadow-soft">
                  <TrendingUp className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">Progression</h2>
                  <p className="text-xs text-muted-foreground">Niveau {level}</p>
                </div>
              </div>
              <span className="text-sm font-medium text-muted-foreground">{xp.toLocaleString()} / {xpForNextLevel.toLocaleString()} XP</span>
            </div>
            <div className="h-3 bg-muted rounded-pill overflow-hidden mb-4">
              <div className="h-full gradient-primary rounded-pill transition-all duration-700" style={{ width: `${xpPercent}%` }} />
            </div>
            <div className="flex gap-2 flex-wrap">
              <span className="pill text-[11px] px-3.5 py-1.5 bg-warning/15 text-warning-foreground font-semibold">🔥 Streak {streak}j</span>
              <span className="pill text-[11px] px-3.5 py-1.5 bg-primary/15 text-primary font-semibold">⚡ Speed Runner</span>
              <span className="pill text-[11px] px-3.5 py-1.5 bg-accent/15 text-accent font-semibold">📧 Email Master</span>
              <span className="pill text-[11px] px-3.5 py-1.5 bg-success/15 text-success font-semibold">🎯 Focus Pro</span>
            </div>
          </section>
        </div>
      </div>
    </AppLayout>
  );
};

const ProductivityCard = ({ icon, iconGradient, label, value, sub, progress }: {
  icon: React.ReactNode; iconGradient: string; label: string; value: string; sub: string; progress: number;
}) => (
  <div className="card-soft p-5">
    <div className="flex items-center justify-between mb-3">
      <span className="text-sm text-muted-foreground font-medium">{label}</span>
      <div className={`w-9 h-9 rounded-2xl ${iconGradient} flex items-center justify-center text-primary-foreground shadow-soft`}>
        {icon}
      </div>
    </div>
    <div className="text-2xl font-bold text-foreground">{value}</div>
    <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
    {/* Sparkline-like progress */}
    <div className="h-1.5 bg-muted rounded-pill overflow-hidden mt-3">
      <div className="h-full gradient-primary rounded-pill transition-all duration-700" style={{ width: `${progress}%` }} />
    </div>
  </div>
);

export default Dashboard;
