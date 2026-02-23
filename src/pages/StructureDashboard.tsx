import AppLayout from "@/components/layout/AppLayout";
import { useStructure } from "@/hooks/useStructures";
import { useTasksByStructure, useUpdateTask } from "@/hooks/useTasks";
import { useGoals } from "@/hooks/useGoals";
import { useIncrementXP } from "@/hooks/useUserStats";
import { CheckCircle2, Clock, TrendingUp, Bot, ArrowRight, Target } from "lucide-react";
import { useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { PageTransition, StaggerContainer, StaggerItem, HoverCard, FadeInSection } from "@/components/motion/MotionWrappers";
import { motion } from "framer-motion";

const StructureDashboard = () => {
  const { id } = useParams<{ id: string }>();
  const { data: structure } = useStructure(id || "");
  const { data: tasks = [] } = useTasksByStructure(id || "");
  const { data: goals = [] } = useGoals(id || "");
  const updateTask = useUpdateTask();
  const incrementXP = useIncrementXP();

  const today = new Date().toISOString().split("T")[0];
  const doneTasks = tasks.filter(t => t.status === "done").length;
  const todayCount = tasks.filter(t => t.due_date === today).length;
  const remaining = tasks.filter(t => t.status !== "done").length;
  const progress = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;

  const categories = ["CALL", "EMAIL", "MEETING", "WRITE", "BUILD", "OTHER"];
  const catCounts = categories.map(c => ({ name: c, count: tasks.filter(t => t.action_type === c).length }));
  const totalCat = catCounts.reduce((s, c) => s + c.count, 0) || 1;
  const catColors = ["hsl(263 85% 76%)", "hsl(214 95% 68%)", "hsl(330 90% 84%)", "hsl(160 72% 67%)", "hsl(48 96% 65%)", "hsl(260 30% 85%)"];

  const handleToggle = async (taskId: string, currentStatus: string) => {
    const next = currentStatus === "done" ? "todo" : "done";
    await updateTask.mutateAsync({ id: taskId, status: next });
    if (next === "done") { await incrementXP.mutateAsync(10); toast.success("+10 XP !"); }
  };

  if (!structure) return <AppLayout><div className="p-8 text-center text-muted-foreground">Chargement...</div></AppLayout>;

  return (
    <AppLayout>
      <PageTransition>
        <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
          {/* Header pastel */}
          <motion.div
            className="gradient-header rounded-3xl p-6"
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center gap-4">
              <motion.div
                className={`w-14 h-14 rounded-3xl ${structure.color} flex items-center justify-center shadow-soft`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.15 }}
              >
                <span className="text-white text-xl font-bold">{structure.name.charAt(0)}</span>
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{structure.name}</h1>
                <p className="text-sm text-muted-foreground">{tasks.length} tâches · {doneTasks} complétées</p>
              </div>
            </div>
          </motion.div>

          {/* Stats */}
          <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StaggerItem><QuickStat icon={<CheckCircle2 className="w-5 h-5" />} iconBg="bg-success/15 text-success" label="Complétées" value={`${doneTasks}/${tasks.length}`} /></StaggerItem>
            <StaggerItem><QuickStat icon={<Clock className="w-5 h-5" />} iconBg="bg-accent/15 text-accent" label="Aujourd'hui" value={String(todayCount)} /></StaggerItem>
            <StaggerItem><QuickStat icon={<TrendingUp className="w-5 h-5" />} iconBg="bg-primary/15 text-primary" label="Progression" value={`${progress}%`} /></StaggerItem>
            <StaggerItem><QuickStat icon={<Target className="w-5 h-5" />} iconBg="bg-secondary/15 text-secondary" label="Restantes" value={String(remaining)} /></StaggerItem>
          </StaggerContainer>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tasks */}
            <FadeInSection className="lg:col-span-2">
              <div className="card-soft p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-bold text-foreground">Tâches</h2>
                  <Link to="/tasks" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">Voir tout <ArrowRight className="w-3.5 h-3.5" /></Link>
                </div>
                <StaggerContainer className="space-y-2">
                  {tasks.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">Aucune tâche ✨</p>}
                  {tasks.slice(0, 8).map((task) => (
                    <StaggerItem key={task.id}>
                      <HoverCard
                        className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer"
                        onClick={() => handleToggle(task.id, task.status)}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${task.status === "done" ? "border-success bg-success" : "border-border"}`}>
                          {task.status === "done" && <span className="text-white text-[10px]">✓</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm truncate ${task.status === "done" ? "line-through text-muted-foreground" : "text-foreground font-medium"}`}>{task.action_label}</p>
                          <p className="text-[11px] text-muted-foreground">{task.due_date || '-'} · {task.estimated_duration ? `${task.estimated_duration} min` : '-'}</p>
                        </div>
                        <span className={`pill text-[10px] font-bold px-2.5 py-1 ${task.priority === "high" ? "bg-destructive/20 text-destructive-foreground" : task.priority === "medium" ? "bg-warning/20 text-warning-foreground" : "bg-muted text-muted-foreground"}`}>{task.priority}</span>
                      </HoverCard>
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              </div>
            </FadeInSection>

            {/* Right column */}
            <StaggerContainer className="space-y-5" delay={0.15}>
              {/* Donut */}
              <StaggerItem>
                <div className="card-soft p-5">
                  <h2 className="text-sm font-bold text-foreground mb-4">Répartition actions</h2>
                  <div className="flex items-center justify-center py-2">
                    <div className="relative w-24 h-24">
                      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                        {catCounts.reduce<{ offset: number; elements: React.ReactNode[] }>((acc, cat, i) => {
                          const pct = (cat.count / totalCat) * 100;
                          acc.elements.push(
                            <motion.circle
                              key={cat.name} cx="18" cy="18" r="14" fill="none" stroke={catColors[i]} strokeWidth="4"
                              strokeLinecap="round"
                              initial={{ strokeDasharray: "0 100", strokeDashoffset: `0` }}
                              animate={{ strokeDasharray: `${pct} ${100 - pct}`, strokeDashoffset: `-${acc.offset}` }}
                              transition={{ duration: 0.8, delay: 0.3 + i * 0.1, ease: "easeOut" }}
                            />
                          );
                          acc.offset += pct;
                          return acc;
                        }, { offset: 0, elements: [] }).elements}
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-base font-bold text-foreground">{tasks.length}</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 mt-3">
                    {catCounts.filter(c => c.count > 0).map((c, i) => (
                      <div key={c.name} className="flex items-center gap-1.5 text-[11px]">
                        <div className="w-2 h-2 rounded-full" style={{ background: catColors[i] }} />
                        <span className="text-muted-foreground">{c.name}</span>
                        <span className="font-bold text-foreground ml-auto">{c.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </StaggerItem>

              {/* AI */}
              <StaggerItem>
                <div className="card-soft p-5 border-l-4 border-primary">
                  <div className="flex items-center gap-2 mb-2">
                    <Bot className="w-4 h-4 text-primary" />
                    <h2 className="text-sm font-bold text-foreground">Conseils IA</h2>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">
                    Tu as {remaining} tâches restantes. Priorise les urgentes pour maximiser ta progression ! 🎯
                  </p>
                </div>
              </StaggerItem>

              {/* Objectives */}
              <StaggerItem>
                <div className="card-soft p-5">
                  <h2 className="text-sm font-bold text-foreground mb-3">Objectifs</h2>
                  <div className="space-y-3">
                    {goals.length === 0 && <p className="text-xs text-muted-foreground">Aucun objectif défini</p>}
                    {goals.map(g => {
                      const pct = g.target_value ? Math.round((g.current_value / g.target_value) * 100) : 0;
                      return (
                        <div key={g.id}>
                          <div className="flex justify-between text-xs mb-1.5">
                            <span className="text-foreground font-medium">{g.title}</span>
                            <span className="text-muted-foreground">{pct}%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-pill overflow-hidden">
                            <motion.div
                              className="h-full gradient-primary rounded-pill"
                              initial={{ width: 0 }}
                              whileInView={{ width: `${pct}%` }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </StaggerItem>
            </StaggerContainer>
          </div>
        </div>
      </PageTransition>
    </AppLayout>
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

export default StructureDashboard;
