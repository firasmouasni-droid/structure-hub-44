import { useTasks } from "@/hooks/useTasks";
import { useStructures } from "@/hooks/useStructures";
import { useGoals } from "@/hooks/useGoals";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { useUserStats } from "@/hooks/useUserStats";
import { useLifeSpaces } from "@/hooks/useLifeSpaces";
import { CheckCircle2, Clock, TrendingUp, Target, Flame, Zap, ArrowRight, Calendar, Brain, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useState } from "react";
import { PageTransition, StaggerContainer, StaggerItem, HoverCard, FadeInSection } from "@/components/motion/MotionWrappers";
import { motion } from "framer-motion";
import MorningAuditDialog from "@/components/audit/MorningAuditDialog";
import { Sun } from "lucide-react";

const LifeHQ = () => {
  const { data: tasks = [] } = useTasks();
  const { data: structures = [] } = useStructures();
  const { data: lifeSpaces = [] } = useLifeSpaces();
  const { data: goals = [] } = useGoals();
  const { data: stats } = useUserStats();
  const today = new Date().toISOString().split("T")[0];
  const { data: todayEvents = [] } = useCalendarEvents(today);
  const [auditOpen, setAuditOpen] = useState(false);

  const doneTasks = tasks.filter(t => t.status === "done").length;
  const activeTasks = tasks.filter(t => t.status !== "done").length;
  const progress = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;

  const xp = stats?.xp ?? 0;
  const level = stats?.level ?? 1;
  const streak = stats?.streak_days ?? 0;

  const enabledSpaces = lifeSpaces.filter(s => s.enabled);
  const disabledSpaces = lifeSpaces.filter(s => !s.enabled);

  // Per life-space metrics
  const spaceMetrics = enabledSpaces.map(ls => {
    const spaceStructures = structures.filter(s => s.life_space_id === ls.id);
    const spaceStructureIds = new Set(spaceStructures.map(s => s.id));
    const spaceTasks = tasks.filter(t => spaceStructureIds.has(t.structure_id));
    const spaceActive = spaceTasks.filter(t => t.status !== "done").length;
    const spaceDone = spaceTasks.filter(t => t.status === "done").length;
    const spaceEvents = todayEvents.filter(e => e.structure_id && spaceStructureIds.has(e.structure_id)).length;
    const spaceGoals = goals.filter(g => spaceStructureIds.has(g.structure_id));
    const goalsProgress = spaceGoals.length > 0
      ? Math.round(spaceGoals.reduce((sum, g) => sum + (g.target_value ? (g.current_value / g.target_value) * 100 : 0), 0) / spaceGoals.length)
      : null;

    return { ...ls, structureCount: spaceStructures.length, active: spaceActive, done: spaceDone, events: spaceEvents, goalsProgress };
  });

  return (
    <PageTransition>
      <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <motion.div className="gradient-header rounded-3xl p-6" initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-3xl gradient-primary flex items-center justify-center shadow-soft">
                <Brain className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">QG Général</h1>
                <p className="text-sm text-muted-foreground">
                  Cockpit de ta vie · <span className="capitalize">{format(new Date(), "EEEE d MMMM", { locale: fr })}</span>
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setAuditOpen(true)} className="pill px-3 py-1.5 bg-card/70 backdrop-blur-sm shadow-soft flex items-center gap-1.5 cursor-pointer hover:bg-primary/10 transition-all">
                <Sun className="w-3.5 h-3.5 text-warning" /><span className="text-xs font-bold text-foreground">Check-in</span>
              </motion.button>
              <div className="pill px-3 py-1.5 bg-card/70 backdrop-blur-sm shadow-soft flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-warning" /><span className="text-xs font-bold text-foreground">{streak}j</span>
              </div>
              <div className="pill px-3 py-1.5 gradient-warm shadow-soft flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-primary-foreground" /><span className="text-xs font-bold text-primary-foreground">Niv. {level}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Global Stats */}
        <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StaggerItem><QuickStat icon={<CheckCircle2 className="w-5 h-5" />} iconBg="bg-success/15 text-success" label="Tâches complétées" value={`${doneTasks}/${tasks.length}`} /></StaggerItem>
          <StaggerItem><QuickStat icon={<Clock className="w-5 h-5" />} iconBg="bg-accent/15 text-accent" label="Événements aujourd'hui" value={String(todayEvents.length)} /></StaggerItem>
          <StaggerItem><QuickStat icon={<TrendingUp className="w-5 h-5" />} iconBg="bg-primary/15 text-primary" label="Progression globale" value={`${progress}%`} /></StaggerItem>
          <StaggerItem><QuickStat icon={<Target className="w-5 h-5" />} iconBg="bg-secondary/15 text-secondary" label="Objectifs actifs" value={String(goals.filter(g => g.status === "active").length)} /></StaggerItem>
        </StaggerContainer>

        {/* Life Spaces Overview */}
        <FadeInSection>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Tes espaces de vie</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {spaceMetrics.map(space => (
                <Link key={space.id} to={`/spaces/${space.key}`}>
                  <HoverCard className="card-soft p-5 group cursor-pointer border-2 border-transparent hover:border-primary/30 transition-all h-full">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-12 h-12 rounded-2xl ${space.color} flex items-center justify-center shadow-soft`}>
                        <span className="text-xl">{space.icon}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">{space.label}</h3>
                        <p className="text-[11px] text-muted-foreground">{space.structureCount} structure{space.structureCount !== 1 ? "s" : ""}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <p className="text-lg font-bold text-foreground">{space.active}</p>
                        <p className="text-[10px] text-muted-foreground">En cours</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-foreground">{space.events}</p>
                        <p className="text-[10px] text-muted-foreground">Événements</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-foreground">{space.goalsProgress !== null ? `${space.goalsProgress}%` : "—"}</p>
                        <p className="text-[10px] text-muted-foreground">Objectifs</p>
                      </div>
                    </div>
                  </HoverCard>
                </Link>
              ))}

              {/* Disabled spaces */}
              {disabledSpaces.map(space => (
                <div key={space.id} className="card-soft p-5 opacity-50 relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-2xl ${space.color} flex items-center justify-center`}>
                      <span className="text-xl">{space.icon}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-foreground">{space.label}</h3>
                      <p className="text-[11px] text-muted-foreground">Bientôt disponible</p>
                    </div>
                    <Lock className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FadeInSection>

        {/* Today's schedule */}
        <FadeInSection delay={0.1}>
          <div className="card-soft p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-foreground">Agenda du jour</h2>
              <Link to="/global/planning" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">Voir le planning <ArrowRight className="w-3.5 h-3.5" /></Link>
            </div>
            <div className="space-y-2">
              {todayEvents.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  <Calendar className="w-6 h-6 mx-auto mb-1 text-primary/30" />Aucun événement aujourd'hui
                </p>
              )}
              {todayEvents.slice(0, 6).map(e => {
                const struct = structures.find(s => s.id === e.structure_id);
                return (
                  <div key={e.id} className="flex items-center gap-4 p-3 rounded-2xl border bg-primary/5 border-primary/15">
                    <span className="text-sm font-bold text-primary w-14 shrink-0">{format(new Date(e.start_time), "HH:mm")}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{e.title}</p>
                      {struct && <p className="text-[11px] text-muted-foreground">{struct.name}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </FadeInSection>

        {/* Objectives across all spaces */}
        <FadeInSection delay={0.15}>
          <div className="card-soft p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-foreground">Objectifs de vie</h2>
              <Link to="/global/objectives" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">Voir tout <ArrowRight className="w-3.5 h-3.5" /></Link>
            </div>
            <div className="space-y-3">
              {goals.length === 0 && <p className="text-sm text-muted-foreground text-center py-2">Aucun objectif défini</p>}
              {goals.filter(g => g.status === "active").slice(0, 5).map(g => {
                const pct = g.target_value ? Math.round((g.current_value / g.target_value) * 100) : 0;
                const struct = structures.find(s => s.id === g.structure_id);
                return (
                  <div key={g.id}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-foreground font-medium">{g.title}</span>
                      <span className="text-muted-foreground">{struct?.name} · {pct}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-pill overflow-hidden">
                      <motion.div className="h-full gradient-primary rounded-pill" initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} viewport={{ once: true }} transition={{ duration: 0.8 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </FadeInSection>

        {/* Gamification */}
        <FadeInSection delay={0.2}>
          <div className="card-soft p-6">
            <h2 className="text-base font-bold text-foreground mb-4">Ta progression</h2>
            <div className="flex items-center gap-4 mb-3">
              <div className="pill px-3 py-1.5 bg-primary/15 text-xs font-bold text-primary">⭐ Niveau {level}</div>
              <div className="pill px-3 py-1.5 bg-warning/15 text-xs font-bold text-warning-foreground">🔥 {streak} jours</div>
              <span className="text-sm text-muted-foreground ml-auto">{xp} XP</span>
            </div>
            <div className="h-2.5 bg-muted rounded-pill overflow-hidden">
              <div className="h-full gradient-primary rounded-pill transition-all duration-500" style={{ width: `${Math.round(((xp % 1000) / 1000) * 100)}%` }} />
            </div>
          </div>
        </FadeInSection>
      </div>

      <MorningAuditDialog open={auditOpen} onOpenChange={setAuditOpen} />
    </PageTransition>
  );
};

const QuickStat = ({ icon, iconBg, label, value }: { icon: React.ReactNode; iconBg: string; label: string; value: string }) => (
  <HoverCard className="card-soft p-5">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
      <div className={`w-9 h-9 rounded-2xl ${iconBg} flex items-center justify-center`}>{icon}</div>
    </div>
    <div className="text-xl font-bold text-foreground">{value}</div>
  </HoverCard>
);

export default LifeHQ;
