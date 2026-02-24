import { useTasks } from "@/hooks/useTasks";
import { useStructures } from "@/hooks/useStructures";
import { useGoals } from "@/hooks/useGoals";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { useUserStats } from "@/hooks/useUserStats";
import { useLifeSpaces } from "@/hooks/useLifeSpaces";
import { CheckCircle2, Clock, TrendingUp, Target, Flame, Zap, ArrowRight, Calendar, Brain, Lock, Sun, Battery, Smile, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useState } from "react";
import { PageTransition, StaggerContainer, StaggerItem, HoverCard, FadeInSection } from "@/components/motion/MotionWrappers";
import { motion } from "framer-motion";
import MorningAuditDialog from "@/components/audit/MorningAuditDialog";
import WeeklyTrendsChart from "@/components/audit/WeeklyTrendsChart";
import { useTodayAudit } from "@/hooks/useDailyAudit";
import { MetricTile } from "@/components/ui/MetricTile";
import { GradientCard } from "@/components/ui/GradientCard";
import { SectionHeader } from "@/components/ui/SectionHeader";

const LifeHQ = () => {
  const { data: tasks = [] } = useTasks();
  const { data: structures = [] } = useStructures();
  const { data: lifeSpaces = [] } = useLifeSpaces();
  const { data: goals = [] } = useGoals();
  const { data: stats } = useUserStats();
  const today = new Date().toISOString().split("T")[0];
  const { data: todayEvents = [] } = useCalendarEvents(today);
  const [auditOpen, setAuditOpen] = useState(false);
  const { data: todayAudit, isLoading: auditLoading } = useTodayAudit();
  const doneTasks = tasks.filter(t => t.status === "done").length;
  const activeTasks = tasks.filter(t => t.status !== "done").length;
  const progress = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;

  const xp = stats?.xp ?? 0;
  const level = stats?.level ?? 1;
  const streak = stats?.streak_days ?? 0;

  const enabledSpaces = lifeSpaces.filter(s => s.enabled);
  const disabledSpaces = lifeSpaces.filter(s => !s.enabled);

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
      <div className="p-5 lg:p-8 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          className="rounded-3xl p-6"
          style={{ background: "linear-gradient(135deg, hsl(var(--opal-pink) / 0.08), hsl(var(--opal-purple) / 0.06), hsl(var(--opal-green) / 0.04))" }}
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-opal-pink via-opal-purple to-accent flex items-center justify-center shadow-soft">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">QG Général</h1>
                <p className="text-sm text-muted-foreground">
                  Vision stratégique · <span className="capitalize">{format(new Date(), "EEEE d MMMM", { locale: fr })}</span>
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setAuditOpen(true)} className="pill px-3 py-1.5 bg-card/80 shadow-opal flex items-center gap-1.5 cursor-pointer hover:bg-card transition-all">
                <Sun className="w-3.5 h-3.5 text-warning" /><span className="text-xs font-bold text-foreground">Check-in</span>
              </motion.button>
              <div className="pill px-3 py-1.5 bg-card/80 shadow-opal flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-warning" /><span className="text-xs font-bold text-foreground">{streak}j</span>
              </div>
              <div className="pill px-3 py-1.5 bg-gradient-to-r from-opal-pink to-opal-purple shadow-soft flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-white" /><span className="text-xs font-bold text-white">Niv. {level}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StaggerItem><MetricTile icon={<CheckCircle2 className="w-5 h-5" />} iconBg="bg-opal-green/15 text-opal-green" label="Complétées" value={`${doneTasks}/${tasks.length}`} /></StaggerItem>
          <StaggerItem><MetricTile icon={<Clock className="w-5 h-5" />} iconBg="bg-accent/15 text-accent" label="Événements" value={String(todayEvents.length)} /></StaggerItem>
          <StaggerItem><MetricTile icon={<TrendingUp className="w-5 h-5" />} iconBg="bg-opal-purple/15 text-opal-purple" label="Progression" value={`${progress}%`} progress={progress} /></StaggerItem>
          <StaggerItem><MetricTile icon={<Target className="w-5 h-5" />} iconBg="bg-opal-pink/15 text-opal-pink" label="Objectifs actifs" value={String(goals.filter(g => g.status === "active").length)} /></StaggerItem>
        </StaggerContainer>

        {/* Check-in */}
        <FadeInSection>
          {todayAudit ? (
            <div className="bg-card rounded-3xl shadow-opal p-5 border-l-4 border-opal-green">
              <div className="flex items-center gap-3 mb-3">
                <Sun className="w-5 h-5 text-warning" />
                <h2 className="text-sm font-bold text-foreground">Check-in du jour</h2>
                <span className="text-[10px] text-muted-foreground ml-auto">Fait aujourd'hui ✓</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Battery className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">Énergie</p>
                    <p className="text-sm font-bold text-foreground">{todayAudit.energy_level}/5</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Smile className="w-4 h-4 text-warning" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">Humeur</p>
                    <p className="text-sm font-bold text-foreground capitalize">{
                      ({ neutral: "Neutre", motivated: "Motivé", stressed: "Stressé", anxious: "Anxieux", calm: "Calme", happy: "Content" } as Record<string, string>)[todayAudit.mood] ?? todayAudit.mood
                    }</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-accent" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">Clarté mentale</p>
                    <p className="text-sm font-bold text-foreground capitalize">{
                      ({ clear: "Claire", normal: "Normale", fog: "Brumeuse" } as Record<string, string>)[todayAudit.mental_clarity] ?? todayAudit.mental_clarity
                    }</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-secondary" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">Objectif du jour</p>
                    <p className="text-sm font-bold text-foreground capitalize">{
                      ({ balance: "Équilibre", productivity: "Productivité", recovery: "Récupération", slow: "Tranquille" } as Record<string, string>)[todayAudit.day_objective] ?? todayAudit.day_objective
                    }</p>
                  </div>
                </div>
              </div>
            </div>
          ) : !auditLoading ? (
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setAuditOpen(true)}
              className="w-full bg-card rounded-3xl shadow-opal p-5 border-l-4 border-warning cursor-pointer hover:bg-muted/30 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-warning" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-foreground">Tu n'as pas encore fait ton check-in</p>
                  <p className="text-xs text-muted-foreground">Évalue ton énergie, humeur et clarté mentale pour adapter ta journée</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </motion.button>
          ) : null}
        </FadeInSection>

        {/* Life Spaces */}
        <FadeInSection>
          <SectionHeader title="Tes espaces de vie" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {spaceMetrics.map(space => (
              <Link key={space.id} to={`/spaces/${space.key}`}>
                <GradientCard gradient="none" className="p-5 group cursor-pointer border border-border/30 hover:border-primary/30 transition-all h-full">
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
                </GradientCard>
              </Link>
            ))}
            {disabledSpaces.map(space => (
              <div key={space.id} className="bg-card rounded-3xl shadow-opal p-5 opacity-50 relative">
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
        </FadeInSection>

        {/* Agenda */}
        <FadeInSection delay={0.1}>
          <div className="bg-card rounded-3xl shadow-opal p-6">
            <SectionHeader title="Agenda du jour" action={<Link to="/global/planning" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">Planning <ArrowRight className="w-3.5 h-3.5" /></Link>} />
            <div className="space-y-2">
              {todayEvents.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  <Calendar className="w-6 h-6 mx-auto mb-1 text-primary/30" />Aucun événement
                </p>
              )}
              {todayEvents.slice(0, 6).map(e => {
                const struct = structures.find(s => s.id === e.structure_id);
                return (
                  <div key={e.id} className="flex items-center gap-4 p-3 rounded-2xl bg-primary/5 border border-primary/10">
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

        {/* Objectifs */}
        <FadeInSection delay={0.15}>
          <div className="bg-card rounded-3xl shadow-opal p-6">
            <SectionHeader title="Objectifs de vie" action={<Link to="/global/objectives" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">Voir tout <ArrowRight className="w-3.5 h-3.5" /></Link>} />
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
                    <div className="h-1.5 bg-muted rounded-pill overflow-hidden">
                      <motion.div className="h-full rounded-pill bg-gradient-to-r from-primary to-accent" initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} viewport={{ once: true }} transition={{ duration: 0.8 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </FadeInSection>

        {/* Weekly Trends */}
        <FadeInSection delay={0.2}>
          <WeeklyTrendsChart />
        </FadeInSection>

        {/* Gamification */}
        <FadeInSection delay={0.2}>
          <div className="bg-card rounded-3xl shadow-opal p-6">
            <h2 className="text-base font-bold text-foreground mb-4">Ta progression</h2>
            <div className="flex items-center gap-4 mb-3">
              <div className="pill px-3 py-1.5 bg-opal-purple/15 text-xs font-bold text-opal-purple">⭐ Niveau {level}</div>
              <div className="pill px-3 py-1.5 bg-warning/15 text-xs font-bold text-warning-foreground">🔥 {streak} jours</div>
              <span className="text-sm text-muted-foreground ml-auto">{xp} XP</span>
            </div>
            <div className="h-2 bg-muted rounded-pill overflow-hidden">
              <div className="h-full rounded-pill bg-gradient-to-r from-opal-pink via-opal-purple to-accent transition-all duration-500" style={{ width: `${Math.round(((xp % 1000) / 1000) * 100)}%` }} />
            </div>
          </div>
        </FadeInSection>
      </div>

      <MorningAuditDialog open={auditOpen} onOpenChange={setAuditOpen} />
    </PageTransition>
  );
};

const QuickStat = ({ icon, iconBg, label, value }: { icon: React.ReactNode; iconBg: string; label: string; value: string }) => (
  <HoverCard className="bg-card rounded-3xl shadow-opal p-5">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
      <div className={`w-9 h-9 rounded-2xl ${iconBg} flex items-center justify-center`}>{icon}</div>
    </div>
    <div className="text-xl font-bold text-foreground">{value}</div>
  </HoverCard>
);

export default LifeHQ;
