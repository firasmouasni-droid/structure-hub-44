import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Clock, Scissors, Wand2, CheckCircle2, XCircle, Loader2, ArrowRight, ChevronDown, ChevronUp, CalendarCheck, AlertTriangle, PartyPopper } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface DayPlanItem {
  task_id: string;
  original_label: string;
  start_time: string;
  end_time: string;
  block_type: string;
  block_label: string;
}

interface Split {
  original_task_id: string;
  original_label: string;
  original_duration: number;
  subtasks: { label: string; duration: number; action_type: string }[];
}

interface Reformulation {
  task_id: string;
  original_label: string;
  improved_label: string;
  reason: string;
}

interface Deferred {
  task_id: string;
  label: string;
  reason: string;
}

interface GuidedDayResult {
  day_plan: DayPlanItem[];
  splits: Split[];
  reformulations: Reformulation[];
  deferred: Deferred[];
  encouragement: string;
  total_planned_minutes: number;
  routine_used: string;
  date: string;
  message?: string;
}

interface GuidedDayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BLOCK_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  deep_work: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20" },
  admin: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
  meetings: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
  email: { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/20" },
};

export default function GuidedDayDialog({ open, onOpenChange }: GuidedDayDialogProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GuidedDayResult | null>(null);
  const [validating, setValidating] = useState(false);
  const [showSplits, setShowSplits] = useState(false);
  const [showReformulations, setShowReformulations] = useState(false);
  const [showDeferred, setShowDeferred] = useState(false);
  const [acceptedReformulations, setAcceptedReformulations] = useState<Set<string>>(new Set());
  const qc = useQueryClient();

  const generatePlan = async () => {
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("guided-day", { body: {} });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data as GuidedDayResult);
      // Auto-accept all reformulations by default
      const allReformIds = new Set((data as GuidedDayResult).reformulations.map((r: Reformulation) => r.task_id));
      setAcceptedReformulations(allReformIds);
    } catch (e: any) {
      toast.error(e.message || "Erreur de génération");
    }
    setLoading(false);
  };

  const validateDay = async () => {
    if (!result) return;
    setValidating(true);
    const today = new Date().toISOString().split("T")[0];

    try {
      // 1. Apply accepted reformulations
      for (const ref of result.reformulations) {
        if (acceptedReformulations.has(ref.task_id)) {
          await supabase.from("tasks").update({
            action_label: ref.improved_label,
            is_refined: true,
          }).eq("id", ref.task_id);
        }
      }

      // 2. Create subtasks for splits
      for (const split of result.splits) {
        for (const sub of split.subtasks) {
          await supabase.from("tasks").insert({
            action_label: sub.label,
            action_type: sub.action_type,
            estimated_duration: sub.duration,
            parent_task_id: split.original_task_id,
            due_date: today,
            status: "todo",
            priority: "medium",
            source: "ai",
            // Get structure_id from the parent task plan item
            structure_id: result.day_plan.find(p => p.task_id === split.original_task_id)
              ? result.day_plan.find(p => p.task_id === split.original_task_id)!.task_id
              : undefined as any, // Will be resolved below
          });
        }
      }

      // 3. Create calendar events for planned tasks
      for (const item of result.day_plan) {
        await supabase.from("calendar_events").insert({
          title: acceptedReformulations.has(item.task_id)
            ? (result.reformulations.find(r => r.task_id === item.task_id)?.improved_label || item.original_label)
            : item.original_label,
          start_time: `${today}T${item.start_time}:00`,
          end_time: `${today}T${item.end_time}:00`,
          source: "ai",
          color: item.block_type === "deep_work" ? "#6366F1" : item.block_type === "email" ? "#3B82F6" : item.block_type === "meetings" ? "#F59E0B" : "#8B5CF6",
        });

        // Update task due_date
        await supabase.from("tasks").update({ due_date: today }).eq("id", item.task_id);
      }

      toast.success("Journée validée ! Votre plan est prêt 🎯");
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["calendar_events"] });
      onOpenChange(false);
      setResult(null);
    } catch (e: any) {
      toast.error(e.message || "Erreur de validation");
    }
    setValidating(false);
  };

  const toggleReformulation = (taskId: string) => {
    setAcceptedReformulations(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  // Auto-generate on open
  useEffect(() => {
    if (open && !result && !loading) {
      generatePlan();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden border-border/50 bg-card max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-border/30">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="w-12 h-12 rounded-3xl gradient-primary flex items-center justify-center shadow-soft"
            >
              <CalendarCheck className="w-6 h-6 text-primary-foreground" />
            </motion.div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Journée guidée</h2>
              <p className="text-xs text-muted-foreground">L'IA prépare votre journée idéale à valider</p>
            </div>
          </div>
        </div>

        <div className="p-6 pt-4">
          <AnimatePresence mode="wait">
            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-16 gap-4"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-10 h-10 text-primary" />
                </motion.div>
                <div className="text-center">
                  <p className="text-sm font-bold text-foreground">Préparation de votre journée...</p>
                  <p className="text-xs text-muted-foreground mt-1">Analyse des tâches, découpage intelligent, reformulation IA</p>
                </div>
              </motion.div>
            )}

            {!loading && result?.message && (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <AlertTriangle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">{result.message}</p>
              </motion.div>
            )}

            {!loading && result && !result.message && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5"
              >
                {/* Encouragement */}
                <div className="flex items-start gap-2 p-3 rounded-2xl bg-primary/5 border border-primary/10">
                  <PartyPopper className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-xs text-foreground">{result.encouragement}</p>
                </div>

                {/* Summary bar */}
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    {Math.round(result.total_planned_minutes / 60 * 10) / 10}h planifiées
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {result.day_plan.length} tâches
                  </span>
                  {result.splits.length > 0 && (
                    <span className="flex items-center gap-1 text-amber-400">
                      <Scissors className="w-3.5 h-3.5" />
                      {result.splits.length} découpées
                    </span>
                  )}
                  {result.reformulations.length > 0 && (
                    <span className="flex items-center gap-1 text-purple-400">
                      <Wand2 className="w-3.5 h-3.5" />
                      {result.reformulations.length} reformulées
                    </span>
                  )}
                </div>

                {/* Day plan timeline */}
                <div className="space-y-1.5">
                  <h3 className="text-sm font-bold text-foreground">Votre journée</h3>
                  {result.day_plan.map((item, i) => {
                    const colors = BLOCK_COLORS[item.block_type] || BLOCK_COLORS.admin;
                    const reformulation = result.reformulations.find(r => r.task_id === item.task_id);
                    const isReformulated = reformulation && acceptedReformulations.has(item.task_id);
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`p-3 rounded-2xl border ${colors.border} ${colors.bg} flex items-center gap-3`}
                      >
                        <div className="text-right w-24 shrink-0">
                          <span className="font-mono text-xs font-bold text-muted-foreground">
                            {item.start_time}–{item.end_time}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${isReformulated ? "line-through text-muted-foreground" : "text-foreground"}`}>
                            {item.original_label}
                          </p>
                          {isReformulated && (
                            <p className="text-sm font-medium text-foreground flex items-center gap-1">
                              <Wand2 className="w-3 h-3 text-purple-400 shrink-0" />
                              {reformulation.improved_label}
                            </p>
                          )}
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} border ${colors.border}`}>
                          {item.block_label}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Splits section */}
                {result.splits.length > 0 && (
                  <div>
                    <button onClick={() => setShowSplits(!showSplits)} className="flex items-center gap-2 text-sm font-bold text-foreground w-full">
                      <Scissors className="w-4 h-4 text-amber-400" />
                      Tâches découpées ({result.splits.length})
                      {showSplits ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
                    </button>
                    <AnimatePresence>
                      {showSplits && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-2 space-y-3">
                          {result.splits.map((split, i) => (
                            <div key={i} className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5">
                              <p className="text-xs text-muted-foreground mb-2">
                                <span className="line-through">{split.original_label}</span>
                                <span className="ml-2 text-amber-400 font-bold">({split.original_duration} min → {split.subtasks.length} sous-tâches)</span>
                              </p>
                              {split.subtasks.map((sub, j) => (
                                <div key={j} className="flex items-center gap-2 text-xs py-1">
                                  <ArrowRight className="w-3 h-3 text-amber-400 shrink-0" />
                                  <span className="text-foreground font-medium">{sub.label}</span>
                                  <span className="text-muted-foreground ml-auto">{sub.duration} min</span>
                                </div>
                              ))}
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Reformulations section */}
                {result.reformulations.length > 0 && (
                  <div>
                    <button onClick={() => setShowReformulations(!showReformulations)} className="flex items-center gap-2 text-sm font-bold text-foreground w-full">
                      <Wand2 className="w-4 h-4 text-purple-400" />
                      Reformulations IA ({result.reformulations.length})
                      {showReformulations ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
                    </button>
                    <AnimatePresence>
                      {showReformulations && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-2 space-y-2">
                          {result.reformulations.map((ref, i) => (
                            <motion.button
                              key={i}
                              onClick={() => toggleReformulation(ref.task_id)}
                              className={`w-full text-left p-3 rounded-xl border transition-all ${
                                acceptedReformulations.has(ref.task_id)
                                  ? "border-purple-500/30 bg-purple-500/5"
                                  : "border-border/30 bg-card opacity-60"
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                {acceptedReformulations.has(ref.task_id)
                                  ? <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                                  : <XCircle className="w-4 h-4 text-muted-foreground shrink-0" />}
                                <span className="text-xs text-muted-foreground line-through">{ref.original_label}</span>
                              </div>
                              <p className="text-sm font-medium text-foreground ml-6">{ref.improved_label}</p>
                              <p className="text-[10px] text-muted-foreground ml-6 mt-1">{ref.reason}</p>
                            </motion.button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Deferred section */}
                {result.deferred.length > 0 && (
                  <div>
                    <button onClick={() => setShowDeferred(!showDeferred)} className="flex items-center gap-2 text-sm font-bold text-foreground w-full">
                      <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                      Reportées ({result.deferred.length})
                      {showDeferred ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
                    </button>
                    <AnimatePresence>
                      {showDeferred && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-2 space-y-1">
                          {result.deferred.map((d, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs p-2 rounded-lg bg-muted/20">
                              <span className="text-muted-foreground">{d.label}</span>
                              <span className="ml-auto text-[10px] text-muted-foreground">{d.reason}</span>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={generatePlan}
                    disabled={loading}
                    className="flex-1 py-3 rounded-2xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
                  >
                    Régénérer
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={validateDay}
                    disabled={validating}
                    className="flex-1 py-3 rounded-2xl gradient-primary text-primary-foreground text-sm font-bold shadow-soft disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {validating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    {validating ? "Validation..." : "Valider cette journée ✨"}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
