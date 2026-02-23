import { useBadges, useUserBadges, useXPEvents, useCheckBadges, XP_REWARDS } from "@/hooks/useGamification";
import { useUserStats } from "@/hooks/useUserStats";
import { useTasks, useWIPStatus, WIP_LIMITS } from "@/hooks/useTasks";
import { Trophy, Star, Brain, Zap, Mail, Target, Flame, Lock, CheckCircle2, Clock } from "lucide-react";
import { PageTransition, StaggerContainer, StaggerItem, HoverCard, FadeInSection } from "@/components/motion/MotionWrappers";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const CATEGORY_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  deep_work: { label: "Deep Work", icon: <Brain className="w-4 h-4" />, color: "bg-purple-500/15 text-purple-500" },
  wip: { label: "WIP / Kanban", icon: <Zap className="w-4 h-4" />, color: "bg-blue-500/15 text-blue-500" },
  email: { label: "Email Batching", icon: <Mail className="w-4 h-4" />, color: "bg-cyan-500/15 text-cyan-500" },
  tasks: { label: "Tâches", icon: <CheckCircle2 className="w-4 h-4" />, color: "bg-green-500/15 text-green-500" },
  streak: { label: "Streak", icon: <Flame className="w-4 h-4" />, color: "bg-orange-500/15 text-orange-500" },
  inbox: { label: "Inbox", icon: <Target className="w-4 h-4" />, color: "bg-pink-500/15 text-pink-500" },
  goals: { label: "Objectifs", icon: <Target className="w-4 h-4" />, color: "bg-yellow-500/15 text-yellow-500" },
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  task_completed: "Tâche complétée",
  deep_work_completed: "Deep Work terminé",
  wip_under_limit: "WIP sous le seuil",
  email_batch_respected: "Email batching respecté",
  inbox_zero: "Inbox Zéro",
  goal_completed: "Objectif atteint",
  badge_earned: "Badge débloqué",
  streak_day: "Jour de streak",
};

