import { useMemo, forwardRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStructures } from "@/hooks/useStructures";
import { useLifeSpaces } from "@/hooks/useLifeSpaces";
import { useTasks } from "@/hooks/useTasks";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { useUserStats } from "@/hooks/useUserStats";
import { useTodayAudit } from "@/hooks/useDailyAudit";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/motion/MotionWrappers";
import {
  Sparkles, ArrowRight, Play, Calendar, Zap,
  Battery, Brain, Clock, Trophy, Flame
} from "lucide-react";
import { format, isToday } from "date-fns";
import { fr } from "date-fns/locale";

/* ------------------------------------------------------------------ */
/*  Mini‑metric pill (forwardRef to avoid warnings)                    */
/* ------------------------------------------------------------------ */
const MiniMetric = forwardRef<HTMLDivElement, {
  icon: React.ElementType; label: string; value: string; gradient: string;
}>(({ icon: Icon, label, value, gradient }, ref) => (
  <div
    ref={ref}
    className="flex items-center gap-3 rounded-[20px] px-4 py-3 bg-card border border-border/30"
    style={{ boxShadow: "0 4px 20px -4px hsla(0,0%,0%,0.06)" }}
  >
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
      style={{ background: gradient }}
    >
      <Icon className="w-4 h-4 text-white" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium leading-tight">{label}</p>
      <p className="text-sm font-bold text-foreground truncate">{value}</p>
    </div>
  </div>
));
MiniMetric.displayName = "MiniMetric";

