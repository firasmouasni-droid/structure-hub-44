import { useStructures, useCreateStructure } from "@/hooks/useStructures";
import { useLifeSpaces } from "@/hooks/useLifeSpaces";
import { Plus, Brain, ArrowRight, CheckSquare, Calendar, Bot, Lock, Sun, CalendarDays, AlertTriangle, Circle, CheckCircle2, LogOut, User, Settings } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { PageTransition, StaggerContainer, StaggerItem, HoverCard } from "@/components/motion/MotionWrappers";
import { motion, AnimatePresence } from "framer-motion";
import { useTasks, useUpdateTask } from "@/hooks/useTasks";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import WelcomeOnboarding from "@/components/onboarding/WelcomeOnboarding";
import MorningAuditDialog from "@/components/audit/MorningAuditDialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";
import { GradientCard } from "@/components/ui/GradientCard";
import { useUserStats } from "@/hooks/useUserStats";

const COLORS = [
  { label: "Lavande", value: "bg-primary" },
  { label: "Rose", value: "bg-secondary" },
  { label: "Bleu", value: "bg-accent" },
  { label: "Vert", value: "bg-success" },
  { label: "Orange", value: "bg-warning" },
];

const Home = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { data: structures = [], isLoading: structuresLoading } = useStructures();
  const { data: lifeSpaces = [], isLoading: spacesLoading } = useLifeSpaces();
  const { data: allTasks = [] } = useTasks({ isInbox: false });
  const { data: allEvents = [] } = useCalendarEvents();
  const { data: stats } = useUserStats();
  const updateTask = useUpdateTask();

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  const PRIORITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  const urgentTasks = allTasks
    .filter(t => t.status !== "done")
    .sort((a, b) => {
      const pa = PRIORITY_ORDER[a.priority] ?? 2;
      const pb = PRIORITY_ORDER[b.priority] ?? 2;
      if (pa !== pb) return pa - pb;
      if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
      if (a.due_date) return -1;
      if (b.due_date) return 1;
      return (b.urgency + b.importance) - (a.urgency + a.importance);
    })
    .slice(0, 3);

  const upcomingEvents = allEvents
    .filter(e => new Date(e.start_time) >= now)
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    .slice(0, 3);

  const createStructure = useCreateStructure();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [newStructure, setNewStructure] = useState({ name: "", color: "bg-primary", description: "" });
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);

  const isLoading = structuresLoading || spacesLoading;
  const level = stats?.level ?? 1;
  const xp = stats?.xp ?? 0;
  const xpInLevel = xp - (level - 1) * 1000;
  const xpPercent = Math.round((xpInLevel / 1000) * 100);

  useEffect(() => {
    if (!isLoading && structures.length === 0 && !onboardingDismissed) {
      setOnboardingOpen(true);
    }
  }, [isLoading, structures.length, onboardingDismissed]);

  const handleCreate = async () => {
    if (!newStructure.name.trim()) { toast.error("Donne un nom à ta structure"); return; }
    await createStructure.mutateAsync(newStructure);
    setDialogOpen(false);
    setNewStructure({ name: "", color: "bg-primary", description: "" });
    toast.success("Structure créée !");
  };

  const enabledSpaces = lifeSpaces.filter((s) => s.enabled);
  const disabledSpaces = lifeSpaces.filter((s) => !s.enabled);

  const motivationalPhrase = (() => {
    const hour = new Date().getHours();
    const urgentCount = urgentTasks.length;
    if (urgentCount === 0) {
      if (hour < 12) return "☀️ Aucune urgence ce matin, profite pour avancer !";
      if (hour < 17) return "🎯 Zéro urgence, c'est le moment de viser loin !";
      return "✨ Rien d'urgent, belle soirée pour planifier demain";
    }
    if (urgentCount === 1) {
      if (hour < 12) return "☀️ 1 tâche urgente t'attend, tu gères !";
      if (hour < 17) return "🚀 Plus qu'1 urgence à traiter, fonce !";
      return "✨ 1 urgence encore, un dernier effort ce soir ?";
    }
    if (urgentCount <= 3) {
      if (hour < 12) return `⚡ ${urgentCount} tâches urgentes, attaque les une par une !`;
      if (hour < 17) return `🔥 ${urgentCount} urgences en cours, reste focus !`;
      return `💪 ${urgentCount} urgences restantes, tu peux en venir à bout`;
    }
    return `🚨 ${urgentCount} tâches urgentes — priorise l'essentiel !`;
  })();

  return (
    <div className="min-h-screen bg-background">
      <PageTransition>
        <div className="max-w-5xl mx-auto px-5 py-6 space-y-7">
          {/* ── Header profil ── */}
          <motion.div
            className="relative overflow-hidden rounded-3xl p-6 sm:p-8"
            style={{
              background: "linear-gradient(135deg, hsl(var(--opal-pink) / 0.08), hsl(var(--opal-orange) / 0.06), hsl(var(--opal-green) / 0.04))"
            }}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <motion.button
                  onClick={() => setAvatarMenuOpen(prev => !prev)}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl overflow-hidden shadow-opal cursor-pointer border-2 border-border/30 hover:border-primary/40 transition-colors"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-opal-pink via-opal-purple to-accent flex items-center justify-center">
                      <User className="w-7 h-7 text-white" />
                    </div>
                  )}
                </motion.button>

                <AnimatePresence>
                  {avatarMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setAvatarMenuOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: -5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -5 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 mt-2 z-50 w-48 bg-card border border-border/30 rounded-2xl shadow-opal-hover overflow-hidden"
                      >
                        <button onClick={() => { setAvatarMenuOpen(false); navigate("/profile"); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-muted/50 transition-colors">
                          <User className="w-4 h-4" /> Profil
                        </button>
                        <button onClick={() => { setAvatarMenuOpen(false); navigate("/settings"); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-muted/50 transition-colors">
                          <Settings className="w-4 h-4" /> Paramètres
                        </button>
                        <div className="h-px bg-border/50" />
                        <button onClick={() => { setAvatarMenuOpen(false); signOut(); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-destructive hover:bg-destructive/5 transition-colors">
                          <LogOut className="w-4 h-4" /> Déconnexion
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
                  Hello, {profile?.display_name || "toi"} 👋
                </h1>
                <p className="text-sm text-muted-foreground mt-1 capitalize">
                  {format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
                </p>
              </div>
            </div>

            {/* Level bar */}
            <div className="mt-4 flex items-center gap-3">
              <span className="pill px-3 py-1 bg-card/80 text-xs font-bold text-foreground shadow-opal">⭐ Niv. {level}</span>
              <div className="flex-1 h-1.5 bg-card/60 rounded-pill overflow-hidden">
                <div className="h-full rounded-pill bg-gradient-to-r from-opal-pink via-opal-purple to-accent transition-all duration-500" style={{ width: `${xpPercent}%` }} />
              </div>
              <span className="text-[11px] text-muted-foreground">{xp} XP</span>
            </div>

            {/* Motivational + Actions */}
            <motion.p className="text-xs sm:text-sm text-muted-foreground mt-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
              {motivationalPhrase}
            </motion.p>

            <div className="flex items-center justify-between mt-3">
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.7 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setAuditOpen(true)}
                className="pill px-4 py-2 bg-card/80 shadow-opal flex items-center gap-2 cursor-pointer hover:bg-card transition-all"
              >
                <Sun className="w-4 h-4 text-warning" />
                <span className="text-xs font-bold text-foreground">Check-in</span>
              </motion.button>
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 1.0 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => signOut()}
                  className="pill p-2 bg-card/80 shadow-opal cursor-pointer hover:bg-destructive/5 transition-all"
                  title="Se déconnecter"
                >
                  <LogOut className="w-4 h-4 text-muted-foreground" />
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* ── QG Général + Raccourcis ── */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Link to="/life-hq">
                <GradientCard gradient="opal" className="p-4 flex flex-col items-center gap-2 text-center h-full">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-opal-pink via-opal-purple to-accent flex items-center justify-center">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs font-bold text-foreground">QG Général</span>
                  <span className="text-[10px] text-muted-foreground leading-tight">Cockpit stratégique</span>
                </GradientCard>
              </Link>
              {[
                { label: "Tâches", sub: "Tous espaces", icon: CheckSquare, path: "/global/tasks", iconBg: "bg-opal-pink/15 text-opal-pink" },
                { label: "Planning", sub: "Planning global", icon: Calendar, path: "/global/planning", iconBg: "bg-accent/15 text-accent" },
                { label: "Coach IA", sub: "Conseils perso", icon: Bot, path: "/global/coach", iconBg: "bg-opal-purple/15 text-opal-purple" },
              ].map((item) => (
                <Link key={item.path} to={item.path}>
                  <GradientCard gradient="none" className="p-4 flex flex-col items-center gap-2 cursor-pointer text-center h-full">
                    <div className={`w-11 h-11 rounded-2xl ${item.iconBg} flex items-center justify-center`}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-foreground">{item.label}</span>
                    <span className="text-[10px] text-muted-foreground leading-tight">{item.sub}</span>
                  </GradientCard>
                </Link>
              ))}
            </div>
          </motion.div>

          {/* ── Tâches urgentes ── */}
          {urgentTasks.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">Tâches urgentes</h2>
                <Link to="/global/tasks" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">Toutes <ArrowRight className="w-3 h-3" /></Link>
              </div>
              <AnimatePresence mode="popLayout">
                {urgentTasks.map(t => {
                  const struct = structures.find(s => s.id === t.structure_id);
                  const priorityStyle: Record<string, string> = {
                    critical: "bg-destructive/10 text-destructive",
                    high: "bg-warning/10 text-warning-foreground",
                    medium: "bg-primary/10 text-primary",
                    low: "bg-muted text-muted-foreground",
                  };
                  return (
                    <motion.div key={t.id} layout initial={{ opacity: 1 }} exit={{ opacity: 0, x: 80, height: 0 }} transition={{ duration: 0.35, ease: "easeInOut" }}>
                      <div className="bg-card rounded-3xl shadow-opal p-4 flex items-center gap-4">
                        <motion.button
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => { updateTask.mutate({ id: t.id, status: "done" }); toast.success(`"${t.action_label}" terminée ✓`); }}
                          className="w-9 h-9 rounded-2xl bg-muted/50 hover:bg-success/15 flex items-center justify-center shrink-0 transition-colors group"
                        >
                          <Circle className="w-5 h-5 text-muted-foreground group-hover:hidden" />
                          <CheckCircle2 className="w-5 h-5 text-success hidden group-hover:block" />
                        </motion.button>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{t.action_label}</p>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            {struct && <span>{struct.name}</span>}
                            {t.due_date && <span>· {t.due_date === todayStr ? "Aujourd'hui" : format(new Date(t.due_date), "d MMM", { locale: fr })}</span>}
                            {t.estimated_duration && <span>· {t.estimated_duration} min</span>}
                          </div>
                        </div>
                        <span className={`pill px-2 py-0.5 text-[10px] font-bold ${priorityStyle[t.priority] ?? priorityStyle.medium}`}>{t.priority}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ── Prochains événements ── */}
          {upcomingEvents.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">Prochains événements</h2>
                <Link to="/global/planning" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">Planning <ArrowRight className="w-3 h-3" /></Link>
              </div>
              <div className="space-y-2">
                {upcomingEvents.map(e => {
                  const eventDate = new Date(e.start_time);
                  const isToday = eventDate.toDateString() === now.toDateString();
                  const struct = structures.find(s => s.id === e.structure_id);
                  return (
                    <div key={e.id} className="bg-card rounded-3xl shadow-opal p-4 flex items-center gap-4">
                      <div className="flex flex-col items-center w-14 shrink-0">
                        <span className="text-sm font-bold text-primary">{format(eventDate, "HH:mm")}</span>
                        <span className="text-[10px] text-muted-foreground">{isToday ? "Aujourd'hui" : format(eventDate, "EEE d", { locale: fr })}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{e.title}</p>
                        {struct && <p className="text-[11px] text-muted-foreground">{struct.name}</p>}
                      </div>
                      <CalendarDays className="w-4 h-4 text-muted-foreground shrink-0" />
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ── Espaces de vie ── */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground">Espaces de vie</h2>
            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {enabledSpaces.map((space) => {
                const spaceStructures = structures.filter(s => s.life_space_id === space.id);
                const taskCount = allTasks.filter(t => spaceStructures.some(s => s.id === t.structure_id)).length;
                return (
                  <StaggerItem key={space.id}>
                    <Link to={`/spaces/${space.key}`}>
                      <GradientCard gradient="none" className="p-5 group cursor-pointer border border-border/30 hover:border-primary/30 transition-all">
                        <div className="flex items-center gap-4 mb-3">
                          <motion.div className={`w-13 h-13 rounded-2xl ${space.color} flex items-center justify-center shadow-soft`} whileHover={{ scale: 1.1, rotate: 5 }}>
                            <span className="text-2xl">{space.icon}</span>
                          </motion.div>
                          <div>
                            <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">{space.label}</h3>
                            <p className="text-[11px] text-muted-foreground">{space.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                          <span>{spaceStructures.length} structure{spaceStructures.length !== 1 ? "s" : ""}</span>
                          <span>·</span>
                          <span>{taskCount} tâche{taskCount !== 1 ? "s" : ""}</span>
                        </div>
                      </GradientCard>
                    </Link>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          </div>

          {/* ── Coming Soon ── */}
          {disabledSpaces.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Bientôt disponibles</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {disabledSpaces.map((space) => (
                  <Link key={space.id} to={`/spaces/${space.key}`}>
                    <motion.div whileHover={{ scale: 1.02 }} className="bg-card rounded-3xl shadow-opal p-4 flex flex-col items-center gap-3 opacity-50 hover:opacity-70 transition-opacity cursor-pointer relative">
                      <div className={`w-12 h-12 rounded-2xl ${space.color} flex items-center justify-center`}>
                        <span className="text-xl">{space.icon}</span>
                      </div>
                      <span className="text-xs font-semibold text-foreground text-center">{space.label}</span>
                      <span className="text-[10px] text-muted-foreground">Bientôt disponible</span>
                      <div className="absolute top-2 right-2"><Lock className="w-3 h-3 text-muted-foreground" /></div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* ── Structures ── */}
          {structures.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-foreground mb-4">Structures</h2>
              <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {structures.map((s) => {
                  const taskCount = allTasks.filter(t => t.structure_id === s.id).length;
                  const doneCount = allTasks.filter(t => t.structure_id === s.id && t.status === "done").length;
                  const progress = taskCount > 0 ? Math.round((doneCount / taskCount) * 100) : 0;
                  return (
                    <StaggerItem key={s.id}>
                      <Link to={`/structures/${s.id}/dashboard`}>
                        <GradientCard gradient="none" className="p-5 group cursor-pointer">
                          <div className="flex items-center gap-4 mb-4">
                            <motion.div className={`w-13 h-13 rounded-2xl ${s.color} flex items-center justify-center shadow-soft`} whileHover={{ scale: 1.1, rotate: 5 }}>
                              <span className="text-white text-xl font-bold">{s.name.charAt(0)}</span>
                            </motion.div>
                            <div>
                              <h2 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">{s.name}</h2>
                              {s.description && <p className="text-[11px] text-muted-foreground line-clamp-1">{s.description}</p>}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">{taskCount} tâches · {doneCount} faites</span>
                              <span className="font-bold text-foreground">{progress}%</span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-pill overflow-hidden">
                              <motion.div className="h-full rounded-pill bg-gradient-to-r from-primary to-accent" initial={{ width: 0 }} whileInView={{ width: `${progress}%` }} viewport={{ once: true }} transition={{ duration: 0.8, ease: "easeOut" }} />
                            </div>
                          </div>
                        </GradientCard>
                      </Link>
                    </StaggerItem>
                  );
                })}

                <StaggerItem>
                  <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (open) { setOnboardingOpen(false); setOnboardingDismissed(true); } }}>
                    <DialogTrigger asChild>
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="bg-card rounded-3xl shadow-opal p-6 border-2 border-dashed border-border/50 hover:border-primary/30 cursor-pointer flex flex-col items-center justify-center min-h-[180px] transition-all">
                        <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-3"><Plus className="w-7 h-7 text-muted-foreground" /></div>
                        <p className="text-sm font-semibold text-muted-foreground">Ajouter une structure</p>
                      </motion.div>
                    </DialogTrigger>
                    <DialogContent className="rounded-3xl border-border/30">
                      <DialogHeader><DialogTitle className="text-lg font-bold">Nouvelle structure</DialogTitle></DialogHeader>
                      <div className="space-y-4 mt-2">
                        <input placeholder="Nom (ex: Académia, Side Project...)" value={newStructure.name} onChange={e => setNewStructure(p => ({ ...p, name: e.target.value }))} className="w-full px-4 py-3 rounded-2xl border border-border/50 bg-card text-sm shadow-inner-soft focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors duration-300" />
                        <textarea placeholder="Description (optionnel)" value={newStructure.description} onChange={e => setNewStructure(p => ({ ...p, description: e.target.value }))} rows={2} className="w-full px-4 py-3 rounded-2xl border border-border/50 bg-card text-sm shadow-inner-soft focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors duration-300 resize-none" />
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-2">Couleur</p>
                          <div className="flex gap-2">
                            {COLORS.map(c => (
                              <motion.button key={c.value} whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => setNewStructure(p => ({ ...p, color: c.value }))} className={`w-10 h-10 rounded-2xl ${c.value} ${newStructure.color === c.value ? "ring-3 ring-foreground/30 ring-offset-2 ring-offset-background" : ""} transition-all`} />
                            ))}
                          </div>
                        </div>
                        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={handleCreate} disabled={createStructure.isPending} className="w-full py-3 rounded-pill bg-gradient-to-r from-opal-pink via-opal-purple to-accent text-white text-sm font-bold shadow-soft">
                          {createStructure.isPending ? "Création..." : "Créer la structure"}
                        </motion.button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </StaggerItem>
              </StaggerContainer>
            </div>
          )}

          {structures.length === 0 && !isLoading && (
            <div>
              <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (open) { setOnboardingOpen(false); setOnboardingDismissed(true); } }}>
                <DialogTrigger asChild>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="bg-card rounded-3xl shadow-opal p-6 border-2 border-dashed border-border/50 hover:border-primary/30 cursor-pointer flex flex-col items-center justify-center min-h-[140px] transition-all">
                    <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-3"><Plus className="w-7 h-7 text-muted-foreground" /></div>
                    <p className="text-sm font-semibold text-muted-foreground">Créer ta première structure</p>
                  </motion.div>
                </DialogTrigger>
                <DialogContent className="rounded-3xl border-border/30">
                  <DialogHeader><DialogTitle className="text-lg font-bold">Nouvelle structure</DialogTitle></DialogHeader>
                  <div className="space-y-4 mt-2">
                    <input placeholder="Nom (ex: Académia, Side Project...)" value={newStructure.name} onChange={e => setNewStructure(p => ({ ...p, name: e.target.value }))} className="w-full px-4 py-3 rounded-2xl border border-border/50 bg-card text-sm shadow-inner-soft focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors duration-300" />
                    <textarea placeholder="Description (optionnel)" value={newStructure.description} onChange={e => setNewStructure(p => ({ ...p, description: e.target.value }))} rows={2} className="w-full px-4 py-3 rounded-2xl border border-border/50 bg-card text-sm shadow-inner-soft focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors duration-300 resize-none" />
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Couleur</p>
                      <div className="flex gap-2">
                        {COLORS.map(c => (
                          <motion.button key={c.value} whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => setNewStructure(p => ({ ...p, color: c.value }))} className={`w-10 h-10 rounded-2xl ${c.value} ${newStructure.color === c.value ? "ring-3 ring-foreground/30 ring-offset-2 ring-offset-background" : ""} transition-all`} />
                        ))}
                      </div>
                    </div>
                    <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={handleCreate} disabled={createStructure.isPending} className="w-full py-3 rounded-pill bg-gradient-to-r from-opal-pink via-opal-purple to-accent text-white text-sm font-bold shadow-soft">
                      {createStructure.isPending ? "Création..." : "Créer la structure"}
                    </motion.button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {isLoading && <p className="text-sm text-muted-foreground text-center py-8">Chargement...</p>}

          <div className="flex justify-center">
            <Link to="/settings" className="text-sm text-muted-foreground hover:text-foreground transition-colors">⚙️ Paramètres</Link>
          </div>
        </div>
      </PageTransition>

      <WelcomeOnboarding open={onboardingOpen} onOpenChange={(open) => { setOnboardingOpen(open); if (!open) setOnboardingDismissed(true); }} />
      <MorningAuditDialog open={auditOpen} onOpenChange={setAuditOpen} />
    </div>
  );
};

export default Home;
