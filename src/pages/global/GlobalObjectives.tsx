import { useGoals, useCreateGoal, useUpdateGoal, Goal } from "@/hooks/useGoals";
import { useTasks } from "@/hooks/useTasks";
import { useStructures } from "@/hooks/useStructures";
import { Target, Plus, Sparkles, ChevronDown, ChevronRight, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageTransition, StaggerContainer, StaggerItem, HoverCard } from "@/components/motion/MotionWrappers";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PERIODS = [
  { key: "all", label: "Tous" },
  { key: "weekly", label: "Semaine" },
  { key: "monthly", label: "Mois" },
  { key: "quarterly", label: "Trimestre" },
];

const DIFFICULTIES = [
  { key: "easy", label: "Facile", color: "bg-green-500/15 text-green-600" },
  { key: "medium", label: "Modéré", color: "bg-yellow-500/15 text-yellow-600" },
  { key: "hard", label: "Difficile", color: "bg-red-500/15 text-red-600" },
];

function GoalCard({ goal, subGoals, tasks, onDecompose, decomposing }: {
  goal: Goal;
  subGoals: Goal[];
  tasks: { action_label: string; status: string }[];
  onDecompose: (id: string) => void;
  decomposing: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const pct = goal.target_value ? Math.round((goal.current_value / goal.target_value) * 100) : 0;
  const diff = DIFFICULTIES.find(d => d.key === goal.difficulty) || DIFFICULTIES[1];
  const doneTasks = tasks.filter(t => t.status === "done").length;

  return (
    <HoverCard className="card-soft p-6">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-sm font-bold text-foreground">{goal.title}</h3>
          {goal.description && <p className="text-xs text-muted-foreground mt-0.5">{goal.description}</p>}
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`pill text-[10px] font-bold px-2 py-0.5 ${diff.color}`}>{diff.label}</span>
          <span className="pill text-[10px] font-bold px-2 py-0.5 bg-primary/15 text-primary">{goal.period}</span>
          {goal.status === "completed" && <CheckCircle2 className="w-4 h-4 text-green-500" />}
        </div>
      </div>

      {/* KPI & criteria */}
      <div className="flex flex-wrap gap-2 mb-3">
        {goal.kpi && (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-lg bg-accent/50 text-accent-foreground">
            📊 {goal.kpi} {goal.kpi_unit && `(${goal.kpi_unit})`}
          </span>
        )}
        {goal.end_date && (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-lg bg-accent/50 text-accent-foreground">
            📅 {goal.end_date}
          </span>
        )}
      </div>
      {goal.success_criteria && (
        <p className="text-[11px] text-muted-foreground mb-3 italic">✅ {goal.success_criteria}</p>
      )}

      {/* Progress ring + bar */}
      <div className="flex items-center gap-4 mb-3">
        <div className="relative w-14 h-14 shrink-0">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
            <motion.circle cx="18" cy="18" r="15" fill="none" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" initial={{ strokeDasharray: "0 100" }} whileInView={{ strokeDasharray: `${pct} ${100 - pct}` }} viewport={{ once: true }} transition={{ duration: 1 }} />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center"><span className="text-xs font-bold text-foreground">{pct}%</span></div>
        </div>
        <div className="flex-1">
          <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">Progression</span><span className="font-bold text-foreground">{goal.current_value} / {goal.target_value || '?'}</span></div>
          <div className="h-2 bg-muted rounded-pill overflow-hidden">
            <motion.div className="h-full gradient-primary rounded-pill" initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} viewport={{ once: true }} transition={{ duration: 0.8 }} />
          </div>
          {tasks.length > 0 && (
            <p className="text-[10px] text-muted-foreground mt-1">🎯 {doneTasks}/{tasks.length} tâches complétées</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {subGoals.length === 0 && goal.status !== "completed" && (
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => onDecompose(goal.id)}
            disabled={decomposing === goal.id}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-secondary/15 text-secondary hover:bg-secondary/25 transition-all disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {decomposing === goal.id ? "Décomposition MCII..." : "Décomposer (MCII)"}
          </motion.button>
        )}
        {subGoals.length > 0 && (
          <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
            {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            {subGoals.length} sous-objectifs
          </button>
        )}
      </div>

      {/* Sub-goals */}
      <AnimatePresence>
        {expanded && subGoals.length > 0 && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-3 space-y-2 border-l-2 border-primary/20 pl-3">
            {subGoals.map(sg => {
              const sgPct = sg.target_value ? Math.round((sg.current_value / sg.target_value) * 100) : 0;
              return (
                <div key={sg.id} className="p-3 rounded-xl bg-muted/30">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="text-xs font-bold text-foreground">{sg.title}</h4>
                    <span className="text-[10px] font-bold text-primary">{sgPct}%</span>
                  </div>
                  {sg.description && <p className="text-[10px] text-muted-foreground">{sg.description}</p>}
                  <div className="h-1.5 bg-muted rounded-pill overflow-hidden mt-2">
                    <div className="h-full gradient-primary rounded-pill" style={{ width: `${sgPct}%` }} />
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </HoverCard>
  );
}

function CreateGoalDialog({ structureId, structures, onCreated }: { structureId?: string; structures: { id: string; name: string }[]; onCreated: () => void }) {
  const createGoal = useCreateGoal();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", kpi: "", kpi_unit: "", target_value: "",
    end_date: "", success_criteria: "", difficulty: "medium", period: "monthly",
    structure_id: structureId || "",
  });

  const isValid = form.title.trim() && form.kpi.trim() && form.end_date && form.success_criteria.trim() && form.structure_id;

  const handleSubmit = () => {
    if (!isValid) return;
    createGoal.mutate({
      title: form.title, description: form.description || null,
      kpi: form.kpi, kpi_unit: form.kpi_unit || null,
      target_value: form.target_value ? Number(form.target_value) : null,
      end_date: form.end_date, success_criteria: form.success_criteria,
      difficulty: form.difficulty, period: form.period,
      structure_id: form.structure_id,
    }, {
      onSuccess: () => { toast.success("Objectif créé selon Locke & Latham 🎯"); setOpen(false); onCreated(); setForm({ title: "", description: "", kpi: "", kpi_unit: "", target_value: "", end_date: "", success_criteria: "", difficulty: "medium", period: "monthly", structure_id: structureId || "" }); },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex items-center gap-2 px-4 py-2 rounded-2xl gradient-primary text-primary-foreground shadow-soft text-sm font-bold">
          <Plus className="w-4 h-4" /> Nouvel objectif
        </motion.button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Target className="w-5 h-5 text-primary" /> Nouvel objectif (Locke & Latham)</DialogTitle>
          <p className="text-xs text-muted-foreground">Spécifique · Difficile · Mesurable · Daté · Avec feedback</p>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <div>
            <label className="text-xs font-bold text-foreground">Titre spécifique *</label>
            <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ex: Obtenir la certification Qualiopi" className="mt-1" />
          </div>
          <div>
            <label className="text-xs font-bold text-foreground">Description</label>
            <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Contexte et obstacles anticipés (MCII)" className="mt-1" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-foreground">KPI (indicateur) *</label>
              <Input value={form.kpi} onChange={e => setForm({ ...form, kpi: e.target.value })} placeholder="Ex: Score audit" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-bold text-foreground">Unité</label>
              <Input value={form.kpi_unit} onChange={e => setForm({ ...form, kpi_unit: e.target.value })} placeholder="Ex: %, points" className="mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-foreground">Valeur cible</label>
              <Input type="number" value={form.target_value} onChange={e => setForm({ ...form, target_value: e.target.value })} placeholder="100" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-bold text-foreground">Échéance *</label>
              <Input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} className="mt-1" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-foreground">Critères de réussite *</label>
            <Textarea value={form.success_criteria} onChange={e => setForm({ ...form, success_criteria: e.target.value })} placeholder="Comment saurez-vous que l'objectif est atteint ?" className="mt-1" rows={2} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-foreground">Difficulté</label>
              <Select value={form.difficulty} onValueChange={v => setForm({ ...form, difficulty: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DIFFICULTIES.map(d => <SelectItem key={d.key} value={d.key}>{d.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-bold text-foreground">Période</label>
              <Select value={form.period} onValueChange={v => setForm({ ...form, period: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Semaine</SelectItem>
                  <SelectItem value="monthly">Mois</SelectItem>
                  <SelectItem value="quarterly">Trimestre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {!structureId && (
              <div>
                <label className="text-xs font-bold text-foreground">Structure *</label>
                <Select value={form.structure_id} onValueChange={v => setForm({ ...form, structure_id: v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Choisir" /></SelectTrigger>
                  <SelectContent>
                    {structures.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSubmit} disabled={!isValid || createGoal.isPending}
            className="w-full py-2.5 rounded-2xl gradient-primary text-primary-foreground font-bold text-sm shadow-soft disabled:opacity-50 transition-all">
            {createGoal.isPending ? "Création..." : "Créer l'objectif 🎯"}
          </motion.button>
          {!isValid && <p className="text-[10px] text-destructive text-center">* Titre, KPI, échéance et critères de réussite sont obligatoires (Locke & Latham)</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}

const GlobalObjectives = () => {
  const { data: goals = [], isLoading } = useGoals();
  const { data: tasks = [] } = useTasks();
  const { data: structures = [] } = useStructures();
  const qc = useQueryClient();
  const [period, setPeriod] = useState("all");
  const [decomposing, setDecomposing] = useState<string | null>(null);

  const parentGoals = goals.filter(g => !g.parent_goal_id);
  const filtered = period === "all" ? parentGoals : parentGoals.filter(g => g.period === period);

  const handleDecompose = async (goalId: string) => {
    setDecomposing(goalId);
    try {
      const { data, error } = await supabase.functions.invoke("goal-decompose", { body: { goal_id: goalId } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`MCII : ${data.sub_goals_created} sous-objectifs + ${data.tasks_created} tâches créés 🧩`);
      qc.invalidateQueries({ queryKey: ["goals"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    } catch (err: any) { toast.error(err.message || "Erreur décomposition"); }
    setDecomposing(null);
  };

  // Feedback banner: completed goals recently
  const completedRecently = goals.filter(g => g.status === "completed");

  return (
    <PageTransition>
      <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div className="w-12 h-12 rounded-3xl bg-secondary/15 flex items-center justify-center shadow-soft" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}>
              <Target className="w-6 h-6 text-secondary" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Objectifs (Locke & Latham)</h1>
              <p className="text-sm text-muted-foreground">{parentGoals.length} objectifs · {goals.length - parentGoals.length} sous-objectifs</p>
            </div>
          </div>
          <CreateGoalDialog structures={structures} onCreated={() => qc.invalidateQueries({ queryKey: ["goals"] })} />
        </div>

        {/* Feedback banner */}
        {completedRecently.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20">
            <p className="text-sm font-bold text-green-700 dark:text-green-400">
              🏆 {completedRecently.length} objectif(s) atteint(s) ! Feedback : la progression constante bat la perfection.
            </p>
          </motion.div>
        )}

        <div className="flex items-center gap-1 p-1 bg-card/70 backdrop-blur-sm rounded-2xl shadow-soft w-fit">
          {PERIODS.map(p => (
            <motion.button key={p.key} onClick={() => setPeriod(p.key)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${period === p.key ? "gradient-primary text-primary-foreground shadow-soft" : "text-muted-foreground hover:text-foreground"}`}>
              {p.label}
            </motion.button>
          ))}
        </div>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isLoading && <p className="text-sm text-muted-foreground text-center py-8 col-span-2">Chargement...</p>}
          {!isLoading && filtered.length === 0 && (
            <StaggerItem className="col-span-2">
              <div className="card-soft p-10 text-center">
                <Target className="w-12 h-12 text-primary/30 mx-auto mb-3" />
                <p className="text-lg font-bold text-foreground">Aucun objectif</p>
                <p className="text-sm text-muted-foreground mt-1">Crée un objectif spécifique, mesurable et daté</p>
              </div>
            </StaggerItem>
          )}
          {filtered.map(g => (
            <StaggerItem key={g.id}>
              <GoalCard
                goal={g}
                subGoals={goals.filter(sg => sg.parent_goal_id === g.id)}
                tasks={tasks.filter(t => t.structure_id === g.structure_id)}
                onDecompose={handleDecompose}
                decomposing={decomposing}
              />
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </PageTransition>
  );
};

export default GlobalObjectives;