/* ------------------------------------------------------------------ */
/*  Task mini‑card                                                     */
/* ------------------------------------------------------------------ */
function TaskMiniCard({ task, structure }: { task: any; structure?: any }) {
  return (
    <div
      className="flex items-center gap-3 rounded-[18px] px-4 py-3.5 bg-card border border-border/30"
      style={{ boxShadow: "0 2px 16px -2px hsla(0,0%,0%,0.05)" }}
    >
      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
        task.priority === "high" ? "bg-opal-pink" :
        task.priority === "medium" ? "bg-opal-orange" :
        "bg-muted-foreground/30"
      }`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{task.action_label}</p>
        {structure && (
          <p className="text-[11px] text-muted-foreground mt-0.5">{structure.name}</p>
        )}
      </div>
      {task.estimated_duration && (
        <span className="text-[11px] text-muted-foreground font-medium shrink-0">
          {task.estimated_duration} min
        </span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */
const WorkSpacePage = () => {
  const navigate = useNavigate();
  const { data: structures = [] } = useStructures();
  const { data: lifeSpaces = [] } = useLifeSpaces();
  const { data: allTasks = [] } = useTasks();
  const today = format(new Date(), "yyyy-MM-dd");
  const { data: todayEvents = [] } = useCalendarEvents(today);
  const { data: stats } = useUserStats();
  const { data: audit } = useTodayAudit();

  // Work space filtering
  const workSpace = lifeSpaces.find((s) => s.key === "work");
  const workStructures = useMemo(
    () => (workSpace ? structures.filter((s) => s.life_space_id === workSpace.id) : []),
    [structures, workSpace]
  );
  const workStructureIds = useMemo(() => new Set(workStructures.map((s) => s.id)), [workStructures]);
  const workTasks = useMemo(() => allTasks.filter((t) => workStructureIds.has(t.structure_id)), [allTasks, workStructureIds]);

  // Today's tasks (due today or in_progress), limited to 3
  const priorityTasks = useMemo(() => {
    const todayOrActive = workTasks.filter(
      (t) => t.status !== "done" && (t.status === "in_progress" || (t.due_date && isToday(new Date(t.due_date))))
    );
    todayOrActive.sort((a, b) => {
      const prio = { high: 0, medium: 1, low: 2 };
      return (prio[a.priority as keyof typeof prio] ?? 2) - (prio[b.priority as keyof typeof prio] ?? 2);
    });
    return todayOrActive.slice(0, 3);
  }, [workTasks]);

  const pendingCount = workTasks.filter((t) => t.status !== "done").length;

  const workEvents = useMemo(
    () => todayEvents.filter((e) => !e.structure_id || workStructureIds.has(e.structure_id)),
    [todayEvents, workStructureIds]
  );
  const nextEvent = workEvents.length > 0 ? workEvents[0] : null;

  const energyLevel = audit?.energy_level ?? null;
  const level = stats?.level ?? 1;
  const xp = stats?.xp ?? 0;
  const streak = stats?.streak_days ?? 0;

  const insight = useMemo(() => {
    if (pendingCount === 0) return "Tu es à jour, beau travail 🌟";
    const stuckTasks = workTasks.filter((t) => t.status === "todo" && t.priority === "high");
    if (stuckTasks.length > 0) return `Tu as ${stuckTasks.length} tâche${stuckTasks.length > 1 ? "s" : ""} prioritaire${stuckTasks.length > 1 ? "s" : ""} en attente — concentre-toi dessus 💪`;
    if (priorityTasks.length > 0) return "Voilà ta priorité du moment ✨ — une étape à la fois.";
    return "Belle journée pour avancer 🌱";
  }, [pendingCount, workTasks, priorityTasks]);

  const topTask = priorityTasks[0];

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto px-4 sm:px-5 py-6 sm:py-8 space-y-6 sm:space-y-8 overflow-x-hidden">

        {/* ── 1. HEADER ── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">Travail</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Ton état aujourd'hui · {format(new Date(), "EEEE d MMMM", { locale: fr })}
          </p>
        </motion.div>

        {/* Mini‑metrics row — horizontal scroll on mobile, grid on desktop */}
        <motion.div
          className="flex sm:grid sm:grid-cols-3 gap-2 sm:gap-3 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible"
          style={{ scrollbarWidth: "none" }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05 }}
        >
          <div className="min-w-[140px] sm:min-w-0 flex-shrink-0 sm:flex-shrink">
            <MiniMetric
              icon={Battery}
              label="Charge"
              value={`${pendingCount} tâche${pendingCount !== 1 ? "s" : ""}`}
              gradient="linear-gradient(135deg, hsl(var(--opal-pink)), hsl(var(--opal-orange)))"
            />
          </div>
          <div className="min-w-[130px] sm:min-w-0 flex-shrink-0 sm:flex-shrink">
            <MiniMetric
              icon={Brain}
              label="Énergie"
              value={energyLevel ? `${energyLevel}/10` : "—"}
              gradient="linear-gradient(135deg, hsl(var(--opal-purple)), hsl(var(--opal-pink)))"
            />
          </div>
          <div className="min-w-[130px] sm:min-w-0 flex-shrink-0 sm:flex-shrink">
            <MiniMetric
              icon={Clock}
              label="Prochain"
              value={nextEvent ? format(new Date(nextEvent.start_time), "HH:mm") : "—"}
              gradient="linear-gradient(135deg, hsl(var(--opal-green)), hsl(var(--opal-purple)))"
            />
          </div>
        </motion.div>

        {/* ── 2. CARTE PRINCIPALE — "Ce qui compte maintenant" ── */}
        <motion.div
          className="relative rounded-[24px] sm:rounded-[28px] overflow-hidden"
          style={{
            background: "linear-gradient(160deg, hsl(var(--opal-purple) / 0.08), hsl(var(--opal-pink) / 0.06), hsl(var(--opal-green) / 0.04))",
            boxShadow: "0 8px 40px -8px hsla(250,60%,52%,0.1)",
          }}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.55, delay: 0.1 }}
        >
          <div className="px-5 sm:px-7 py-6 sm:py-8 space-y-4 sm:space-y-5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-opal-purple" />
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-opal-purple">
                Ce qui compte maintenant
              </span>
            </div>

            <p className="text-sm sm:text-base text-foreground/80 leading-relaxed">{insight}</p>

            {topTask && (
              <div className="rounded-[14px] sm:rounded-[16px] bg-card/70 backdrop-blur-sm border border-border/20 px-4 sm:px-5 py-3">
                <p className="text-sm font-semibold text-foreground truncate">{topTask.action_label}</p>
                {topTask.estimated_duration && (
                  <p className="text-xs text-muted-foreground mt-0.5">{topTask.estimated_duration} min estimées</p>
                )}
              </div>
            )}

            <button
              onClick={() => navigate("/global/tasks")}
              className="w-full rounded-full py-3 sm:py-3.5 font-bold text-white text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              style={{
                background: "linear-gradient(135deg, hsl(var(--opal-purple)), hsl(var(--opal-pink)))",
                boxShadow: "0 6px 28px -4px hsl(var(--opal-purple) / 0.35)",
              }}
            >
              <Play className="w-4 h-4" />
              Se mettre au travail
            </button>
          </div>
        </motion.div>

        {/* ── 3. TÂCHES DU JOUR (max 3) ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-bold text-foreground">Tâches du jour</h2>
            <Link to="/global/tasks" className="text-xs text-opal-purple font-semibold hover:underline flex items-center gap-1">
              Voir tout <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {priorityTasks.length > 0 ? (
            <div className="space-y-2">
              {priorityTasks.map((task) => {
                const structure = workStructures.find((s) => s.id === task.structure_id);
                return <TaskMiniCard key={task.id} task={task} structure={structure} />;
              })}
            </div>
          ) : (
            <div className="rounded-[18px] px-5 py-5 text-center bg-card border border-border/30"
              style={{ boxShadow: "0 2px 16px -2px hsla(0,0%,0%,0.04)" }}>
              <p className="text-sm text-muted-foreground">Aucune tâche pour aujourd'hui 🎉</p>
            </div>
          )}
        </div>

        {/* ── 4. PLANNING DU JOUR ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4 text-opal-green" />
              Planning
            </h2>
            <Link to="/global/planning" className="text-xs text-opal-purple font-semibold hover:underline flex items-center gap-1">
              Voir planning <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {nextEvent ? (
            <div
              className="rounded-[18px] px-4 sm:px-5 py-4 bg-card border border-border/30 flex items-center gap-3"
              style={{ boxShadow: "0 2px 16px -2px hsla(0,0%,0%,0.05)" }}
            >
              <div
                className="w-1.5 h-10 rounded-full shrink-0"
                style={{ background: nextEvent.color ?? "hsl(var(--opal-green))" }}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate">{nextEvent.title}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(nextEvent.start_time), "HH:mm")} — {format(new Date(nextEvent.end_time), "HH:mm")}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-[18px] px-5 py-5 text-center bg-card border border-border/30"
              style={{ boxShadow: "0 2px 16px -2px hsla(0,0%,0%,0.04)" }}>
              <p className="text-sm text-muted-foreground">Rien de prévu aujourd'hui 🎉</p>
            </div>
          )}
        </div>

        {/* ── 5. INSIGHT IA ── */}
        <motion.div
          className="rounded-[20px] sm:rounded-[22px] px-5 sm:px-6 py-4 sm:py-5 border border-opal-purple/15"
          style={{
            background: "linear-gradient(145deg, hsl(var(--opal-purple) / 0.05), hsl(var(--opal-pink) / 0.03))",
            boxShadow: "0 4px 24px -4px hsl(var(--opal-purple) / 0.08)",
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, hsl(var(--opal-purple)), hsl(var(--opal-pink)))" }}>
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-opal-purple mb-1">Insight</p>
              <p className="text-sm text-foreground/80 leading-relaxed">{insight}</p>
            </div>
          </div>
        </motion.div>

        {/* ── 6. GAMIFICATION ── */}
        <div className="flex items-center justify-center gap-4 sm:gap-5 py-3 sm:py-4">
          {[
            { icon: Trophy, label: `Niv. ${level}`, color: "text-opal-orange" },
            { icon: Zap, label: `${xp} XP`, color: "text-opal-purple" },
            { icon: Flame, label: `${streak}j streak`, color: "text-opal-pink" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <item.icon className={`w-4 h-4 ${item.color}`} />
              <span className="text-xs font-bold text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </PageTransition>
  );
};

export default WorkSpacePage;
