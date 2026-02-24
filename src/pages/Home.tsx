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
        <div className="max-w-5xl mx-auto px-5 py-6 space-y-8">
          {/* ── Header profil ── */}
          <motion.div
            className="pt-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <motion.button
                    onClick={() => setAvatarMenuOpen(prev => !prev)}
                    className="w-14 h-14 rounded-full overflow-hidden cursor-pointer ring-2 ring-border/50 hover:ring-primary/40 transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <User className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </motion.button>

                  <AnimatePresence>
                    {avatarMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setAvatarMenuOpen(false)} />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -4 }}
                          transition={{ duration: 0.12 }}
                          className="absolute top-full left-0 mt-2 z-50 w-48 bg-card border border-border/50 rounded-2xl shadow-lg overflow-hidden"
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
                <div>
                  <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
                    {profile?.display_name || "Mon Life OS"}
                  </h1>
                  <p className="text-sm text-muted-foreground capitalize">
                    {format(new Date(), "EEEE d MMMM", { locale: fr })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full px-3 py-1 bg-muted text-xs font-bold text-foreground">🔥 {stats?.streak_days ?? 0}</span>
                <ThemeToggle />
              </div>
            </div>

            {/* Level bar */}
            <div className="mt-4 flex items-center gap-3">
              <span className="rounded-full px-3 py-1.5 bg-charcoal text-xs font-bold text-white">⭐ Niv. {level}</span>
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, hsl(var(--opal-pink)), hsl(var(--opal-purple)), hsl(var(--opal-green)))" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${xpPercent}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
              <span className="text-xs text-muted-foreground font-medium">{xp} XP</span>
            </div>

            <p className="text-sm text-muted-foreground mt-3">{motivationalPhrase}</p>
          </motion.div>

          {/* ── Quick Actions ── */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setAuditOpen(true)}
              className="rounded-full px-5 py-2.5 bg-charcoal text-white text-sm font-semibold flex items-center gap-2"
            >
              <Sun className="w-4 h-4" />
              Check-in du matin
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => signOut()}
              className="rounded-full p-2.5 bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
              title="Se déconnecter"
            >
              <LogOut className="w-4 h-4" />
            </motion.button>
          </motion.div>

          {/* ── Shortcuts Grid ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "QG Général", sub: "Cockpit stratégique", icon: Brain, path: "/life-hq", accent: true },
                { label: "Tâches", sub: "Tous espaces", icon: CheckSquare, path: "/global/tasks", iconTint: "text-opal-green", iconBg: "bg-opal-green/10" },
                { label: "Planning", sub: "Planning global", icon: Calendar, path: "/global/planning", iconTint: "text-accent", iconBg: "bg-accent/10" },
                { label: "Coach IA", sub: "Conseils perso", icon: Bot, path: "/global/coach", iconTint: "text-opal-pink", iconBg: "bg-opal-pink/10" },
              ].map((item, idx) => (
                <Link key={item.path} to={item.path}>
                  <motion.div
                    whileHover={{ y: -4, scale: 1.02 }}
                    initial={{ opacity: 0, y: 20, scale: 0.93 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.2 + idx * 0.08, duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className={`rounded-[20px] p-5 flex flex-col gap-3 h-full transition-colors ${
                      item.accent 
                        ? "bg-charcoal text-white" 
                        : "bg-card border border-border/40 hover:border-border"
                    }`}
                  >
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                      item.accent ? "bg-white/15" : (item.iconBg || "bg-muted")
                    }`}>
                      <item.icon className={`w-5 h-5 ${item.accent ? "text-white" : (item.iconTint || "text-foreground")}`} />
                    </div>
                    <div>
                      <span className={`text-sm font-bold block ${item.accent ? "text-white" : "text-foreground"}`}>{item.label}</span>
                      <span className={`text-[11px] ${item.accent ? "text-white/60" : "text-muted-foreground"}`}>{item.sub}</span>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>

          {/* ── Tâches urgentes ── */}
          {urgentTasks.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="space-y-3">
              <h2 className="text-lg font-bold text-foreground tracking-tight">Tâches urgentes</h2>
              <AnimatePresence mode="popLayout">
                {urgentTasks.map(t => {
                  const struct = structures.find(s => s.id === t.structure_id);
                  return (
                    <motion.div key={t.id} layout initial={{ opacity: 1 }} exit={{ opacity: 0, x: 80, height: 0 }} transition={{ duration: 0.3 }}>
                      <div className="rounded-[16px] bg-card border border-border/40 p-4 flex items-center gap-4">
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => { updateTask.mutate({ id: t.id, status: "done" }); toast.success(`"${t.action_label}" terminée ✓`); }}
                          className="w-8 h-8 rounded-full border-2 border-border hover:border-opal-green hover:bg-opal-green/10 flex items-center justify-center shrink-0 transition-colors group"
                        >
                          <Circle className="w-4 h-4 text-muted-foreground group-hover:hidden" />
                          <CheckCircle2 className="w-4 h-4 text-opal-green hidden group-hover:block" />
                        </motion.button>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{t.action_label}</p>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                            {struct && <span>{struct.name}</span>}
                            {t.due_date && <span>· {t.due_date === todayStr ? "Aujourd'hui" : format(new Date(t.due_date), "d MMM", { locale: fr })}</span>}
                          </div>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold text-white ${
                          t.priority === "critical" ? "bg-destructive" : 
                          t.priority === "high" ? "bg-opal-pink" : 
                          t.priority === "medium" ? "bg-opal-orange" : "bg-muted-foreground"
                        }`}>{t.priority}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              <Link to="/global/tasks" className="text-xs text-muted-foreground font-medium hover:text-foreground flex items-center gap-1 justify-center pt-1">
                Voir toutes les tâches <ArrowRight className="w-3 h-3" />
              </Link>
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