const GlobalGamification = () => {
  const { data: badges = [] } = useBadges();
  const { data: userBadges = [] } = useUserBadges();
  const { data: xpEvents = [] } = useXPEvents();
  const { data: stats } = useUserStats();
  const { data: tasks = [] } = useTasks();
  const wip = useWIPStatus();
  const { checkAndAward } = useCheckBadges();

  const earnedBadgeIds = new Set(userBadges.map(ub => ub.badge_id));
  const earnedCount = userBadges.length;
  const totalBadges = badges.length;

  const xp = stats?.xp ?? 0;
  const level = stats?.level ?? 1;
  const streak = stats?.streak_days ?? 0;
  const xpInLevel = xp - (level - 1) * 1000;
  const xpPercent = Math.round((xpInLevel / 1000) * 100);

  const doneTasks = tasks.filter(t => t.status === "done").length;

  // Auto-check badges on load
  useEffect(() => {
    if (badges.length > 0) {
      checkAndAward("tasks_completed", doneTasks);
      checkAndAward("streak_days", streak);
      if (!wip.globalExceeded) checkAndAward("wip_clean_days", 1);
    }
  }, [badges.length, doneTasks, streak, wip.globalExceeded]);

  // Group badges by category
  const categories = Array.from(new Set(badges.map(b => b.category)));

  return (
    <PageTransition>
      <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 min-w-0">
          <motion.div className="w-12 h-12 rounded-3xl bg-warning/15 flex items-center justify-center shadow-soft shrink-0" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}>
            <Trophy className="w-6 h-6 text-warning" />
          </motion.div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Gamification Scientifique</h1>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">Self-Determination Theory · Récompenses intrinsèques</p>
          </div>
        </div>

        {/* XP & Level overview */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StaggerItem>
            <HoverCard className="card-soft p-6 text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.1 }}
                className="w-20 h-20 mx-auto rounded-full gradient-primary flex items-center justify-center shadow-soft mb-3">
                <span className="text-2xl font-bold text-primary-foreground">{level}</span>
              </motion.div>
              <p className="text-sm font-bold text-foreground">Niveau {level}</p>
              <p className="text-xs text-muted-foreground mt-1">{xp.toLocaleString()} XP total</p>
              <div className="mt-3">
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-muted-foreground">Prochain niveau</span>
                  <span className="font-bold text-foreground">{xpInLevel}/1000</span>
                </div>
                <div className="h-2.5 bg-muted rounded-pill overflow-hidden">
                  <motion.div className="h-full gradient-primary rounded-pill" initial={{ width: 0 }} animate={{ width: `${xpPercent}%` }} transition={{ duration: 1 }} />
                </div>
              </div>
            </HoverCard>
          </StaggerItem>
          <StaggerItem>
            <HoverCard className="card-soft p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Flame className="w-8 h-8 text-warning" />
                <span className="text-4xl font-bold text-foreground">{streak}</span>
              </div>
              <p className="text-sm font-bold text-foreground">Jours de streak</p>
              <p className="text-xs text-muted-foreground mt-1">+{XP_REWARDS.streak_day} XP par jour actif</p>
            </HoverCard>
          </StaggerItem>
          <StaggerItem>
            <HoverCard className="card-soft p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Star className="w-8 h-8 text-primary" />
                <span className="text-4xl font-bold text-foreground">{earnedCount}</span>
                <span className="text-lg text-muted-foreground">/{totalBadges}</span>
              </div>
              <p className="text-sm font-bold text-foreground">Badges débloqués</p>
              <p className="text-xs text-muted-foreground mt-1">{Math.round((earnedCount / Math.max(totalBadges, 1)) * 100)}% de complétion</p>
            </HoverCard>
          </StaggerItem>
        </StaggerContainer>

        {/* XP sources breakdown */}
        <FadeInSection>
          <div className="card-soft p-6">
            <h2 className="text-base font-bold text-foreground mb-1">Sources d'XP (comportements scientifiques)</h2>
            <p className="text-xs text-muted-foreground mb-4">XP attribué pour les comportements utiles uniquement — pas de gamification punitive</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {Object.entries(XP_REWARDS).map(([key, amount]) => (
                <div key={key} className="p-3 rounded-xl bg-muted/30 text-center">
                  <p className="text-lg font-bold text-primary">+{amount}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{EVENT_TYPE_LABELS[key] || key}</p>
                </div>
              ))}
            </div>
          </div>
        </FadeInSection>

        {/* Badges by category */}
        {categories.map(cat => {
          const meta = CATEGORY_META[cat] || { label: cat, icon: <Star className="w-4 h-4" />, color: "bg-muted text-muted-foreground" };
          const catBadges = badges.filter(b => b.category === cat);

          return (
            <FadeInSection key={cat} delay={0.05}>
              <div className="card-soft p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${meta.color}`}>{meta.icon}</div>
                  <h2 className="text-base font-bold text-foreground">{meta.label}</h2>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {catBadges.filter(b => earnedBadgeIds.has(b.id)).length}/{catBadges.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {catBadges.map(badge => {
                    const earned = earnedBadgeIds.has(badge.id);
                    const ub = userBadges.find(u => u.badge_id === badge.id);
                    return (
                      <motion.div
                        key={badge.id}
                        whileHover={{ scale: 1.02 }}
                        className={`p-4 rounded-2xl border transition-all ${
                          earned
                            ? "bg-primary/5 border-primary/20 shadow-soft"
                            : "bg-muted/20 border-border/30 opacity-60"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{badge.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h3 className={`text-sm font-bold truncate ${earned ? "text-foreground" : "text-muted-foreground"}`}>
                                {badge.name}
                              </h3>
                              {earned ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                              ) : (
                                <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{badge.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-[10px] font-bold text-primary">+{badge.xp_reward} XP</span>
                              {earned && ub && (
                                <span className="text-[10px] text-muted-foreground">
                                  {format(new Date(ub.earned_at), "d MMM yyyy", { locale: fr })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </FadeInSection>
          );
        })}

        {/* Recent XP events */}
        <FadeInSection delay={0.1}>
          <div className="card-soft p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-primary" />
              <h2 className="text-base font-bold text-foreground">Historique XP récent</h2>
            </div>
            {xpEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Aucun événement XP enregistré</p>
            ) : (
              <StaggerContainer className="space-y-2">
                {xpEvents.slice(0, 15).map(ev => (
                  <StaggerItem key={ev.id}>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/20">
                      <span className="text-sm font-bold text-primary w-12 text-right">+{ev.xp_amount}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{ev.description || EVENT_TYPE_LABELS[ev.event_type] || ev.event_type}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {format(new Date(ev.created_at), "d MMM HH:mm", { locale: fr })}
                      </span>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            )}
          </div>
        </FadeInSection>
      </div>
    </PageTransition>
  );
};

export default GlobalGamification;
