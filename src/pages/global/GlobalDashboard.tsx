import { useTasks, useWIPStatus, WIP_LIMITS } from "@/hooks/useTasks";
import { useStructures } from "@/hooks/useStructures";
import { useGoals } from "@/hooks/useGoals";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { useUserStats, useIncrementXP } from "@/hooks/useUserStats";
import { useRoutines } from "@/hooks/useRoutines";
import { useLifeSpaces } from "@/hooks/useLifeSpaces";
import { CheckCircle2, Clock, TrendingUp, Target, Flame, Zap, Bot, ArrowRight, Sparkles, CalendarDays, AlertTriangle, Compass } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { PageTransition, StaggerContainer, StaggerItem, HoverCard, FadeInSection } from "@/components/motion/MotionWrappers";
import { motion } from "framer-motion";
import { useUpdateTask } from "@/hooks/useTasks";
import RoutineOnboarding from "@/components/onboarding/RoutineOnboarding";
import GuidedDayDialog from "@/components/guided/GuidedDayDialog";
import { MetricTile } from "@/components/ui/MetricTile";
import { GradientCard } from "@/components/ui/GradientCard";
import { SectionHeader } from "@/components/ui/SectionHeader";

const GlobalDashboard = () => {
  const { data: tasks = [] } = useTasks();
  const { data: structures = [] } = useStructures();
  const { data: lifeSpaces = [] } = useLifeSpaces();
  const { data: goals = [] } = useGoals();
  const { data: stats } = useUserStats();
  const { data: routines = [] } = useRoutines();
  const updateTask = useUpdateTask();
  const incrementXP = useIncrementXP();
  const today = new Date().toISOString().split("T")[0];
  const { data: todayEvents = [] } = useCalendarEvents(today);

  const wip = useWIPStatus();

  const hasRoutine = routines.some(r => !r.structure_id);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);
  const [guidedOpen, setGuidedOpen] = useState(false);

  useEffect(() => {
    if (!hasRoutine && routines !== undefined && !onboardingDismissed) {
      const timer = setTimeout(() => setOnboardingOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [hasRoutine, onboardingDismissed, routines]);

  const doneTasks = tasks.filter(t => t.status === "done").length;
  const todayTasks = tasks.filter(t => t.due_date === today);
  const remaining = tasks.filter(t => t.status !== "done").length;
  const progress = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;
  const inboxTasks = tasks.filter(t => t.is_inbox);
  const importantTasks = tasks.filter(t => t.priority === "high" && t.status !== "done").slice(0, 5);

  const xp = stats?.xp ?? 0;
  const level = stats?.level ?? 1;
  const streak = stats?.streak_days ?? 0;

  const structureLoad = structures.map(s => {
    const sTasks = tasks.filter(t => t.structure_id === s.id && t.status !== "done");
    return { name: s.name, color: s.color, count: sTasks.length, id: s.id };
  }).sort((a, b) => b.count - a.count);

  const categories = ["CALL", "EMAIL", "MEETING", "WRITE", "BUILD", "OTHER"];
  const catCounts = categories.map(c => ({ name: c, count: tasks.filter(t => t.action_type === c).length }));
  const catColors = ["hsl(var(--opal-purple))", "hsl(var(--accent))", "hsl(var(--opal-pink))", "hsl(var(--opal-green))", "hsl(var(--warning))", "hsl(var(--muted-foreground))"];
  const totalCat = catCounts.reduce((s, c) => s + c.count, 0) || 1;

  const handleToggle = async (taskId: string, currentStatus: string) => {
    const next = currentStatus === "done" ? "todo" : "done";
    await updateTask.mutateAsync({ id: taskId, status: next });
    if (next === "done") { await incrementXP.mutateAsync(10); toast.success("+10 XP !"); }
  };

  return (
    <PageTransition>
      <div className="p-5 lg:p-8 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          className="relative overflow-hidden rounded-[32px] p-6 sm:p-8"
          style={{
            background: "linear-gradient(135deg, hsla(340,100%,73%,0.18) 0%, hsla(250,100%,74%,0.12) 50%, hsla(160,65%,63%,0.14) 100%)"
          }}
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-20" style={{ background: "radial-gradient(circle, hsla(340,100%,73%,0.6), transparent 70%)" }} />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">QG Général</h1>
              <p className="text-sm text-muted-foreground">Vue globale · <span className="capitalize">{format(new Date(), "EEEE d MMMM", { locale: fr })}</span></p>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setGuidedOpen(true)} className="rounded-full px-4 py-2 bg-white/80 backdrop-blur-sm shadow-[0_4px_16px_rgba(0,0,0,0.06)] flex items-center gap-2 cursor-pointer hover:bg-white transition-all border border-white/50">
                <Compass className="w-3.5 h-3.5 text-primary" /><span className="text-xs font-bold text-foreground">Mode guidé</span>
              </motion.button>
              <div className="rounded-full px-4 py-2 bg-white/80 backdrop-blur-sm shadow-[0_4px_16px_rgba(0,0,0,0.06)] flex items-center gap-2 border border-white/50">
                <Flame className="w-3.5 h-3.5 text-warning" /><span className="text-xs font-bold text-foreground">{streak}j</span>
              </div>
              <div className="rounded-full px-4 py-2 shadow-lg flex items-center gap-2 bg-charcoal">
                <Zap className="w-3.5 h-3.5 text-white" /><span className="text-xs font-bold text-white">Niv. {level}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StaggerItem><MetricTile icon={<CheckCircle2 className="w-5 h-5" />} iconBg="bg-opal-green/15 text-opal-green" label="Complétées" value={`${doneTasks}/${tasks.length}`} /></StaggerItem>
          <StaggerItem><MetricTile icon={<Clock className="w-5 h-5" />} iconBg="bg-accent/15 text-accent" label="Aujourd'hui" value={String(todayTasks.length)} /></StaggerItem>
          <StaggerItem><MetricTile icon={<TrendingUp className="w-5 h-5" />} iconBg="bg-opal-purple/15 text-opal-purple" label="Progression" value={`${progress}%`} progress={progress} /></StaggerItem>
          <StaggerItem><MetricTile icon={<Target className="w-5 h-5" />} iconBg="bg-opal-pink/15 text-opal-pink" label="Restantes" value={String(remaining)} /></StaggerItem>
        </StaggerContainer>

        {/* WIP Alert */}
        {wip.globalExceeded && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-3xl shadow-opal p-4 border-l-4 border-warning flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-foreground">WIP dépassé : {wip.globalWIP} tâches en cours (max {WIP_LIMITS.global})</p>
              <p className="text-xs text-muted-foreground mt-1">Termine ou mets en pause une tâche avant d'en commencer une nouvelle.</p>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Important Tasks */}
            <FadeInSection>
              <div className="bg-card rounded-3xl shadow-opal p-6">
                <SectionHeader title="Tâches importantes 🔥" action={<Link to="/global/tasks" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">Voir tout <ArrowRight className="w-3.5 h-3.5" /></Link>} />
                <StaggerContainer className="space-y-2">
                  {importantTasks.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">Aucune tâche haute priorité ✨</p>}
                  {importantTasks.map(task => {
                    const struct = structures.find(s => s.id === task.structure_id);
                    return (
                      <StaggerItem key={task.id}>
                        <motion.div whileHover={{ backgroundColor: "hsl(var(--muted) / 0.3)" }} className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-colors" onClick={() => handleToggle(task.id, task.status)}>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${task.status === "done" ? "border-opal-green bg-opal-green" : "border-border"}`}>
                            {task.status === "done" && <span className="text-white text-[10px]">✓</span>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm truncate ${task.status === "done" ? "line-through text-muted-foreground" : "text-foreground font-medium"}`}>{task.action_label}</p>
                            <p className="text-[11px] text-muted-foreground">{struct?.name || ''} · {task.due_date || '-'}</p>
                          </div>
                          <span className="pill text-[10px] font-bold px-2.5 py-1 bg-opal-pink/15 text-opal-pink">haute</span>
                        </motion.div>
                      </StaggerItem>
                    );
                  })}
                </StaggerContainer>
              </div>
            </FadeInSection>

            {/* Planning */}
            <FadeInSection delay={0.1}>
              <div className="bg-card rounded-3xl shadow-opal p-6">
                <SectionHeader title="Planning du jour" action={<Link to="/global/planning" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">Planning <ArrowRight className="w-3.5 h-3.5" /></Link>} />
                <div className="space-y-2">
                  {todayEvents.length === 0 && <p className="text-sm text-muted-foreground text-center py-4"><CalendarDays className="w-6 h-6 mx-auto mb-1 text-primary/30" />Aucun événement</p>}
                  {todayEvents.slice(0, 5).map(e => (
                    <div key={e.id} className="flex items-center gap-4 p-3 rounded-2xl bg-primary/5 border border-primary/10">
                      <span className="text-sm font-bold text-primary w-14 shrink-0">{format(new Date(e.start_time), "HH:mm")}</span>
                      <p className="text-sm font-semibold text-foreground flex-1">{e.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            </FadeInSection>

            {/* Structure load */}
            <FadeInSection delay={0.15}>
              <div className="bg-card rounded-3xl shadow-opal p-6">
                <h2 className="text-base font-bold text-foreground mb-5">Charge par espace de vie</h2>
                <div className="space-y-3">
                  {lifeSpaces.filter(ls => ls.enabled).map(ls => {
                    const spaceStructures = structures.filter(s => s.life_space_id === ls.id);
                    const spaceTaskCount = tasks.filter(t => spaceStructures.some(s => s.id === t.structure_id) && t.status !== "done").length;
                    return (
                      <Link key={ls.id} to={`/spaces/${ls.key}`} className="flex items-center gap-3 group">
                        <span className="text-lg shrink-0">{ls.icon}</span>
                        <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors flex-1">{ls.label}</span>
                        <span className="text-xs font-bold text-muted-foreground">{spaceTaskCount}</span>
                        <div className="w-20 h-1.5 bg-muted rounded-pill overflow-hidden">
                          <div className="h-full rounded-pill bg-gradient-to-r from-primary to-accent" style={{ width: `${Math.min(spaceTaskCount * 10, 100)}%` }} />
                        </div>
                      </Link>
                    );
                  })}
                  {structureLoad.length > 0 && (
                    <>
                      <div className="border-t border-border/30 my-2" />
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Par structure</p>
                      {structureLoad.map(s => (
                        <Link key={s.id} to={`/structures/${s.id}/dashboard`} className="flex items-center gap-3 group">
                          <div className={`w-3 h-3 rounded-full ${s.color} shrink-0`} />
                          <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors flex-1">{s.name}</span>
                          <span className="text-xs font-bold text-muted-foreground">{s.count}</span>
                          <div className="w-20 h-1.5 bg-muted rounded-pill overflow-hidden">
                            <div className="h-full rounded-pill bg-gradient-to-r from-primary to-accent" style={{ width: `${Math.min(s.count * 10, 100)}%` }} />
                          </div>
                        </Link>
                      ))}
                    </>
                  )}
                  {lifeSpaces.filter(ls => ls.enabled).length === 0 && structureLoad.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center">Aucun espace créé</p>
                  )}
                </div>
              </div>
            </FadeInSection>
          </div>

          {/* Right column */}
          <StaggerContainer className="space-y-5" delay={0.15}>
            {/* Donut */}
            <StaggerItem>
              <div className="bg-card rounded-3xl shadow-opal p-5">
                <h2 className="text-sm font-bold text-foreground mb-4">Répartition actions</h2>
                <div className="flex items-center justify-center py-2">
                  <div className="relative w-24 h-24">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      {catCounts.reduce<{ offset: number; elements: React.ReactNode[] }>((acc, cat, i) => {
                        const pct = (cat.count / totalCat) * 100;
                        acc.elements.push(
                          <motion.circle key={cat.name} cx="18" cy="18" r="14" fill="none" stroke={catColors[i]} strokeWidth="4" strokeLinecap="round"
                            initial={{ strokeDasharray: "0 100", strokeDashoffset: "0" }}
                            animate={{ strokeDasharray: `${pct} ${100 - pct}`, strokeDashoffset: `-${acc.offset}` }}
                            transition={{ duration: 0.8, delay: 0.3 + i * 0.1, ease: "easeOut" }}
                          />
                        );
                        acc.offset += pct;
                        return acc;
                      }, { offset: 0, elements: [] }).elements}
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center"><span className="text-base font-bold text-foreground">{tasks.length}</span></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1.5 mt-3">
                  {catCounts.filter(c => c.count > 0).map((c, i) => (
                    <div key={c.name} className="flex items-center gap-1.5 text-[11px]">
                      <div className="w-2 h-2 rounded-full" style={{ background: catColors[i] }} /><span className="text-muted-foreground">{c.name}</span><span className="font-bold text-foreground ml-auto">{c.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </StaggerItem>

            {/* Inbox */}
            <StaggerItem>
              <div className="bg-card rounded-3xl shadow-opal p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-foreground">Inbox IA ⚡</h2>
                  <Link to="/global/inbox" className="text-xs text-primary hover:underline">Voir</Link>
                </div>
                {inboxTasks.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-2"><Sparkles className="w-4 h-4 mx-auto mb-1 text-primary/30" />Inbox vide 🎉</p>
                ) : (
                  <p className="text-sm text-foreground font-medium">{inboxTasks.length} suggestion{inboxTasks.length > 1 ? 's' : ''} à traiter</p>
                )}
              </div>
            </StaggerItem>

            {/* Coach IA */}
            <StaggerItem>
              <GradientCard gradient="purple" className="p-5 border-l-4 border-charcoal">
                <div className="flex items-center gap-2 mb-2"><Bot className="w-4 h-4 text-primary" /><h2 className="text-sm font-bold text-foreground">Conseils IA</h2></div>
                <p className="text-sm text-foreground leading-relaxed">
                  Tu as {remaining} tâches restantes. {importantTasks.length > 0 ? `${importantTasks.length} sont urgentes ! 🎯` : "Tout roule ! ✨"}
                </p>
                <Link to="/global/coach" className="text-xs text-primary hover:underline mt-2 inline-block">Parler au coach →</Link>
              </GradientCard>
            </StaggerItem>

            {/* Objectives */}
            <StaggerItem>
              <div className="bg-card rounded-3xl shadow-opal p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-foreground">Objectifs</h2>
                  <Link to="/global/objectives" className="text-xs text-primary hover:underline">Voir</Link>
                </div>
                <div className="space-y-3">
                  {goals.length === 0 && <p className="text-xs text-muted-foreground">Aucun objectif défini</p>}
                  {goals.slice(0, 3).map(g => {
                    const pct = g.target_value ? Math.round((g.current_value / g.target_value) * 100) : 0;
                    return (
                      <div key={g.id}>
                        <div className="flex justify-between text-xs mb-1.5"><span className="text-foreground font-medium">{g.title}</span><span className="text-muted-foreground">{pct}%</span></div>
                        <div className="h-1.5 bg-muted rounded-pill overflow-hidden">
                          <motion.div className="h-full rounded-pill bg-gradient-to-r from-primary to-accent" initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} viewport={{ once: true }} transition={{ duration: 0.8 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </StaggerItem>

            {/* Gamification */}
            <StaggerItem>
              <div className="bg-card rounded-3xl shadow-opal p-5">
                <h2 className="text-sm font-bold text-foreground mb-3">Gamification</h2>
                <div className="flex items-center gap-3 mb-2">
                  <div className="pill px-3 py-1.5 bg-opal-purple/15 text-xs font-bold text-opal-purple">⭐ Niv. {level}</div>
                  <div className="pill px-3 py-1.5 bg-warning/15 text-xs font-bold text-warning-foreground">🔥 {streak}j</div>
                </div>
                <div className="flex items-center justify-between text-[11px] mb-1.5"><span className="text-muted-foreground">XP</span><span className="font-bold text-foreground">{xp}</span></div>
                <div className="h-1.5 bg-muted rounded-pill overflow-hidden">
                  <div className="h-full rounded-pill bg-gradient-to-r from-opal-pink via-opal-purple to-accent" style={{ width: `${Math.round(((xp % 1000) / 1000) * 100)}%` }} />
                </div>
              </div>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </div>
      <RoutineOnboarding open={onboardingOpen} onOpenChange={(open) => { setOnboardingOpen(open); if (!open) setOnboardingDismissed(true); }} />
      <GuidedDayDialog open={guidedOpen} onOpenChange={setGuidedOpen} />
    </PageTransition>
  );
};

export default GlobalDashboard;
